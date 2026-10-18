export type License = {
  id: string;
  name: string;
  pdf: boolean;
  text: string;
  url: string;
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
