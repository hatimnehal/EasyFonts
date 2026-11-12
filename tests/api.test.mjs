import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
test("API locale: import ZIP, licenze, protezioni, eliminazione recuperabile e riavvio", async () => {
  const data = await fs.mkdtemp(path.join(os.tmpdir(), "easyfonts-test-"));
  const port = 14318;
  const base = `http://127.0.0.1:${port}/api`;
  let child;
  let logs = "";
  async function start() {
    child = spawn(process.execPath, ["server/index.mjs"], {
      env: { ...process.env, PORT: String(port), EASYFONTS_DATA: data },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    child.stdout.on("data", (x) => (logs += x));
    child.stderr.on("data", (x) => (logs += x));
    for (let i = 0; i < 100; i++) {
      try {
        const r = await fetch(base + "/session");
        if (r.ok) return (await r.json()).token;
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    throw Error(logs || "Backend non avviato");
  }
  async function stop() {
    if (child && child.exitCode === null) {
      const done = new Promise((r) => child.once("exit", r));
      child.kill();
      await done;
    }
  }
  try {
    let token = await start();
    let r = await fetch(base + "/import", { method: "POST" });
    assert.equal(r.status, 403);
    r = await fetch(base + "/session", {
      headers: { Origin: "https://other.example" },
    });
    assert.equal(r.status, 403);

    // Test default-folder endpoint before import
    const initialDefault = await (await fetch(base + "/default-folder")).json();
    assert.equal(initialDefault.folder, null);

    const syncTargetDir = path.join(data, "synced-fonts");
    const unauthDefault = await fetch(base + "/default-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: syncTargetDir }),
    });
    assert.equal(unauthDefault.status, 403);

    const setDefault = await fetch(base + "/default-folder", {
      method: "POST",
      headers: {
        "X-EasyFonts-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ folder: syncTargetDir }),
    });
    assert.equal(setDefault.status, 200);
    const setDefaultRes = await setDefault.json();
    assert.equal(setDefaultRes.folder, syncTargetDir);
    assert.equal(setDefaultRes.ok, true);

    const currentDefault = await (await fetch(base + "/default-folder")).json();
    assert.equal(currentDefault.folder, syncTargetDir);

    const form = new FormData();
    form.append(
      "files",
      new Blob([
        await fs.readFile(new URL("../sample-fonts-pack.zip", import.meta.url)),
      ]),
      "sample.zip",
    );
    r = await fetch(base + "/import", {
      method: "POST",
      headers: { "X-EasyFonts-Token": token },
      body: form,
    });
    assert.equal(r.status, 200, await r.clone().text());
    const imported = await r.json();
    assert.equal(imported.fonts.length, 4);
    assert.deepEqual(imported.warnings, []);
    for (const f of imported.fonts) {
      assert.equal(f.category, "commercial");
      assert.ok(
        f.licenses.some((l) => l.text.includes("SIL OPEN FONT LICENSE")),
      );
      assert.ok(Array.isArray(f.features), "features deve essere un array");
      assert.ok(Array.isArray(f.axes), "axes deve essere un array");
      assert.ok(
        f.metrics && typeof f.metrics === "object",
        "metrics deve essere un oggetto",
      );
      assert.ok(
        Array.isArray(f.sampleGlyphs),
        "sampleGlyphs deve essere un array",
      );
      assert.ok((await fetch(`http://127.0.0.1:${port}${f.url}`)).ok);
    }

    // Verify auto-sync to default folder
    const syncedFiles = await fs.readdir(syncTargetDir);
    assert.ok(
      syncedFiles.length > 0,
      "I font importati devono essere sincronizzati nella cartella predefinita",
    );

    // Verify chunked upload API
    const initRes = await fetch(base + "/upload/init", {
      method: "POST",
      headers: {
        "X-EasyFonts-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ totalFiles: 1 }),
    });
    assert.equal(initRes.status, 200);
    const { uploadId } = await initRes.json();
    assert.ok(uploadId);

    const chunkForm = new FormData();
    chunkForm.append("uploadId", uploadId);
    chunkForm.append("isLast", "true");
    chunkForm.append(
      "files",
      new Blob([
        await fs.readFile(new URL("../sample-fonts-pack.zip", import.meta.url)),
      ]),
      "sample-chunk.zip",
    );
    const chunkRes = await fetch(base + "/upload/chunk", {
      method: "POST",
      headers: { "X-EasyFonts-Token": token },
      body: chunkForm,
    });
    assert.equal(chunkRes.status, 200);
    const chunkData = await chunkRes.json();
    assert.equal(chunkData.done, true);
    assert.ok(chunkData.fonts.length > 0);
    const id = imported.fonts[0].id;
    r = await fetch(base + "/delete", {
      method: "POST",
      headers: {
        "X-EasyFonts-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: [id], mode: "system" }),
    });
    assert.equal((await r.json()).results[0].ok, false);
    r = await fetch(base + "/delete", {
      method: "POST",
      headers: {
        "X-EasyFonts-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: [id], mode: "library" }),
    });
    assert.equal((await r.json()).results[0].ok, true);
    assert.equal((await fs.readdir(path.join(data, "trash"))).length, 2);
    await stop();
    token = await start();
    const library = await (await fetch(base + "/library")).json();
    assert.equal(library.fonts.length, 3);
    const archive = await (await fetch(base + "/licenses")).json();
    assert.equal(archive.fonts.length, 4);
    assert.ok(archive.fonts.find((f) => f.id === id).licenses.length);
    if (process.platform === "win32") {
      const scan = await fetch(base + "/system", {
        method: "POST",
        headers: {
          "X-EasyFonts-Token": token,
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      assert.equal(scan.status, 200, await scan.clone().text());
      const pc = await scan.json();
      assert.ok(pc.fonts.length > 0);
      const arial = pc.fonts.find((f) => /^Arial/i.test(f.name));
      assert.ok(arial);
      assert.equal(arial.protected, true);
      const deletion = await fetch(base + "/delete", {
        method: "POST",
        headers: {
          "X-EasyFonts-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: [arial.id], mode: "system" }),
      });
      assert.equal((await deletion.json()).results[0].ok, false);
    }
  } finally {
    await stop();
    await fs.rm(data, { recursive: true, force: true });
  }
});
