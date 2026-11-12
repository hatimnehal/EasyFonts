import type { ImportResult, OnlineFontItem } from "./types";

export type ListView = "list" | "compact" | "grid";
export type PreviewLayout =
  | "stacked"
  | "columns"
  | "gallery"
  | "waterfall"
  | "glyphs"
  | "pairing";

export type SpecimenPreset =
  | "name"
  | "pangram"
  | "editorial"
  | "alphabet"
  | "numbers";

export type TextAlign = "left" | "center" | "right";
export type TextTransform = "none" | "uppercase" | "lowercase";

export type TypographySettings = {
  fontSize: number;
  tracking: number;
  lineHeight: number;
  align: TextAlign;
  transform: TextTransform;
  activeFeatures: string[];
  axisValues: Record<string, number>;
  preset: SpecimenPreset;
  pairingFontId: string;
};

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
  onboardingCompleted?: boolean;
  defaultFolder?: string;
  favorites?: string[];
  onlineStarred?: OnlineFontItem[];
  typography?: Partial<TypographySettings>;
};

export type RestoredWorkspace = ImportResult & {
  mode: "library" | "system";
  preferences: Partial<Preferences>;
};

export const defaultTypography: TypographySettings = {
  fontSize: 64,
  tracking: -0.025,
  lineHeight: 1.25,
  align: "left",
  transform: "none",
  activeFeatures: ["liga", "kern"],
  axisValues: {},
  preset: "name",
  pairingFontId: "",
};

export const defaultViews: ViewPreferences = {
  sidebarWidth: 258,
  listView: "list",
  nativeNames: false,
  groupFamilies: false,
  previewLayout: "stacked",
};
