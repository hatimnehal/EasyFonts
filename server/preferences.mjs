import fs from "node:fs/promises";
import path from "node:path";

// Independent of the UI origin/ephemeral desktop port and of the font database.
export async function createWorkspaceStore(directory) {
  const file = path.join(directory, "workspace.json");
  let state = { version: 1, preferences: {}, workspace: null };
  try {
    const saved = JSON.parse(await fs.readFile(file, "utf8"));
    if (saved.version !== 1) throw Error("Versione workspace non valida");
    state = saved;
  } catch (e) {
    if (e.code !== "ENOENT")
      throw Error(`Impossibile leggere le preferenze: ${e.message}`);
  }
  async function save() {
    await fs.writeFile(file + ".tmp", JSON.stringify(state, null, 2));
    await fs.rename(file + ".tmp", file);
  }
  return {
    get preferences() {
      return state.preferences;
    },
    get workspace() {
      return state.workspace;
    },
    async remember(fonts, mode = "library", folder) {
      state.workspace = {
        mode,
        folder,
        ids: [...new Set(fonts.map((f) => f.id))],
      };
      await save();
    },
    async update(input) {
      if (!input || typeof input !== "object" || Array.isArray(input))
        throw Error("Preferenze non valide.");
      const result = {};
      for (const [key, value] of Object.entries(input)) {
        if (
          key === "sidebarWidth" &&
          Number.isFinite(value) &&
          value >= 150 &&
          value <= 750
        )
          result[key] = Math.round(value);
        else if (
          key === "listView" &&
          ["list", "compact", "grid"].includes(value)
        )
          result[key] = value;
        else if (
          key === "previewLayout" &&
          ["stacked", "columns", "gallery"].includes(value)
        )
          result[key] = value;
        else if (
          ["nativeNames", "groupFamilies", "editAllPreviews"].includes(key) &&
          typeof value === "boolean"
        )
          result[key] = value;
        else if (
          key === "globalPreviewText" &&
          (value === null ||
            (typeof value === "string" && value.length <= 20000))
        )
          result[key] = value;
        else if (
          key === "previewTexts" &&
          value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          JSON.stringify(value).length <= 250000 &&
          Object.entries(value).every(
            ([id, text]) =>
              /^[a-f0-9]{64}:(positive|negative)$/.test(id) &&
              typeof text === "string" &&
              text.length <= 20000,
          )
        )
          result[key] = value;
        else if (key === "theme" && ["light", "dark"].includes(value))
          result[key] = value;
        else if (
          key === "text" &&
          typeof value === "string" &&
          value.length <= 20000
        )
          result[key] = value;
        else if (
          key === "activeId" &&
          typeof value === "string" &&
          (/^[a-f0-9]{64}$/.test(value) || value === "")
        )
          result[key] = value;
        else throw Error(`Preferenza non valida: ${key}`);
      }
      state.preferences = { ...state.preferences, ...result };
      await save();
      return state.preferences;
    },
  };
}
