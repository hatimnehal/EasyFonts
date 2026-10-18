import { app, BrowserWindow, dialog } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createBackend } from "../server/index.mjs";

app.setName("EasyFonts");
if (process.platform === "win32") app.setAppUserModelId("it.easyfonts.desktop");
const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
let window;
let running;
let shuttingDown = false;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.show();
      window.focus();
    }
  });
  app
    .whenReady()
    .then(async () => {
      const dataDir = path.join(app.getPath("userData"), "library");
      await migrateLibrary(dataDir);
      window = new BrowserWindow({
        width: 1200,
        height: 840,
        minWidth: 800,
        minHeight: 620,
        title: "EasyFonts",
        show: false,
        backgroundColor: "#f7f7f5",
        autoHideMenuBar: true,
        icon: path.join(project, "build", "icon.png"),
        webPreferences: {
          preload: path.join(project, "electron", "preload.cjs"),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      });
      window.setMenu(null);
      const backend = await createBackend({
        dataDir,
        desktop: true,
        port: 0,
        chooseDirectory: async () => {
          const result = await dialog.showOpenDialog(window, {
            title: "EasyFonts — Scegli una cartella di font",
            buttonLabel: "Apri cartella",
            properties: ["openDirectory"],
          });
          return result.canceled ? "" : result.filePaths[0] || "";
        },
        chooseFiles: async () => {
          const result = await dialog.showOpenDialog(window, {
            title: "EasyFonts — Carica font o archivi ZIP",
            buttonLabel: "Carica font",
            properties: ["openFile", "multiSelections"],
            filters: [
              {
                name: "Font e archivi ZIP",
                extensions: ["zip", "ttf", "otf", "woff", "woff2"],
              },
            ],
          });
          return result.canceled ? [] : result.filePaths;
        },
      });
      // An ephemeral loopback channel is private to this app's lifecycle; no browser or fixed port is needed.
      running = await backend.listen(0);
      window.webContents.on("will-navigate", (event, url) => {
        if (new URL(url).origin !== running.url) event.preventDefault();
      });
      window.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith(running.url + "/api/licenses/"))
          return {
            action: "allow",
            overrideBrowserWindowOptions: {
              width: 900,
              height: 760,
              autoHideMenuBar: true,
              webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
              },
            },
          };
        return { action: "deny" };
      });
      window.webContents.on("render-process-gone", (_event, details) => {
        dialog.showErrorBox(
          "EasyFonts",
          `La finestra si è interrotta (${details.reason}). Riapri l’app; i dati sono conservati.`,
        );
      });
      window.once("ready-to-show", () => {
        window.show();
        window.focus();
      });
      await window.loadURL(running.url);
      window.on("closed", () => {
        window = null;
      });
    })
    .catch((error) => {
      dialog.showErrorBox(
        "EasyFonts — Avvio non riuscito",
        error.stack || error.message,
      );
      app.quit();
    });
  app.on("window-all-closed", () => app.quit());
  app.on("before-quit", (event) => {
    if (running && !shuttingDown) {
      event.preventDefault();
      shuttingDown = true;
      running.close().finally(() => app.quit());
    }
  });
}

async function migrateLibrary(destination) {
  try {
    await fs.access(path.join(destination, "database.json"));
    return;
  } catch {}
  const previous = path.join(project, ".easyfonts");
  try {
    await fs.access(path.join(previous, "database.json"));
  } catch {
    return;
  }
  await fs.mkdir(destination, { recursive: true });
  await fs.cp(previous, destination, { recursive: true, force: false });
  const file = path.join(destination, "database.json");
  const db = JSON.parse(await fs.readFile(file, "utf8"));
  for (const font of db.fonts) {
    if (font.path?.startsWith(previous + path.sep))
      font.path = path.join(destination, path.relative(previous, font.path));
  }
  await fs.writeFile(file, JSON.stringify(db, null, 2));
}
