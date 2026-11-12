import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import AdmZip from "adm-zip";
import wawoff2 from "wawoff2";
import {
  inside,
  isJunk,
  protectedFont,
  licenseCategory,
  parseFont,
  nativeFont,
  walk,
} from "../server/core.mjs";
test("i percorsi non possono uscire dalla radice autorizzata", () => {
  assert.equal(inside("C:\\Fonts", "C:\\Fonts\\font.ttf"), true);
  assert.equal(inside("C:\\Fonts", "C:\\Fonts-other\\font.ttf"), false);
  assert.equal(inside("C:\\Fonts", "C:\\Fonts\\..\\Windows\\font.ttf"), false);
});
test("font essenziali e file spazzatura sono identificati", () => {
  for (const name of [
    "Arial Bold",
    "Segoe UI Variable",
    "Tahoma",
    "San Francisco",
    "SF Pro Text",
  ])
    assert.equal(protectedFont(name), true, name);
  assert.equal(protectedFont("Bangers Regular"), false);
  assert.equal(isJunk("__MACOSX/._Font.ttf"), true);
  assert.equal(isJunk("Lato/Lato-Regular.ttf"), false);
});
test("la licenza sconosciuta non viene dichiarata commerciale", () => {
  assert.equal(licenseCategory(""), "unknown");
  assert.equal(licenseCategory("For personal use only"), "personal");
  assert.equal(
    licenseCategory("SIL OPEN FONT LICENSE Version 1.1"),
    "commercial",
  );
});
test("i quattro TTF di esempio sono reali e il WOFF2 si converte per il sistema", async () => {
  const zip = new AdmZip(
    await fs.readFile(new URL("../sample-fonts-pack.zip", import.meta.url)),
  );
  const fonts = zip.getEntries().filter((e) => e.entryName.endsWith(".ttf"));
  assert.equal(fonts.length, 4);
  for (const entry of fonts) {
    const f = await parseFont(entry.getData(), entry.entryName);
    assert.ok(f.family);
    assert.ok(f.font.numGlyphs > 100);
  }
  const buffer = fonts[0].getData();
  const compressed = Buffer.from(await wawoff2.compress(buffer));
  const parsed = await parseFont(compressed, "test.woff2");
  const native = await nativeFont(compressed, "test.woff2");
  assert.equal(native.ext, ".ttf");
  assert.equal(
    (await parseFont(native.buffer, "test.ttf")).family,
    parsed.family,
  );
});

test("estrazione metadati OpenType avanzati: features, axes, metrics, sampleGlyphs", async () => {
  const zip = new AdmZip(
    await fs.readFile(new URL("../sample-fonts-pack.zip", import.meta.url)),
  );
  const fonts = zip.getEntries().filter((e) => e.entryName.endsWith(".ttf"));
  assert.equal(fonts.length, 4);
  for (const entry of fonts) {
    const f = await parseFont(entry.getData(), entry.entryName);
    assert.ok(Array.isArray(f.features), `${entry.entryName} features array`);
    assert.ok(Array.isArray(f.axes), `${entry.entryName} axes array`);
    assert.ok(
      f.metrics && typeof f.metrics === "object",
      `${entry.entryName} metrics object`,
    );
    assert.ok(Number.isFinite(f.metrics.numGlyphs) && f.metrics.numGlyphs > 100);
    assert.ok(Number.isFinite(f.metrics.unitsPerEm) && f.metrics.unitsPerEm >= 16);
    assert.ok(Number.isFinite(f.metrics.ascender));
    assert.ok(Number.isFinite(f.metrics.descender));
    assert.ok(["TTF", "OTF", "WOFF", "WOFF2"].includes(f.metrics.format));
    assert.ok(
      Array.isArray(f.sampleGlyphs),
      `${entry.entryName} sampleGlyphs array`,
    );
    assert.ok(f.sampleGlyphs.length > 0 && f.sampleGlyphs.length <= 160);
    assert.ok(f.sampleGlyphs.every((g) => typeof g === "string" && g.length > 0));
    // Backward compatibility: raw opentype object
    assert.ok(f.font && f.font.numGlyphs > 100);

    if (entry.entryName.includes("Bangers")) {
      assert.ok(f.features.includes("zero"));
      assert.ok(f.features.includes("frac"));
      assert.equal(f.metrics.numGlyphs, 597);
    }
    if (entry.entryName.includes("Lato-Regular")) {
      assert.ok(f.features.includes("liga"));
      assert.ok(f.features.includes("tnum"));
      assert.ok(f.features.includes("ss01"));
      assert.equal(f.metrics.numGlyphs, 3023);
    }
  }
});

test("walk esplora cartelle nidificate senza limiti arbitrari", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "easyfonts-walk-"));
  try {
    const sub1 = path.join(tempDir, "a", "b", "c");
    await fs.mkdir(sub1, { recursive: true });
    await fs.writeFile(path.join(tempDir, "root.ttf"), "font");
    await fs.writeFile(path.join(tempDir, "a", "level1.ttf"), "font");
    await fs.writeFile(path.join(sub1, "deep.ttf"), "font");
    await fs.writeFile(path.join(sub1, ".hidden.ttf"), "font");

    const found = await walk(tempDir);
    assert.equal(found.length, 3);
    const basenames = found.map((f) => path.basename(f)).sort();
    assert.deepEqual(basenames, ["deep.ttf", "level1.ttf", "root.ttf"]);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
