import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import opentype from "opentype.js";
import wawoff2 from "wawoff2";

export const fontExtensions = new Set([".ttf", ".otf", ".woff", ".woff2"]);
export const isJunk = (name) =>
  name.split(/[\\/]/).some((p) => p === "__MACOSX" || p.startsWith("."));
export const isLicense = (name) =>
  /(^|\/)(license[^/]*|licence[^/]*|ofl[^/]*|readme[^/]*|[^/]+\.(txt|md|pdf))$/i.test(
    name.replaceAll("\\", "/"),
  );
export const hash = (data) =>
  crypto.createHash("sha256").update(data).digest("hex");
export const inside = (root, target) => {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  return (
    rel === "" ||
    (!rel.startsWith(".." + path.sep) && rel !== ".." && !path.isAbsolute(rel))
  );
};
export const protectedFont = (name) =>
  /arial|segoe|tahoma|san[ -]?francisco|^sf[ -]|sfpro|sfns|times new roman|courier new|microsoft|wingdings|webdings|symbol|calibri|cambria|consolas|candara|corbel|constantia|helvetica|lucida|lastresort|menlo|monaco|apple|pingfang|hiragino|noto|dejavu|liberation|ubuntu/i.test(
    name,
  );
export function licenseCategory(text) {
  if (/personal use only|non.commercial|solo uso personale/i.test(text))
    return "personal";
  if (
    /SIL OPEN FONT LICENSE|Apache License|Permission is hereby granted, free of charge|Ubuntu Font Licen[cs]e/i.test(
      text,
    )
  )
    return "commercial";
  return "unknown";
}
const english = (entry) =>
  typeof entry === "string"
    ? entry
    : entry?.en || Object.values(entry || {})[0] || "";

const standardAxisNames = {
  wght: "Weight",
  wdth: "Width",
  ital: "Italic",
  slnt: "Slant",
  opsz: "Optical Size",
};

export async function parseFont(buffer, filename) {
  let data = buffer;
  if (path.extname(filename || "").toLowerCase() === ".woff2")
    data = Buffer.from(await wawoff2.decompress(buffer));
  const font = opentype.parse(
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  );
  const legacyFamily =
    english(font.names.fontFamily) || path.parse(filename || "").name;
  const preferredFamily =
    english(font.names.preferredFamily) || english(font.names.wwsFamily);
  const suffix =
    legacyFamily.match(
      /(?:[ -](?:regular|italic|oblique|bold|semi[ -]?bold|demi[ -]?bold|extra[ -]?bold|ultra[ -]?bold|extra[ -]?light|ultra[ -]?light|light|thin|black|heavy|medium|book))+$/i,
    )?.[0] || "";
  const family =
    preferredFamily ||
    (suffix && legacyFamily.slice(0, -suffix.length).trim()) ||
    legacyFamily;
  const legacyStyle = english(font.names.fontSubfamily) || "Regular";
  const style =
    english(font.names.preferredSubfamily) ||
    (suffix && !preferredFamily
      ? [
          suffix.replaceAll("-", " ").trim(),
          /^(regular|normal)$/i.test(legacyStyle) ? "" : legacyStyle,
        ]
          .filter(Boolean)
          .join(" ")
      : legacyStyle);
  const name = english(font.names.fullName) || `${family} ${style}`;
  const metadata = [
    english(font.names.license),
    english(font.names.licenseURL),
    english(font.names.copyright),
  ]
    .filter(Boolean)
    .join("\n\n");

  // 1. Features extraction (GSUB / GPOS)
  const featureSet = new Set();
  try {
    for (const table of [font.tables?.gsub, font.tables?.gpos]) {
      if (table && Array.isArray(table.features)) {
        for (const f of table.features) {
          if (f && typeof f.tag === "string") {
            const tag = f.tag.trim();
            if (tag) featureSet.add(tag);
          }
        }
      }
    }
  } catch {}
  const features = Array.from(featureSet).sort();

  // 2. Variable axes extraction (fvar)
  const axes = [];
  try {
    if (font.tables?.fvar && Array.isArray(font.tables.fvar.axes)) {
      for (const a of font.tables.fvar.axes) {
        if (!a || !a.tag) continue;
        const axisName = english(a.name) || standardAxisNames[a.tag] || a.tag;
        const min = typeof a.minValue === "number" ? a.minValue : 0;
        const max = typeof a.maxValue === "number" ? a.maxValue : 100;
        const defaultValue =
          typeof a.defaultValue === "number" ? a.defaultValue : min;
        axes.push({
          tag: a.tag,
          name: axisName,
          min: Math.round(min * 100) / 100,
          max: Math.round(max * 100) / 100,
          defaultValue: Math.round(defaultValue * 100) / 100,
        });
      }
    }
  } catch {}

  // 3. Metrics extraction
  let metrics = null;
  try {
    const ext = path.extname(filename || "").replace(/^\./, "").toLowerCase();
    metrics = {
      numGlyphs: Number(font.numGlyphs ?? font.glyphs?.length ?? 0),
      unitsPerEm: Number(font.unitsPerEm ?? 1000),
      ascender: Number(font.ascender ?? 0),
      descender: Number(font.descender ?? 0),
      designer: english(font.names?.designer) || undefined,
      manufacturer: english(font.names?.manufacturer) || undefined,
      version: english(font.names?.version) || undefined,
      format: ext
        ? ext.toUpperCase()
        : font.outlinesFormat === "cff"
          ? "OTF"
          : "TTF",
    };
  } catch {}

  // 4. Sample glyphs extraction (up to 160 printable characters)
  const printableSet = new Set();
  try {
    if (font.glyphs && typeof font.glyphs.length === "number") {
      const total = font.glyphs.length;
      for (let i = 0; i < total && printableSet.size < 160; i++) {
        try {
          const g = font.glyphs.get(i);
          if (!g) continue;
          const codes =
            Array.isArray(g.unicodes) && g.unicodes.length
              ? g.unicodes
              : typeof g.unicode === "number"
                ? [g.unicode]
                : [];
          for (const u of codes) {
            if (u > 32 && u !== 127 && (u < 0xd800 || u > 0xdfff)) {
              printableSet.add(String.fromCodePoint(u));
              if (printableSet.size >= 160) break;
            }
          }
        } catch {}
      }
    }
  } catch {}
  const sampleGlyphs = Array.from(printableSet);

  return {
    name,
    family,
    groupFamily: family,
    style,
    metadata,
    features,
    axes,
    metrics,
    sampleGlyphs,
    font,
  };
}
export async function nativeFont(buffer, filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".ttf" || ext === ".otf") return { buffer, ext };
  let raw;
  if (ext === ".woff2") raw = Buffer.from(await wawoff2.decompress(buffer));
  else {
    const { font } = await parseFont(buffer, filename);
    raw = Buffer.from(font.toArrayBuffer());
  }
  return {
    buffer: raw,
    ext: raw.toString("ascii", 0, 4) === "OTTO" ? ".otf" : ".ttf",
  };
}
export async function walk(root, limit = Infinity) {
  const found = [];
  async function visit(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (e) {
      if (dir === root) throw e;
      return;
    }
    for (const e of entries) {
      if (Number.isFinite(limit) && found.length >= limit)
        throw new Error(
          `Cartella troppo grande: seleziona una sottocartella (massimo ${limit.toLocaleString()} file).`,
        );
      if (e.isSymbolicLink() || isJunk(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await visit(full);
      else if (e.isFile()) found.push(full);
    }
  }
  await visit(root);
  return found;
}
