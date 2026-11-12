import express from "express";
import multer from "multer";
import AdmZip from "adm-zip";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  fontExtensions,
  isJunk,
  isLicense,
  hash,
  inside,
  protectedFont,
  licenseCategory,
  parseFont,
  nativeFont,
  walk,
} from "./core.mjs";
import {
  userFonts,
  systemFonts,
  chooseFolder,
  registerFont,
  availableDirectories,
} from "./system.mjs";

import { createWorkspaceStore } from "./preferences.mjs";
import { searchOnlineFonts, downloadOnlineFont } from "./online.mjs";

export async function createBackend(options = {}) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const data =
    options.dataDir ||
    (process.env.EASYFONTS_DATA
      ? path.resolve(process.env.EASYFONTS_DATA)
      : path.join(root, ".easyfonts"));
  await fs.mkdir(path.join(data, "fonts"), { recursive: true });
  await fs.mkdir(path.join(data, "licenses"), { recursive: true });
  await fs.mkdir(path.join(data, "trash"), { recursive: true });
  const workspaceStore = await createWorkspaceStore(data);
  const database = path.join(data, "database.json");
  let db = { version: 1, fonts: [] };
  try {
    db = JSON.parse(await fs.readFile(database, "utf8"));
    if (db.version !== 1 || !Array.isArray(db.fonts))
      throw Error("Database non valido");
  } catch (e) {
    if (e.code !== "ENOENT")
      throw new Error(
        `Impossibile leggere il database: ${e.message}. Il file originale è stato conservato.`,
      );
  }
  async function save() {
    const temp = database + ".tmp";
    await fs.writeFile(temp, JSON.stringify(db, null, 2));
    await fs.rename(temp, database);
  }
  const app = express();
  let port = Number(options.port ?? process.env.PORT ?? 4318);
  const token = crypto.randomBytes(32).toString("hex");
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    if (!["127.0.0.1", "localhost"].includes(req.hostname))
      return res.status(403).json({ error: "Host non autorizzato." });
    const origin = req.headers.origin;
    if (
      origin &&
      ![
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        `http://127.0.0.1:${port}`,
        `http://localhost:${port}`,
      ].includes(origin)
    )
      return res.status(403).json({ error: "Origine non autorizzata." });
    res.set("X-Content-Type-Options", "nosniff");
    if (options.desktop)
      res.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'self'; base-uri 'none'; form-action 'self'",
      );
    if (
      req.path.startsWith("/api") &&
      req.method !== "GET" &&
      req.headers["x-easyfonts-token"] !== token
    )
      return res
        .status(403)
        .json({ error: "Sessione non valida. Ricarica EasyFonts." });
    next();
  });
  app.use(express.json({ limit: "50mb" }));
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 },
  });
  let queue = Promise.resolve();
  const mutate = (fn) => (req, res, next) => {
    const job = queue.then(() => fn(req, res));
    queue = job.catch(() => {});
    job.catch(next);
  };
  const publicFont = (f) => ({
    id: f.id,
    name: f.name,
    family: f.family,
    groupFamily: f.groupFamily || f.family,
    style: f.style,
    filename: f.filename,
    protected: f.protected,
    installed: !!f.installedPath,
    source: f.source,
    category: f.category,
    licenses: f.licenses,
    metadata: f.metadata,
    url: `/api/fonts/${f.id}/file`,
    features: f.features || [],
    axes: f.axes || [],
    metrics: f.metrics || null,
    sampleGlyphs: f.sampleGlyphs || [],
  });
  const getFont = (id) => {
    const f = db.fonts.find((f) => f.id === id);
    if (!f) throw Error("Font non trovato.");
    return f;
  };
  const warn = [];
  async function licenseRecord(entry) {
    const id = hash(entry.buffer);
    const pdf = path.extname(entry.name).toLowerCase() === ".pdf";
    const filename = id + (pdf ? ".pdf" : ".txt");
    await fs.writeFile(path.join(data, "licenses", filename), entry.buffer);
    return {
      id,
      name: entry.name,
      pdf,
      text: pdf ? "" : entry.buffer.toString("utf8"),
      url: `/api/licenses/${filename}`,
    };
  }
  async function ingest(entries, source = "upload", options = {}) {
    const { knownLicenses = [], autoSave = true } = options;
    const docs = entries.filter((e) => isLicense(e.name) && !isJunk(e.name));
    const records = new Map();
    for (const d of docs) {
      if (d.buffer.length > 8 * 1024 * 1024) {
        warn.push(`Licenza troppo grande ignorata: ${d.name}`);
        continue;
      }
      records.set(d, await licenseRecord(d));
    }
    const allLicenses = [...records.values(), ...knownLicenses];
    const result = [];
    for (const entry of entries.filter(
      (e) =>
        fontExtensions.has(path.extname(e.name).toLowerCase()) &&
        !isJunk(e.name),
    )) {
      try {
        const id = hash(entry.buffer),
          existing = db.fonts.find((f) => f.id === id);
        const parsed =
          existing?.groupFamily && existing?.features && existing?.metrics
            ? existing
            : await parseFont(entry.buffer, entry.name);
        const dir = path.posix.dirname(entry.name.replaceAll("\\", "/"));
        const applicable = allLicenses.filter((lic) => {
          const ld =
            lic.dir || path.posix.dirname(lic.name.replaceAll("\\", "/"));
          return ld === "." || dir === ld || dir.startsWith(ld + "/");
        });
        const metadata = parsed.metadata || "";
        const combined = [metadata, ...applicable.map((l) => l.text)].join("\n");
        const dest = path.join(
          data,
          "fonts",
          id + path.extname(entry.name).toLowerCase(),
        );
        await fs.writeFile(dest, entry.buffer);
        const df = workspaceStore.preferences.defaultFolder;
        if (df) {
          try {
            const alreadyInDefault =
              entry.originalPath && inside(df, entry.originalPath);
            if (!alreadyInDefault) {
              await fs.mkdir(df, { recursive: true });
              const syncTarget = path.join(df, path.basename(entry.name));
              await fs.writeFile(syncTarget, entry.buffer);
            }
          } catch (syncErr) {
            warn.push(
              `Impossibile sincronizzare ${path.basename(entry.name)} nella cartella predefinita: ${syncErr.message}`,
            );
          }
        }
        const f = existing || {
          id,
          name: parsed.name,
          family: parsed.family,
          style: parsed.style,
          metadata,
          filename: path.basename(entry.name),
          path: dest,
          source,
          protected: false,
          licenses: [],
          category: "unknown",
          features: parsed.features || [],
          axes: parsed.axes || [],
          metrics: parsed.metrics || null,
          sampleGlyphs: parsed.sampleGlyphs || [],
        };
        f.path = dest;
        f.family = parsed.family;
        f.style = parsed.style;
        f.groupFamily = parsed.groupFamily;
        f.source = source;
        f.sourcePath = entry.originalPath || f.sourcePath;
        f.features = parsed.features || f.features || [];
        f.axes = parsed.axes || f.axes || [];
        f.metrics = parsed.metrics || f.metrics || null;
        f.sampleGlyphs = parsed.sampleGlyphs || f.sampleGlyphs || [];
        f.licenses = [
          ...new Map(
            [...f.licenses, ...applicable].map((l) => [l.id, l]),
          ).values(),
        ];
        f.category = licenseCategory(
          [combined, ...f.licenses.map((l) => l.text)].join("\n"),
        );
        f.protected = protectedFont(f.name + " " + f.filename);
        if (!existing) db.fonts.push(f);
        result.push(publicFont(f));
      } catch (e) {
        warn.push(`${path.basename(entry.name)}: ${e.message}`);
      }
    }
    if (autoSave) await save();
    return result;
  }
  function unzip(buffer, prefix = "") {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    const result = [];
    for (const e of entries) {
      if (e.isDirectory || isJunk(e.entryName)) continue;
      const normalized = e.entryName.replaceAll("\\", "/");
      if (
        normalized.split("/").includes("..") ||
        normalized.startsWith("/") ||
        /^[a-z]:/i.test(normalized)
      )
        throw Error("Percorso non sicuro nello ZIP.");
      if (
        fontExtensions.has(path.extname(normalized).toLowerCase()) ||
        isLicense(normalized)
      )
        result.push({ name: prefix + normalized, buffer: e.getData() });
    }
    return result;
  }
  app.get("/api/session", (_req, res) =>
    res.json({ token, platform: process.platform, desktop: !!options.desktop }),
  );
  app.get("/api/library", (_req, res) =>
    res.json({
      fonts: db.fonts
        .filter((f) => f.source !== "system" && f.source !== "archived")
        .map(publicFont),
    }),
  );
  app.post(
    "/api/import",
    upload.array("files"),
    mutate(async (req, res) => {
      warn.length = 0;
      let fonts = [];
      for (const file of req.files || []) {
        const name = Buffer.from(file.originalname, "latin1").toString("utf8");
        if (path.extname(name).toLowerCase() === ".zip")
          fonts.push(...(await ingest(unzip(file.buffer))));
        else if (fontExtensions.has(path.extname(name).toLowerCase()))
          fonts.push(...(await ingest([{ name, buffer: file.buffer }])));
        else warn.push(`Formato ignorato: ${name}`);
      }
      await workspaceStore.remember(fonts);
      res.json({
        fonts: [...new Map(fonts.map((f) => [f.id, f])).values()],
        warnings: [...warn],
      });
    }),
  );
  app.post(
    "/api/import-native",
    mutate(async (_req, res) => {
      if (!options.chooseFiles)
        return res
          .status(400)
          .json({ error: "Selettore file disponibile nell’app desktop." });
      const files = await options.chooseFiles();
      if (!files.length)
        return res.json({ cancelled: true, fonts: [], warnings: [] });
      warn.length = 0;
      let fonts = [];
      for (const file of files) {
        const name = path.basename(file),
          ext = path.extname(file).toLowerCase();
        try {
          if ((await fs.stat(file)).size > 80 * 1024 * 1024)
            throw Error("File troppo grande (massimo 80 MB).");
          const buffer = await fs.readFile(file);
          if (ext === ".zip") fonts.push(...(await ingest(unzip(buffer))));
          else if (fontExtensions.has(ext))
            fonts.push(...(await ingest([{ name, buffer }])));
          else warn.push(`Formato ignorato: ${name}`);
        } catch (e) {
          warn.push(`${name}: ${e.message}`);
        }
      }
      await workspaceStore.remember(fonts);
      res.json({
        fonts: [...new Map(fonts.map((f) => [f.id, f])).values()],
        warnings: [...warn],
      });
    }),
  );
  async function scanFolder(folder) {
    warn.length = 0;
    const files = await walk(folder);
    const licensePaths = [];
    const zipPaths = [];
    const fontPaths = [];

    for (const file of files) {
      const name = path.relative(folder, file).replaceAll("\\", "/");
      const ext = path.extname(file).toLowerCase();
      if (isJunk(name)) continue;
      if (isLicense(name)) licensePaths.push({ name, file });
      else if (ext === ".zip") zipPaths.push({ name, file });
      else if (fontExtensions.has(ext)) fontPaths.push({ name, file });
    }

    const looseLicenseRecords = [];
    for (const lic of licensePaths) {
      try {
        const stat = await fs.stat(lic.file);
        if (stat.size > 8 * 1024 * 1024) {
          warn.push(`Licenza troppo grande ignorata: ${lic.name}`);
          continue;
        }
        const buffer = await fs.readFile(lic.file);
        const record = await licenseRecord({ name: lic.name, buffer });
        record.dir = path.posix.dirname(lic.name);
        looseLicenseRecords.push(record);
      } catch (e) {
        warn.push(`Impossibile leggere licenza ${lic.name}: ${e.message}`);
      }
    }

    const fonts = [];

    for (const zip of zipPaths) {
      try {
        const buffer = await fs.readFile(zip.file);
        const entries = unzip(buffer);
        const ingested = await ingest(entries, "folder", { autoSave: false });
        fonts.push(...ingested);
      } catch (e) {
        warn.push(`${zip.name}: ${e.message}`);
      }
    }

    const CHUNK_SIZE = 50;
    for (let i = 0; i < fontPaths.length; i += CHUNK_SIZE) {
      const chunkPaths = fontPaths.slice(i, i + CHUNK_SIZE);
      const chunkEntries = [];
      for (const item of chunkPaths) {
        try {
          const stat = await fs.stat(item.file);
          if (stat.size > 80 * 1024 * 1024) {
            warn.push(`${item.name}: File troppo grande (massimo 80 MB).`);
            continue;
          }
          const buffer = await fs.readFile(item.file);
          chunkEntries.push({
            name: item.name,
            buffer,
            originalPath: item.file,
          });
        } catch (e) {
          warn.push(`${item.name}: ${e.message}`);
        }
      }
      if (chunkEntries.length > 0) {
        const ingested = await ingest(chunkEntries, "folder", {
          knownLicenses: looseLicenseRecords,
          autoSave: false,
        });
        fonts.push(...ingested);
      }
    }

    await save();

    return {
      fonts: [...new Map(fonts.map((f) => [f.id, f])).values()],
      warnings: [...warn],
      folder,
    };
  }
  async function scanSystem() {
    const fonts = [];
    warn.length = 0;
    for (const dir of await availableDirectories()) {
      const files = await walk(dir);
      for (const file of files.filter((f) =>
        fontExtensions.has(path.extname(f).toLowerCase()),
      )) {
        try {
          const buffer = await fs.readFile(file),
            id = hash(buffer);
          let f =
            db.fonts.find((f) => f.installedPath === file) ||
            db.fonts.find((f) => f.id === id);
          if (!f) {
            const parsed = await parseFont(buffer, file);
            f = {
              id,
              name: parsed.name,
              family: parsed.family,
              groupFamily: parsed.groupFamily,
              style: parsed.style,
              metadata: parsed.metadata,
              filename: path.basename(file),
              path: file,
              source: "system",
              licenses: [],
              category: licenseCategory(parsed.metadata),
              features: parsed.features || [],
              axes: parsed.axes || [],
              metrics: parsed.metrics || null,
              sampleGlyphs: parsed.sampleGlyphs || [],
            };
            db.fonts.push(f);
          }
          if (!f.groupFamily || !f.features || !f.metrics) {
            const parsed = await parseFont(buffer, file);
            f.family = parsed.family;
            f.style = parsed.style;
            f.groupFamily = parsed.groupFamily;
            f.features = parsed.features || [];
            f.axes = parsed.axes || [];
            f.metrics = parsed.metrics || null;
            f.sampleGlyphs = parsed.sampleGlyphs || [];
          }
          f.installedPath = file;
          // All OS-owned locations are read-only; the user-font directory permits cleanup.
          f.protected =
            !inside(userFonts, file) ||
            protectedFont(f.name + " " + f.filename);
          fonts.push(publicFont(f));
        } catch (e) {
          warn.push(`${path.basename(file)}: ${e.message}`);
        }
      }
    }
    await save();

    return {
      fonts: [...new Map(fonts.map((f) => [f.id, f])).values()],
      warnings: [...warn],
    };
  }

  const activeUploads = new Map();
  const cleanupStaleUploads = () => {
    const now = Date.now();
    for (const [id, session] of activeUploads.entries()) {
      if (now - session.createdAt > 30 * 60 * 1000) activeUploads.delete(id);
    }
  };

  app.post(
    "/api/upload/init",
    mutate(async (req, res) => {
      cleanupStaleUploads();
      const uploadId = crypto.randomUUID();
      activeUploads.set(uploadId, {
        uploadId,
        fonts: [],
        warnings: [],
        createdAt: Date.now(),
        totalFiles: Number(req.body?.totalFiles || 0),
      });
      res.json({ uploadId });
    }),
  );

  app.post(
    "/api/upload/chunk",
    upload.array("files"),
    mutate(async (req, res) => {
      const uploadId = req.body?.uploadId;
      if (!uploadId || !activeUploads.has(uploadId)) {
        return res
          .status(404)
          .json({ error: "Sessione di caricamento non valida o scaduta." });
      }
      const session = activeUploads.get(uploadId);
      session.createdAt = Date.now();
      const isLast = req.body?.isLast === "true" || req.body?.isLast === true;
      warn.length = 0;
      const chunkFonts = [];

      for (const file of req.files || []) {
        const name = Buffer.from(file.originalname, "latin1").toString("utf8");
        const ext = path.extname(name).toLowerCase();
        try {
          if (ext === ".zip") {
            chunkFonts.push(
              ...(await ingest(unzip(file.buffer), "upload", {
                autoSave: false,
              })),
            );
          } else if (fontExtensions.has(ext)) {
            chunkFonts.push(
              ...(await ingest([{ name, buffer: file.buffer }], "upload", {
                autoSave: false,
              })),
            );
          } else if (isLicense(name)) {
            await ingest([{ name, buffer: file.buffer }], "upload", {
              autoSave: false,
            });
          } else {
            warn.push(`Formato ignorato: ${name}`);
          }
        } catch (e) {
          warn.push(`${name}: ${e.message}`);
        }
      }

      session.fonts.push(...chunkFonts);
      session.warnings.push(...warn);

      if (isLast) {
        await save();
        const uniqueFonts = [
          ...new Map(session.fonts.map((f) => [f.id, f])).values(),
        ];
        await workspaceStore.remember(uniqueFonts);
        activeUploads.delete(uploadId);
        return res.json({
          fonts: uniqueFonts,
          warnings: [...new Set(session.warnings)],
          done: true,
        });
      }

      res.json({
        uploadId,
        received: req.files?.length || 0,
        totalSoFar: session.fonts.length,
        done: false,
      });
    }),
  );

  app.post(
    "/api/upload/complete",
    mutate(async (req, res) => {
      const uploadId = req.body?.uploadId;
      if (!uploadId || !activeUploads.has(uploadId)) {
        return res
          .status(404)
          .json({ error: "Sessione di caricamento non valida o scaduta." });
      }
      const session = activeUploads.get(uploadId);
      await save();
      const uniqueFonts = [
        ...new Map(session.fonts.map((f) => [f.id, f])).values(),
      ];
      await workspaceStore.remember(uniqueFonts);
      activeUploads.delete(uploadId);
      res.json({
        fonts: uniqueFonts,
        warnings: [...new Set(session.warnings)],
        done: true,
      });
    }),
  );

  app.post(
    "/api/folder",
    mutate(async (_req, res) => {
      const folder = await (options.chooseDirectory || chooseFolder)();
      if (!folder)
        return res.json({ cancelled: true, fonts: [], warnings: [] });
      const result = await scanFolder(folder);
      await workspaceStore.remember(result.fonts, "library", folder);
      res.json(result);
    }),
  );
  app.post(
    "/api/system",
    mutate(async (_req, res) => {
      const result = await scanSystem();
      await workspaceStore.remember(result.fonts, "system");
      res.json(result);
    }),
  );
  app.post(
    "/api/preferences",
    mutate(async (req, res) => res.json(await workspaceStore.update(req.body))),
  );
  app.get("/api/default-folder", (_req, res) =>
    res.json({ folder: workspaceStore.preferences.defaultFolder || null }),
  );
  app.post(
    "/api/default-folder",
    mutate(async (req, res) => {
      if (req.body?.choose) {
        const folder = await (options.chooseDirectory || chooseFolder)();
        if (!folder)
          return res.json({
            cancelled: true,
            folder: workspaceStore.preferences.defaultFolder || null,
          });
        await workspaceStore.update({ defaultFolder: folder });
        return res.json({ folder, ok: true });
      }
      if (req.body?.folder === null || req.body?.folder === "") {
        await workspaceStore.update({ defaultFolder: null });
        return res.json({ folder: null, ok: true });
      }
      if (typeof req.body?.folder === "string") {
        await fs.mkdir(req.body.folder, { recursive: true }).catch(() => {});
        await workspaceStore.update({ defaultFolder: req.body.folder });
        return res.json({ folder: req.body.folder, ok: true });
      }
      return res
        .status(400)
        .json({ error: "Specifica una cartella valida o choose: true." });
    }),
  );
  const handleOnlineSearch = async (req, res, next) => {
    try {
      const query = String(req.query.q ?? req.body?.query ?? req.body?.q ?? "");
      const source = String(req.query.source ?? req.body?.source ?? "all");
      const commercialOnly =
        req.query.commercial === "true" ||
        req.body?.commercial === true ||
        req.body?.commercial === "true";
      const result = await searchOnlineFonts({
        query,
        source,
        commercialOnly,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
  app.get("/api/online/search", handleOnlineSearch);
  app.post("/api/online/search", handleOnlineSearch);
  app.post(
    "/api/online/download",
    mutate(async (req, res) => {
      const items = req.body?.items;
      if (!Array.isArray(items) || items.length === 0) {
        throw Error("Seleziona almeno un font online da scaricare.");
      }
      warn.length = 0;
      const downloadedFonts = [];
      for (const item of items) {
        const resDownload = await downloadOnlineFont(
          item,
          path.join(root, "sample-fonts-pack.zip"),
        );
        if (resDownload.zipBuffer) {
          const prefix = (item.downloadId || item.id || "font") + "/";
          downloadedFonts.push(
            ...(await ingest(unzip(resDownload.zipBuffer, prefix), "upload")),
          );
        } else if (resDownload.entries) {
          downloadedFonts.push(
            ...(await ingest(resDownload.entries, "upload")),
          );
        }
      }

      const currentWorkspaceIds = new Set(workspaceStore.workspace?.ids || []);
      const existingFonts = workspaceStore.workspace?.ids
        ? db.fonts
            .filter(
              (f) => currentWorkspaceIds.has(f.id) && f.source !== "archived",
            )
            .map(publicFont)
        : [];

      const mergedMap = new Map();
      for (const font of existingFonts) {
        mergedMap.set(font.id, font);
      }
      for (const font of downloadedFonts) {
        mergedMap.set(font.id, font);
      }
      const mergedFonts = [...mergedMap.values()];

      await workspaceStore.remember(
        mergedFonts,
        "library",
        workspaceStore.workspace?.folder,
      );

      res.json({
        fonts: mergedFonts,
        added: downloadedFonts,
        warnings: [...warn],
      });
    }),
  );
  app.post(
    "/api/restore",
    mutate(async (_req, res) => {
      const last = workspaceStore.workspace;
      const targetFolder =
        last?.folder || workspaceStore.preferences.defaultFolder;
      let result;
      if (targetFolder) {
        try {
          result = await scanFolder(targetFolder);
          await workspaceStore.remember(result.fonts, "library", targetFolder);
        } catch (error) {
          result = {
            fonts: db.fonts
              .filter(
                (f) =>
                  (last?.ids ? last.ids.includes(f.id) : true) &&
                  f.source !== "archived",
              )
              .map(publicFont),
            warnings: [
              `La cartella non è disponibile: ${targetFolder}. Uso le copie salvate. ${error.message}`,
            ],
            folder: targetFolder,
          };
        }
      } else if (last?.mode === "system") result = await scanSystem();
      else
        result = {
          fonts: db.fonts
            .filter(
              (f) =>
                f.source !== "archived" &&
                (last ? last.ids.includes(f.id) : f.source !== "system"),
            )
            .map(publicFont),
          warnings: [],
        };
      let updatedFamilies = false;
      for (const record of result.fonts) {
        const font = getFont(record.id);
        if (!font.groupFamily || !font.features || !font.metrics) {
          try {
            const parsed = await parseFont(
              await fs.readFile(font.path),
              font.filename,
            );
            font.family = parsed.family;
            font.style = parsed.style;
            font.groupFamily = parsed.groupFamily;
            font.features = parsed.features || [];
            font.axes = parsed.axes || [];
            font.metrics = parsed.metrics || null;
            font.sampleGlyphs = parsed.sampleGlyphs || [];
            updatedFamilies = true;
          } catch {}
        }
      }
      if (updatedFamilies) {
        await save();
        result.fonts = result.fonts.map((record) =>
          publicFont(getFont(record.id)),
        );
      }
      res.json({
        ...result,
        mode: last?.mode || "library",
        preferences: workspaceStore.preferences,
      });
    }),
  );
  app.get("/api/fonts/:id/file", async (req, res, next) => {
    try {
      const f = getFont(req.params.id);
      res.set("Cache-Control", "private, max-age=3600");
      res.sendFile(f.path, (err) => {
        if (err) next(err);
      });
    } catch (e) {
      next(e);
    }
  });
  app.get("/api/licenses", (_req, res) =>
    res.json({ fonts: db.fonts.map(publicFont) }),
  );
  app.get("/api/licenses/:name", async (req, res, next) => {
    if (!/^[a-f0-9]{64}\.(pdf|txt)$/.test(req.params.name))
      return res.sendStatus(404);
    res.set(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'self'",
    );
    res.sendFile(path.join(data, "licenses", req.params.name), (err) => {
      if (err) next(err);
    });
  });
  function requested(req) {
    if (!Array.isArray(req.body.ids) || !req.body.ids.length)
      throw Error("Seleziona almeno un font.");
    return [...new Set(req.body.ids)].map(getFont);
  }
  app.post(
    "/api/install",
    mutate(async (req, res) => {
      const fonts = requested(req),
        results = [];
      await fs.mkdir(userFonts, { recursive: true });
      for (const f of fonts) {
        let dest;
        try {
          if (f.installedPath) {
            try {
              await fs.access(f.installedPath);
              results.push({ id: f.id, ok: true, message: "Già installato" });
              continue;
            } catch {
              f.installedPath = undefined;
            }
          }
          const converted = await nativeFont(
            await fs.readFile(f.path),
            f.filename,
          );
          dest = path.join(userFonts, `EasyFonts-${f.id}${converted.ext}`);
          await fs
            .writeFile(dest, converted.buffer, { flag: "wx" })
            .catch((e) => {
              if (e.code !== "EEXIST") throw e;
            });
          await registerFont(
            dest,
            `${f.name} — EasyFonts ${f.id.slice(0, 12)} (TrueType)`,
          );
          f.installedPath = dest;
          f.installedAt = new Date().toISOString();
          await save();
          results.push({ id: f.id, ok: true });
        } catch (e) {
          if (dest && !f.installedPath) {
            await registerFont(dest, f.name, true).catch(() => {});
            await fs.unlink(dest).catch(() => {});
          }
          results.push({ id: f.id, ok: false, message: e.message });
        }
      }
      await save();
      res.json({ results, fonts: fonts.map(publicFont) });
    }),
  );
  app.post(
    "/api/delete",
    mutate(async (req, res) => {
      const fonts = requested(req),
        results = [];
      if (!["library", "system"].includes(req.body.mode))
        throw Error("Modalità non valida.");
      for (const f of fonts) {
        try {
          const file =
            req.body.mode === "system"
              ? f.installedPath
              : f.sourcePath || f.path;
          if (!file) throw Error("Percorso del font non disponibile.");
          if (
            req.body.mode === "system" &&
            (f.protected ||
              !inside(userFonts, file) ||
              protectedFont(f.name + " " + f.filename))
          )
            throw Error("Font di sistema protetto.");
          if (
            req.body.mode === "library" &&
            (systemFonts.some((d) => inside(d, file)) ||
              inside(userFonts, file))
          )
            throw Error("Usa Tutti i font del PC per disinstallare.");
          const recovery = path.join(
            data,
            "trash",
            `${Date.now()}-${crypto.randomUUID()}-${path.basename(file)}`,
          );
          await fs.copyFile(file, recovery);
          await fs.writeFile(
            recovery + ".json",
            JSON.stringify(
              { original: file, font: f.name, date: new Date().toISOString() },
              null,
              2,
            ),
          );
          if (req.body.mode === "system")
            await registerFont(file, f.name, true);
          try {
            await fs.unlink(file);
          } catch (e) {
            if (req.body.mode === "system")
              await registerFont(file, f.name).catch(() => {});
            throw e;
          }
          if (req.body.mode === "system") {
            f.installedPath = undefined;
            if (f.path === file) {
              const cached = path.join(
                data,
                "fonts",
                f.id + path.extname(file),
              );
              await fs.copyFile(recovery, cached);
              f.path = cached;
            }
          } else {
            f.sourcePath = undefined;
            f.source = "archived";
            if (f.path === file) f.path = recovery;
          }
          results.push({ id: f.id, ok: true });
          await save();
        } catch (e) {
          results.push({ id: f.id, ok: false, message: e.message });
        }
      }
      res.json({ results, recoveryDirectory: path.join(data, "trash") });
    }),
  );
  app.use(express.static(path.join(root, "dist")));
  app.get("/{*path}", (req, res) => {
    if (req.path.startsWith("/api/"))
      return res.status(404).json({ error: "Endpoint non trovato" });
    res.sendFile(path.join(root, "dist", "index.html"));
  });
  app.use((err, _req, res, _next) => {
    console.error(err.message);
    if (!res.headersSent)
      res
        .status(400)
        .json({ error: err.message || "Operazione non riuscita." });
  });
  return {
    app,
    dataDir: data,
    async listen(requestedPort = port) {
      const server = await new Promise((resolve, reject) => {
        const listener = app.listen(requestedPort, "127.0.0.1", () =>
          resolve(listener),
        );
        listener.once("error", reject);
      });
      port = server.address().port;
      return {
        server,
        url: `http://127.0.0.1:${port}`,
        close: async () => {
          await queue;
          return new Promise((resolve, reject) =>
            server.close((e) => (e ? reject(e) : resolve())),
          );
        },
      };
    },
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const backend = await createBackend();
  const running = await backend.listen();
  console.log(`EasyFonts locale: ${running.url} · dati: ${backend.dataDir}`);
}
