import type { FontItem } from "./types";
export function familyKey(font: FontItem) {
  return (font.groupFamily || font.family)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}
export type FontFamily = { key: string; name: string; fonts: FontItem[] };
export function groupFonts(fonts: FontItem[]): FontFamily[] {
  const groups = new Map<string, FontFamily>();
  for (const font of fonts) {
    const key = familyKey(font);
    if (!groups.has(key))
      groups.set(key, {
        key,
        name: font.groupFamily || font.family,
        fonts: [],
      });
    groups.get(key)!.fonts.push(font);
  }
  for (const family of groups.values())
    family.fonts.sort(
      (a, b) =>
        Number(!/^(regular|normal|roman|book)$/i.test(a.style)) -
          Number(!/^(regular|normal|roman|book)$/i.test(b.style)) ||
        a.style.localeCompare(b.style, undefined, { numeric: true }),
    );
  return [...groups.values()];
}
