import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
if (!process.env.ELECTRON_RUN_AS_NODE) {
  const child = spawn(
    path.resolve(".desktop-build/win-unpacked/EasyFonts.exe"),
    [fileURLToPath(import.meta.url)],
    {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
      stdio: "inherit",
      windowsHide: true,
    },
  );
  child.on("error", (e) => {
    console.error(e);
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
} else {
  const resources = path.join(path.dirname(process.execPath), "resources");
  for (const file of [
    "LICENSE.easyfonts.txt",
    "THIRD_PARTY_NOTICES.md",
    "THIRD_PARTY_LICENSES.txt",
  ]) {
    assert.ok(
      (await fs.readFile(path.join(resources, file), "utf8")).length > 100,
      `Avviso di licenza mancante: ${file}`,
    );
  }
  const archive = path.join(resources, "app.asar");
  const { createBackend } = await import(
    pathToFileURL(path.join(archive, "server/index.mjs")).href
  );
  const require = createRequire(
    pathToFileURL(path.join(archive, "package.json")),
  );
  const AdmZip = require("adm-zip"),
    wawoff2 = require("wawoff2");
  const { parseFont, nativeFont } = await import(
    pathToFileURL(path.join(archive, "server/core.mjs")).href
  );
  const sample = path.join(resources, "sample-fonts-pack.zip");
  const dataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "easyfonts-packaged-"),
  );
  const backend = await createBackend({
    dataDir,
    desktop: true,
    chooseFiles: async () => [sample],
  });
  const running = await backend.listen(0);
  try {
    const page = await fetch(running.url);
    assert.equal(page.status, 200);
    const html = await page.text();
    for (const [, asset] of html.matchAll(
      /(?:src|href)="([^\"]+\/assets\/[^\"]+|\/assets\/[^\"]+)"/g,
    )) {
      const response = await fetch(running.url + asset);
      assert.equal(response.status, 200, asset);
      await response.arrayBuffer();
    }
    const { token } = await (await fetch(running.url + "/api/session")).json();
    const result = await (
      await fetch(running.url + "/api/import-native", {
        method: "POST",
        headers: {
          "X-EasyFonts-Token": token,
          "Content-Type": "application/json",
        },
        body: "{}",
      })
    ).json();
    assert.equal(result.fonts.length, 4);
    assert.deepEqual(result.warnings, []);
    for (const f of result.fonts) {
      const response = await fetch(running.url + f.url);
      assert.equal(response.status, 200);
      await response.arrayBuffer();
      assert.equal(f.category, "commercial");
    }
    const zip = new AdmZip(await fs.readFile(sample)),
      font = zip.getEntries().find((e) => e.entryName.endsWith(".ttf"));
    const compressed = Buffer.from(await wawoff2.compress(font.getData()));
    const parsed = await parseFont(compressed, "packaged.woff2");
    const native = await nativeFont(compressed, "packaged.woff2");
    assert.equal(
      (await parseFont(native.buffer, "packaged.ttf")).family,
      parsed.family,
    );
    console.log(
      "PACKAGE PASS: runtime Windows, ASAR, UI compilata, import ZIP, 4 font, avvisi di licenza e WASM WOFF2.",
    );
  } finally {
    running.server.closeAllConnections();
    await running.close();
    assert.equal(path.dirname(dataDir), os.tmpdir());
    await fs.rm(dataDir, { recursive: true, force: true });
  }
}
