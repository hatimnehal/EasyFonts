import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createBackend } from "../server/index.mjs";

test("selettori desktop: import nativo, cartella e annullamento", async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "easyfonts-native-"));
  const sample = path.resolve("sample-fonts-pack.zip");
  let pickFiles = [sample],
    pickDirectory = path.join(dataDir, "fixture");
  await fs.mkdir(pickDirectory);
  await fs.copyFile(sample, path.join(pickDirectory, "fonts.zip"));
  const backend = await createBackend({
    dataDir,
    desktop: true,
    chooseFiles: async () => pickFiles,
    chooseDirectory: async () => pickDirectory,
  });
  const running = await backend.listen(0);
  try {
    const session = await (await fetch(running.url + "/api/session")).json();
    assert.equal(session.desktop, true);
    async function post(route) {
      const r = await fetch(running.url + "/api" + route, {
        method: "POST",
        headers: {
          "X-EasyFonts-Token": session.token,
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      assert.equal(r.status, 200, await r.clone().text());
      return r.json();
    }
    const upload = await post("/import-native");
    assert.equal(upload.fonts.length, 4);
    assert.deepEqual(upload.warnings, []);
    const folder = await post("/folder");
    assert.equal(folder.fonts.length, 4);
    assert.deepEqual(folder.warnings, []);
    const lato = folder.fonts.filter((f) => f.groupFamily === "Lato");
    assert.equal(lato.length, 2);
    assert.ok(lato.some((f) => f.style === "Bold"));
    const preferences = {
      sidebarWidth: 374,
      listView: "grid",
      previewLayout: "gallery",
      nativeNames: true,
      groupFamilies: true,
      editAllPreviews: false,
      globalPreviewText: null,
      previewTexts: {
        [`${folder.fonts[0].id}:positive`]: "Testo indipendente",
      },
      activeId: folder.fonts[1].id,
    };
    const update = await fetch(running.url + "/api/preferences", {
      method: "POST",
      headers: {
        "X-EasyFonts-Token": session.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferences),
    });
    assert.equal(update.status, 200);
    const newBackend = await createBackend({
      dataDir,
      desktop: true,
      chooseDirectory: async () => {
        throw Error("Il ripristino non deve aprire il selettore.");
      },
    });
    const resumed = await newBackend.listen(0);
    try {
      const auth = await (await fetch(resumed.url + "/api/session")).json();
      const response = await fetch(resumed.url + "/api/restore", {
        method: "POST",
        headers: {
          "X-EasyFonts-Token": auth.token,
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      const restored = await response.json();
      assert.equal(restored.folder, pickDirectory);
      assert.equal(restored.fonts.length, 4);
      assert.deepEqual(restored.preferences, preferences);
      await fs.rename(pickDirectory, pickDirectory + "-moved");
      const fallback = await (
        await fetch(resumed.url + "/api/restore", {
          method: "POST",
          headers: {
            "X-EasyFonts-Token": auth.token,
            "Content-Type": "application/json",
          },
          body: "{}",
        })
      ).json();
      assert.equal(fallback.fonts.length, 4);
      assert.ok(fallback.warnings.some((w) => w.includes("non è disponibile")));
      await fs.rename(pickDirectory + "-moved", pickDirectory);
    } finally {
      await resumed.close();
    }
    pickFiles = [];
    pickDirectory = "";
    assert.equal((await post("/import-native")).cancelled, true);
    assert.equal((await post("/folder")).cancelled, true);
  } finally {
    await running.close();
    assert.equal(path.dirname(dataDir), os.tmpdir());
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});
