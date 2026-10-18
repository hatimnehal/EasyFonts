import { app, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createBackend } from "../server/index.mjs";

// One real UI capture with public OFL fixtures, no access to the personal library.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let window, running, temporary;
app.on("window-all-closed", () => {});
app.whenReady().then(async () => {
  try {
    temporary = await fs.mkdtemp(path.join(os.tmpdir(), "easyfonts-docs-"));
    const backend = await createBackend({
      dataDir: temporary,
      desktop: true,
      port: 0,
      chooseFiles: async () => [path.join(root, "sample-fonts-pack.zip")],
    });
    running = await backend.listen(0);
    window = new BrowserWindow({
      show: false,
      width: 1440,
      height: 960,
      useContentSize: true,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        offscreen: true,
        backgroundThrottling: false,
        preload: path.join(root, "electron/preload.cjs"),
      },
    });
    await window.loadURL(running.url);
    const js = (code) => window.webContents.executeJavaScript(code);
    async function until(expression) {
      const deadline = Date.now() + 30000;
      while (Date.now() < deadline) {
        if (await js(expression)) return;
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      throw Error("Schermata documentazione non pronta");
    }
    await until(
      '!!document.querySelector(".upload-tile") && !!window.easyfonts?.desktop',
    );
    await js('document.querySelector(".upload-tile").click()');
    await until(
      'document.querySelectorAll(".font-row").length === 4 && !!document.querySelector(".workspace")',
    );
    await until('[...document.fonts].some(face => face.status === "loaded")');
    await js(
      "document.fonts.ready.then(() => new Promise(resolve => setTimeout(resolve, 800)))",
    );
    const text = (await js("document.body.innerText")).toLowerCase();
    if (
      [os.homedir(), os.userInfo().username, os.hostname()].some(
        (value) => value.length >= 5 && text.includes(value.toLowerCase()),
      )
    )
      throw Error("Cattura bloccata: dati locali visibili");
    await fs.mkdir(path.join(root, "docs/images"), { recursive: true });
    const capture = await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(Error("Rendering della cattura non disponibile")),
        10000,
      );
      window.webContents.once("paint", (_event, _dirty, image) => {
        clearTimeout(timeout);
        resolve(image);
      });
      window.webContents.invalidate();
    });
    await fs.writeFile(
      path.join(root, "docs/images/workspace.png"),
      capture.toPNG(),
    );
    console.log(
      "Screenshot workspace generato con quattro font pubblici, senza dati della libreria personale.",
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    window?.destroy();
    running?.server?.closeAllConnections();
    await running?.close();
    if (temporary) {
      if (
        path.dirname(temporary) !== path.resolve(os.tmpdir()) ||
        !path.basename(temporary).startsWith("easyfonts-docs-")
      )
        throw Error("Percorso temporaneo non valido");
      await fs.rm(temporary, { recursive: true, force: true });
    }
    app.exit(process.exitCode || 0);
  }
});
