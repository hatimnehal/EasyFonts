import { app, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createBackend } from "../server/index.mjs";
const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
let window, running, dataDir;
app.on("window-all-closed", () => {});
app
  .whenReady()
  .then(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "easyfonts-renderer-"));
    const fixture = path.join(dataDir, "fixture");
    await fs.mkdir(fixture);
    const sample = path.join(project, "sample-fonts-pack.zip");
    await fs.copyFile(sample, path.join(fixture, "pack.zip"));
    let uploadCalls = 0,
      folderCalls = 0;
    const errors = [];
    const backend = await createBackend({
      dataDir,
      desktop: true,
      port: 0,
      chooseFiles: async () => {
        uploadCalls++;
        return [sample];
      },
      chooseDirectory: async () => {
        folderCalls++;
        return fixture;
      },
    });
    running = await backend.listen(0);
    window = new BrowserWindow({
      show: false,
      width: 1200,
      height: 840,
      webPreferences: {
        preload: path.join(project, "electron", "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    window.webContents.on("console-message", (event) => {
      if (event.level === "error") errors.push(event.message);
    });
    await window.loadURL(running.url);
    const js = async (code) => {
      try {
        return await window.webContents.executeJavaScript(code);
      } catch (error) {
        throw Error(
          `${error.message}\nScript: ${code.slice(0, 600)}\nConsole: ${errors.join("\n")}`,
        );
      }
    };
    async function until(code, label) {
      const deadline = Date.now() + 30000;
      while (Date.now() < deadline) {
        if (await js(code)) return;
        await new Promise((resolve) => setTimeout(resolve, 75));
      }
      throw Error(`Timeout: ${label}. Console: ${errors.join("\n")}`);
    }
    await until(
      '!!document.querySelector(".upload-tile") && !!window.easyfonts?.desktop',
      "ingresso desktop",
    );
    await js('document.querySelector(".upload-tile").click()');
    await until(
      'document.querySelectorAll(".font-row").length===4 && !!document.querySelector(".workspace")',
      "upload nativo dalla UI",
    );
    assert.equal(uploadCalls, 1);
    await until(
      '[...document.fonts].some(face=>face.status==="loaded")',
      "FontFace reale",
    );
    await js(
      `(()=>{const el=document.querySelector('.preview textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,'EasyFonts desktop funziona.');el.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
    await until(
      'document.querySelector(".positive textarea").value==="EasyFonts desktop funziona." && document.querySelector(".negative textarea").value!=="EasyFonts desktop funziona."',
      "testo indipendente per anteprima",
    );
    await js('document.querySelector(".wordmark").click()');
    await until('!!document.querySelector(".folder-tile")', "ritorno ingresso");
    await js('document.querySelector(".folder-tile").click()');
    await until(
      '!!document.querySelector(".workspace") && document.querySelectorAll(".font-row").length===4',
      "cartella dalla UI",
    );
    assert.equal(folderCalls, 1);
    await js('document.querySelector(".wordmark").click()');
    await until(
      '!!document.querySelector(".upload-tile")',
      "ingresso prima del drop",
    );
    const base64 = (await fs.readFile(sample)).toString("base64");
    await js(
      `(()=>{const binary=atob(${JSON.stringify(base64)});const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));const files=new DataTransfer();files.items.add(new File([bytes],'dropped-pack.zip',{type:'application/zip'}));document.querySelector('.app').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:files}));})()`,
    );
    await until(
      '!!document.querySelector(".workspace") && document.querySelectorAll(".font-row").length===4',
      "drag & drop multipart reale",
    );

    // Editing all is explicit; otherwise each font/tone keeps its own specimen.
    await js(
      'document.querySelector("[aria-label=\\\"Modifica tutte le preview\\\"]").click()',
    );
    await js(
      `(()=>{const el=document.querySelector('.preview-stack .positive textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,'Tutte le preview');el.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
    await until(
      '[...document.querySelectorAll(".preview-stack textarea")].every(el=>el.value==="Tutte le preview")',
      "modifica tutte",
    );
    await js(
      'document.querySelector("[aria-label=\\\"Modifica tutte le preview\\\"]").click()',
    );
    const headerHeight = await js(
      'document.querySelector(".app-header").getBoundingClientRect().height',
    );
    assert.equal(headerHeight, 44);
    await js(
      'document.querySelector("[aria-label=\\\"Seleziona tutti\\\"]").click()',
    );
    await until(
      'document.querySelectorAll(".sidebar .font-list input:checked").length===4',
      "selezione tutti",
    );
    await js(
      'document.querySelector("[aria-label=\\\"Seleziona tutti\\\"]").click()',
    );
    await until(
      'document.querySelectorAll(".sidebar .font-list input:checked").length===0',
      "deselezione tutti",
    );
    await js(
      'document.querySelector("[aria-label=\\\"Nomi nel proprio font\\\"]").click()',
    );
    await until(
      '[...document.querySelectorAll(".sidebar .native-font-name")].some(el=>el.style.fontFamily.includes("ef-"))',
      "nomi nel proprio font caricati",
    );
    await js(
      'document.querySelector("[aria-label=\\\"Raggruppa famiglie\\\"]").click()',
    );
    await until(
      'document.querySelectorAll(".sidebar .font-list > *").length===3',
      "famiglie raggruppate",
    );
    const lato = await js(
      'fetch("/api/library").then(r=>r.json()).then(r=>r.fonts.filter(f=>f.groupFamily==="Lato"))',
    );
    assert.equal(lato.length, 2);
    const regular = lato.find((f) => f.style === "Regular"),
      bold = lato.find((f) => f.style === "Bold");
    assert.ok(regular);
    assert.ok(bold);
    await js(
      `document.querySelector('[data-family="Lato"] .font-name').click()`,
    );
    await until(
      'document.querySelectorAll(".preview-stack .preview-variant").length===2',
      "selettore varianti nelle due preview",
    );
    await js(
      `(()=>{const el=document.querySelector('.preview-stack .preview-variant');el.value=${JSON.stringify(bold.id)};el.dispatchEvent(new Event('change',{bubbles:true}));})()`,
    );
    await until(
      `[...document.querySelectorAll('.preview-stack .preview-variant')].every(el=>el.value===${JSON.stringify(bold.id)})`,
      "variante sincronizzata positivo negativo",
    );
    await until(
      `document.querySelector('.preview-stack .positive textarea').value===${JSON.stringify(bold.name)}`,
      "testo predefinito nome variante",
    );
    await js(
      'document.querySelector("[aria-label=\\\"Seleziona famiglia Lato\\\"]").click()',
    );
    await until(
      'document.querySelector("[aria-label=\\\"Seleziona tutti\\\"]").indeterminate',
      "selezione famiglia parziale",
    );
    await js(
      'document.querySelector("[aria-label=\\\"Seleziona tutti\\\"]").click()',
    );
    await until(
      'document.querySelector("[aria-label=\\\"Seleziona tutti\\\"]").checked',
      "tutti dopo famiglia",
    );
    const initialWidth = await js(
      'Number(document.querySelector("[role=separator]").getAttribute("aria-valuenow"))',
    );
    await js(
      'document.querySelector("[role=separator]").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}))',
    );
    await until(
      `Number(document.querySelector('[role=separator]').getAttribute('aria-valuenow'))===${initialWidth + 12}`,
      "divisore tastiera",
    );
    const bounds = await js(
      '(()=>{const r=document.querySelector("[role=separator]").getBoundingClientRect();return {x:Math.round(r.x+4),y:Math.round(r.y+100)};})()',
    );
    window.webContents.sendInputEvent({
      type: "mouseDown",
      button: "left",
      clickCount: 1,
      ...bounds,
    });
    window.webContents.sendInputEvent({
      type: "mouseMove",
      x: bounds.x + 44,
      y: bounds.y,
    });
    window.webContents.sendInputEvent({
      type: "mouseUp",
      button: "left",
      clickCount: 1,
      x: bounds.x + 44,
      y: bounds.y,
    });
    await until(
      `Number(document.querySelector('[role=separator]').getAttribute('aria-valuenow'))>${initialWidth + 12}`,
      "divisore trascinabile",
    );
    await js(
      'document.querySelector("[aria-label=\\\"Anteprime affiancate\\\"]").click()',
    );
    await until(
      '!!document.querySelector(".preview-layout-columns")',
      "vista affiancata",
    );
    await js(
      'document.querySelector("[aria-label=\\\"Vista griglia\\\"]").click()',
    );
    await until(
      '!!document.querySelector(".sidebar .font-view-grid .gallery-card textarea")',
      "card con preview nella lista",
    );
    await js(
      'document.querySelector("[aria-label=\\\"Griglia di tutti i font\\\"]").click()',
    );
    await until(
      'document.querySelectorAll(".preview-gallery > .gallery-card").length===3',
      "griglia per famiglia",
    );
    assert.ok(
      await js(
        '!!document.querySelector(".preview-gallery .gallery-card-controls select")',
      ),
    );
    // Reopen a folder, then restart on a different internal origin to prove persistence.
    await js('document.querySelector(".wordmark").click()');
    await until('!!document.querySelector(".folder-tile")', "ingresso");
    await js('document.querySelector(".folder-tile").click()');
    await until('!!document.querySelector(".workspace")', "cartella ultima");
    assert.equal(folderCalls, 2);
    await js(
      'document.querySelector("[aria-label=\\\"Menu impostazioni\\\"]").click()',
    );
    await js(
      '[...document.querySelectorAll(".settings-menu button")].find(el=>el.textContent.includes("Tema B/W")).click()',
    );
    await until(
      'document.documentElement.dataset.theme==="dark" && getComputedStyle(document.querySelector(".brand-logo")).filter==="invert(1)"',
      "logo bianco trasparente",
    );
    const savedWidth = await js(
      'Number(document.querySelector("[role=separator]").getAttribute("aria-valuenow"))',
    );
    for (let i = 0; i < 100; i++) {
      const saved = JSON.parse(
        await fs.readFile(path.join(dataDir, "workspace.json"), "utf8"),
      );
      if (
        saved.preferences.theme === "dark" &&
        saved.preferences.sidebarWidth === savedWidth &&
        saved.preferences.previewLayout === "gallery"
      )
        break;
      await new Promise((r) => setTimeout(r, 50));
    }
    window.destroy();
    running.server.closeAllConnections();
    await running.close();
    const reopened = await createBackend({
      dataDir,
      desktop: true,
      chooseDirectory: async () => {
        throw Error("Dialogo durante ripristino");
      },
    });
    running = await reopened.listen(0);
    window = new BrowserWindow({
      show: false,
      width: 1200,
      height: 840,
      webPreferences: {
        preload: path.join(project, "electron", "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    await window.loadURL(running.url);
    await until(
      '!!document.querySelector(".workspace") && !!document.querySelector(".preview-gallery")',
      "ripristino automatico senza dialogo",
    );
    assert.equal(
      await js(
        'Number(document.querySelector("[role=separator]").getAttribute("aria-valuenow"))',
      ),
      savedWidth,
    );
    assert.equal(
      await js(
        'document.querySelector("[aria-label=\\\"Raggruppa famiglie\\\"]").getAttribute("aria-pressed")',
      ),
      "true",
    );
    assert.equal(
      await js(
        'document.querySelector("[aria-label=\\\"Nomi nel proprio font\\\"]").getAttribute("aria-pressed")',
      ),
      "true",
    );
    assert.equal(await js("document.documentElement.dataset.theme"), "dark");
    assert.equal(folderCalls, 2);
    await until(
      '[...document.querySelectorAll(".preview-gallery .positive textarea")].some(el=>el.value==="EasyFonts desktop funziona.")',
      "testo individuale ripristinato",
    );
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      "DESKTOP PASS: upload, cartella, drop, nomi reali, famiglie, varianti, seleziona tutti, ridimensionamento, griglie, testo indipendente/globale, logo e ripristino.",
    );
    await cleanup();
    app.exit(0);
  })
  .catch(async (error) => {
    console.error(error.stack || error);
    await cleanup();
    app.exit(1);
  });
async function cleanup() {
  if (window && !window.isDestroyed()) window.destroy();
  if (running) {
    running.server.closeAllConnections();
    await running.close();
  }
  if (dataDir) {
    assert.equal(path.dirname(dataDir), os.tmpdir());
    await fs.rm(dataDir, { recursive: true, force: true });
  }
}
