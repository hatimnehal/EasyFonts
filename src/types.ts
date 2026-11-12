export type License = {
  id: string;
  name: string;
  pdf: boolean;
  text: string;
  url: string;
};

export type FontAxis = {
  tag: string;
  name: string;
  min: number;
  max: number;
  defaultValue: number;
};

export type FontMetrics = {
  numGlyphs: number;
  unitsPerEm: number;
  ascender: number;
  descender: number;
  designer?: string;
  manufacturer?: string;
  version?: string;
  format?: string;
};

export type FontItem = {
  id: string;
  name: string;
  family: string;
  groupFamily?: string;
  style: string;
  filename: string;
  protected: boolean;
  installed: boolean;
  source: string;
  category: "commercial" | "personal" | "unknown";
  licenses: License[];
  metadata: string;
  url: string;
  features?: string[];
  axes?: FontAxis[];
  metrics?: FontMetrics;
  sampleGlyphs?: string[];
};

export type OnlineFontItem = {
  id: string;
  name: string;
  family: string;
  author: string;
  source: "dafont" | "google" | "fontshare";
  category: "commercial" | "personal" | "unknown";
  licenseLabel: string;
  stylesCount?: number;
  specimenText?: string;
  downloadId: string;
  pageUrl?: string;
};

export type OnlineSearchResponse = {
  items: OnlineFontItem[];
  sources: Record<string, { ok: boolean; count: number; message?: string }>;
};

export type ImportResult = {
  fonts: FontItem[];
  warnings: string[];
  cancelled?: boolean;
  folder?: string;
};

export type Result = { id: string; ok: boolean; message?: string };

declare global {
  interface Window {
    easyfonts?: { readonly desktop: boolean };
  }
}

export const categories = {
  commercial: "Uso commerciale",
  personal: "Solo personale",
  unknown: "Da verificare",
};
