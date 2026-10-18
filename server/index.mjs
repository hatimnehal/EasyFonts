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
  app.use(express.json({ limit: "1mb" }));
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 80 * 1024 * 1024, files: 40, fields: 0 },
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
  async function ingest(entries, source = "upload") {
    const docs = entries.filter((e) => isLicense(e.name) && !isJunk(e.name));
    const records = new Map();
    for (const d of docs) {
      if (d.buffer.length > 8 * 1024 * 1024) {
        warn.push(`Licenza troppo grande ignorata: ${d.name}`);
        continue;
      }
      records.set(d, await licenseRecord(d));
    }
    const result = [];
    for (const entry of entries.filter(
      (e) =>
        fontExtensions.has(path.extname(e.name).toLowerCase()) &&
        !isJunk(e.name),
    )) {
      try {
        const id = hash(entry.buffer),
          existing = db.fonts.find((f) => f.id === id);
        const parsed = existing?.groupFamily
          ? existing
          : await parseFont(entry.buffer, entry.name);
        const dir = path.posix.dirname(entry.name.replaceAll("\\", "/"));
        const applicable = docs.filter((d) => {
          const ld = path.posix.dirname(d.name.replaceAll("\\", "/"));
          return ld === "." || dir === ld || dir.startsWith(ld + "/");
        });
        const licenses = applicable.map((d) => records.get(d)).filter(Boolean);
        const metadata = parsed.metadata;
        const combined = [metadata, ...licenses.map((l) => l.text)].join("\n");
        const dest = path.join(
          data,
          "fonts",
          id + path.extname(entry.name).toLowerCase(),
        );
        await fs.writeFile(dest, entry.buffer);
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
        };
        f.path = dest;
        f.family = parsed.family;
        f.style = parsed.style;
        f.groupFamily = parsed.groupFamily;
        f.source = source;
        f.sourcePath = entry.originalPath || f.sourcePath;
        f.licenses = [
          ...new Map(
            [...f.licenses, ...licenses].map((l) => [l.id, l]),
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
    await save();
    return result;
  }
  function unzip(buffer, prefix = "") {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    if (entries.length > 5000)
      throw Error("Archivio con troppi elementi (massimo 5.000).");
    let total = 0;
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
      total += e.header.size;
      if (total > 300 * 1024 * 1024 || e.header.size > 80 * 1024 * 1024)
        throw Error("ZIP troppo grande una volta estratto (massimo 300 MB).");
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
    upload.array("files", 40),
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
      if (files.length > 40)
        throw Error("Seleziona al massimo 40 file alla volta.");
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
    const loose = [];
    let fonts = [];
    let total = 0;
    for (const file of files) {
      const name = path.relative(folder, file).replaceAll("\\", "/");
      const ext = path.extname(file).toLowerCase();
      if (!(fontExtensions.has(ext) || ext === ".zip" || isLicense(name)))
        continue;
      const stat = await fs.stat(file);
      total += stat.size;
      if (stat.size > 80 * 1024 * 1024 || total > 500 * 1024 * 1024)
        throw Error(
          "La cartella supera il limite di 500 MB. Seleziona una sottocartella.",
        );
      const buffer = await fs.readFile(file);
      if (ext === ".zip") {
        try {
          fonts.push(...(await ingest(unzip(buffer), "folder")));
        } catch (e) {
          warn.push(`${name}: ${e.message}`);
        }
      } else loose.push({ name, buffer, originalPath: file });
    }
    fonts.push(...(await ingest(loose, "folder")));

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
            };
            db.fonts.push(f);
          }
          if (!f.groupFamily) {
            const parsed = await parseFont(buffer, file);
            f.family = parsed.family;
            f.style = parsed.style;
            f.groupFamily = parsed.groupFamily;
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
  app.post(
    "/api/restore",
    mutate(async (_req, res) => {
      const last = workspaceStore.workspace;
      let result;
      if (last?.folder) {
        try {
          result = await scanFolder(last.folder);
          await workspaceStore.remember(result.fonts, "library", last.folder);
        } catch (error) {
          result = {
            fonts: db.fonts
              .filter((f) => last.ids.includes(f.id) && f.source !== "archived")
              .map(publicFont),
            warnings: [
              `La cartella non è disponibile: ${last.folder}. Uso le copie salvate. ${error.message}`,
            ],
            folder: last.folder,
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
        if (!font.groupFamily) {
          try {
            const parsed = await parseFont(
              await fs.readFile(font.path),
              font.filename,
            );
            font.family = parsed.family;
            font.style = parsed.style;
            font.groupFamily = parsed.groupFamily;
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
    if (
      !Array.isArray(req.body.ids) ||
      !req.body.ids.length ||
      req.body.ids.length > 12000
    )
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
