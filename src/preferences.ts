import type { ImportResult } from "./types";
export type ListView = "list" | "compact" | "grid";
export type PreviewLayout = "stacked" | "columns" | "gallery";
export type ViewPreferences = {
  sidebarWidth: number;
  listView: ListView;
  nativeNames: boolean;
  groupFamilies: boolean;
  previewLayout: PreviewLayout;
};
export type Preferences = ViewPreferences & {
  theme: "light" | "dark";
  text: string;
  activeId: string;
  editAllPreviews: boolean;
  globalPreviewText: string | null;
  previewTexts: Record<string, string>;
};
export type RestoredWorkspace = ImportResult & {
  mode: "library" | "system";
  preferences: Partial<Preferences>;
};
export const defaultViews: ViewPreferences = {
  sidebarWidth: 258,
  listView: "list",
  nativeNames: false,
  groupFamilies: false,
  previewLayout: "stacked",
};
