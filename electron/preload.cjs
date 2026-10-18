const { contextBridge } = require("electron");
// Only a capability flag crosses into the sandboxed renderer, never Node or IPC.
contextBridge.exposeInMainWorld("easyfonts", { desktop: true });
