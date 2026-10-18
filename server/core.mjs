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
const english = (entry) => entry?.en || Object.values(entry || {})[0] || "";
export async function parseFont(buffer, filename) {
  let data = buffer;
  if (path.extname(filename).toLowerCase() === ".woff2")
    data = Buffer.from(await wawoff2.decompress(buffer));
  const font = opentype.parse(
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  );
  const legacyFamily =
    english(font.names.fontFamily) || path.parse(filename).name;
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
  return { name, family, groupFamily: family, style, metadata, font };
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
export async function walk(root, limit = 12000) {
  const found = [];
  async function visit(dir) {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      if (found.length >= limit)
        throw new Error(
          "Cartella troppo grande: seleziona una sottocartella (massimo 12.000 file).",
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
