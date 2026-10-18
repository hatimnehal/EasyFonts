import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import AdmZip from "adm-zip";
import wawoff2 from "wawoff2";
import {
  inside,
  isJunk,
  protectedFont,
  licenseCategory,
  parseFont,
  nativeFont,
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
