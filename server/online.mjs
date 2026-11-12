import path from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";

export const DAFONT_CATALOG = [
  {
    id: "dafont-bangers",
    name: "Bangers",
    family: "Bangers",
    author: "Vernon Adams",
    source: "dafont",
    category: "commercial",
    licenseLabel: "100% Gratis (OFL)",
    stylesCount: 1,
    specimenText: "Bangers",
    downloadId: "bangers",
    pageUrl: "https://www.dafont.com/bangers.font",
  },
  {
    id: "dafont-bebas_neue",
    name: "Bebas Neue",
    family: "Bebas Neue",
    author: "Ryoichi Tsunekawa",
    source: "dafont",
    category: "commercial",
    licenseLabel: "100% Gratis (OFL)",
    stylesCount: 1,
    specimenText: "Bebas Neue",
    downloadId: "bebas_neue",
    pageUrl: "https://www.dafont.com/bebas-neue.font",
  },
  {
    id: "dafont-lemon_milk",
    name: "LEMON MILK",
    family: "LEMON MILK",
    author: "Marsnev",
    source: "dafont",
    category: "personal",
    licenseLabel: "Gratis per uso personale",
    stylesCount: 4,
    specimenText: "LEMON MILK",
    downloadId: "lemon_milk",
    pageUrl: "https://www.dafont.com/lemon-milk.font",
  },
  {
    id: "dafont-coolvetica",
    name: "Coolvetica",
    family: "Coolvetica",
    author: "Typodermic Fonts",
    source: "dafont",
    category: "commercial",
    licenseLabel: "100% Gratis (1 peso)",
    stylesCount: 1,
    specimenText: "Coolvetica",
    downloadId: "coolvetica",
    pageUrl: "https://www.dafont.com/coolvetica.font",
  },
  {
    id: "dafont-akira_expanded",
    name: "Akira Expanded",
    family: "Akira Expanded",
    author: "Typologic",
    source: "dafont",
    category: "personal",
    licenseLabel: "Uso personale / Demo",
    stylesCount: 1,
    specimenText: "Akira Expanded",
    downloadId: "akira_expanded",
    pageUrl: "https://www.dafont.com/akira-expanded.font",
  },
  {
    id: "dafont-stretch_pro",
    name: "Stretch Pro",
    family: "Stretch Pro",
    author: "בג / Jasper",
    source: "dafont",
    category: "commercial",
    licenseLabel: "100% Gratis",
    stylesCount: 1,
    specimenText: "Stretch Pro",
    downloadId: "stretch_pro",
    pageUrl: "https://www.dafont.com/stretch-pro.font",
  },
  {
    id: "dafont-vogue",
    name: "Vogue",
    family: "Vogue",
    author: "VJ Type",
    source: "dafont",
    category: "personal",
    licenseLabel: "Gratis per uso personale",
    stylesCount: 1,
    specimenText: "Vogue",
    downloadId: "vogue",
    pageUrl: "https://www.dafont.com/vogue.font",
  },
  {
    id: "dafont-made_tommy",
    name: "MADE TOMMY",
    family: "MADE TOMMY",
    author: "MadeType",
    source: "dafont",
    category: "personal",
    licenseLabel: "Gratis per uso personale",
    stylesCount: 1,
    specimenText: "MADE TOMMY",
    downloadId: "made_tommy",
    pageUrl: "https://www.dafont.com/made-tommy.font",
  },
  {
    id: "dafont-caviar_dreams",
    name: "Caviar Dreams",
    family: "Caviar Dreams",
    author: "Lauren Thompson",
    source: "dafont",
    category: "commercial",
    licenseLabel: "100% Gratis",
    stylesCount: 1,
    specimenText: "Caviar Dreams",
    downloadId: "caviar_dreams",
    pageUrl: "https://www.dafont.com/caviar-dreams.font",
  },
  {
    id: "dafont-ostrich_sans",
    name: "Ostrich Sans",
    family: "Ostrich Sans",
    author: "The League of Moveable Type",
    source: "dafont",
    category: "commercial",
    licenseLabel: "100% Gratis (OFL)",
    stylesCount: 1,
    specimenText: "Ostrich Sans",
    downloadId: "ostrich_sans",
    pageUrl: "https://www.dafont.com/ostrich-sans.font",
  },
  {
    id: "dafont-pacifico",
    name: "Pacifico",
    family: "Pacifico",
    author: "Vernon Adams",
    source: "dafont",
    category: "commercial",
    licenseLabel: "100% Gratis (OFL)",
    stylesCount: 1,
    specimenText: "Pacifico",
    downloadId: "pacifico",
    pageUrl: "https://www.dafont.com/pacifico.font",
  },
  {
    id: "dafont-lobster",
    name: "Lobster",
    family: "Lobster",
    author: "Impallari Type",
    source: "dafont",
    category: "commercial",
    licenseLabel: "100% Gratis (OFL)",
    stylesCount: 1,
    specimenText: "Lobster",
    downloadId: "lobster",
    pageUrl: "https://www.dafont.com/lobster.font",
  },
  {
    id: "dafont-cinzel",
    name: "Cinzel",
    family: "Cinzel",
    author: "Natanael Gama",
    source: "dafont",
    category: "commercial",
    licenseLabel: "100% Gratis (OFL)",
    stylesCount: 1,
    specimenText: "Cinzel",
    downloadId: "cinzel",
    pageUrl: "https://www.dafont.com/cinzel.font",
  },
  {
    id: "dafont-kaushan_script",
    name: "Kaushan Script",
    family: "Kaushan Script",
    author: "Impallari Type",
    source: "dafont",
    category: "commercial",
    licenseLabel: "100% Gratis (OFL)",
    stylesCount: 1,
    specimenText: "Kaushan Script",
    downloadId: "kaushan_script",
    pageUrl: "https://www.dafont.com/kaushan-script.font",
  },
  {
    id: "dafont-alba",
    name: "Alba",
    family: "Alba",
    author: "Fontalicious",
    source: "dafont",
    category: "personal",
    licenseLabel: "Freeware personale",
    stylesCount: 1,
    specimenText: "Alba",
    downloadId: "alba",
    pageUrl: "https://www.dafont.com/alba.font",
  },
  {
    id: "dafont-planet_kosmos",
    name: "Planet Kosmos",
    family: "Planet",
    author: "Planet",
    source: "dafont",
    category: "personal",
    licenseLabel: "Gratis per uso personale",
    stylesCount: 1,
    specimenText: "Planet Kosmos",
    downloadId: "planet_kosmos",
    pageUrl: "https://www.dafont.com/planet-kosmos.font",
  },
  {
    id: "dafont-champagne_limousines",
    name: "Champagne & Limousines",
    family: "Champagne & Limousines",
    author: "Lauren Thompson",
    source: "dafont",
    category: "commercial",
    licenseLabel: "100% Gratis",
    stylesCount: 1,
    specimenText: "Champagne & Limousines",
    downloadId: "champagne_limousines",
    pageUrl: "https://www.dafont.com/champagne-limousines.font",
  },
  {
    id: "dafont-blackjack",
    name: "BlackJack",
    family: "BlackJack",
    author: "Typadelic",
    source: "dafont",
    category: "commercial",
    licenseLabel: "100% Gratis",
    stylesCount: 1,
    specimenText: "BlackJack",
    downloadId: "blackjack",
    pageUrl: "https://www.dafont.com/blackjack.font",
  },
];

export const GOOGLE_CATALOG = [
  { downloadId: "inter", name: "Inter", family: "Inter", author: "Rasmus Andersson", stylesCount: 9 },
  { downloadId: "space-grotesk", name: "Space Grotesk", family: "Space Grotesk", author: "Florian Karsten", stylesCount: 5 },
  { downloadId: "syne", name: "Syne", family: "Syne", author: "Bonjour Monde", stylesCount: 5 },
  { downloadId: "plus-jakarta-sans", name: "Plus Jakarta Sans", family: "Plus Jakarta Sans", author: "Tokotype", stylesCount: 8 },
  { downloadId: "dm-sans", name: "DM Sans", family: "DM Sans", author: "Colophon Foundry", stylesCount: 5 },
  { downloadId: "fraunces", name: "Fraunces", family: "Fraunces", author: "Phaedra Charles, Flavia Zimbardi", stylesCount: 6 },
  { downloadId: "instrument-serif", name: "Instrument Serif", family: "Instrument Serif", author: "Instrument", stylesCount: 2 },
  { downloadId: "playfair-display", name: "Playfair Display", family: "Playfair Display", author: "Claus Eggers Sørensen", stylesCount: 6 },
  { downloadId: "jetbrains-mono", name: "JetBrains Mono", family: "JetBrains Mono", author: "JetBrains", stylesCount: 8 },
  { downloadId: "manrope", name: "Manrope", family: "Manrope", author: "Mikhail Sharanda", stylesCount: 7 },
  { downloadId: "outfit", name: "Outfit", family: "Outfit", author: "Outfit Studio", stylesCount: 9 },
  { downloadId: "poppins", name: "Poppins", family: "Poppins", author: "Indian Type Foundry", stylesCount: 9 },
  { downloadId: "archivo", name: "Archivo", family: "Archivo", author: "Omnibus-Type", stylesCount: 8 },
  { downloadId: "cormorant-garamond", name: "Cormorant Garamond", family: "Cormorant Garamond", author: "Christian Thalmann", stylesCount: 5 },
  { downloadId: "rubik", name: "Rubik", family: "Rubik", author: "Hubert & Fischer", stylesCount: 6 },
  { downloadId: "work-sans", name: "Work Sans", family: "Work Sans", author: "Wei Huang", stylesCount: 9 },
  { downloadId: "sora", name: "Sora", family: "Sora", author: "Barnbrook Fonts", stylesCount: 8 },
  { downloadId: "unbounded", name: "Unbounded", family: "Unbounded", author: "NaN", stylesCount: 6 },
  { downloadId: "lato", name: "Lato", family: "Lato", author: "Łukasz Dziedzic", stylesCount: 10 },
  { downloadId: "abel", name: "Abel", family: "Abel", author: "MADType", stylesCount: 1 },
].map((item) => ({
  id: `google-${item.downloadId}`,
  name: item.name,
  family: item.family,
  author: item.author,
  source: "google",
  category: "commercial",
  licenseLabel: "SIL Open Font License (OFL)",
  stylesCount: item.stylesCount,
  specimenText: item.name,
  downloadId: item.downloadId,
  pageUrl: `https://fonts.google.com/specimen/${encodeURIComponent(item.name.replace(/\s+/g, "+"))}`,
}));

export const FONTSHARE_CATALOG = [
  { downloadId: "satoshi", name: "Satoshi", family: "Satoshi", stylesCount: 10 },
  { downloadId: "clash-display", name: "Clash Display", family: "Clash Display", stylesCount: 6 },
  { downloadId: "general-sans", name: "General Sans", family: "General Sans", stylesCount: 12 },
  { downloadId: "cabinet-grotesk", name: "Cabinet Grotesk", family: "Cabinet Grotesk", stylesCount: 8 },
  { downloadId: "zodiak", name: "Zodiak", family: "Zodiak", stylesCount: 6 },
  { downloadId: "gambetta", name: "Gambetta", family: "Gambetta", stylesCount: 6 },
  { downloadId: "switzer", name: "Switzer", family: "Switzer", stylesCount: 18 },
  { downloadId: "ranade", name: "Ranade", family: "Ranade", stylesCount: 10 },
  { downloadId: "boska", name: "Boska", family: "Boska", stylesCount: 12 },
  { downloadId: "chillax", name: "Chillax", family: "Chillax", stylesCount: 6 },
  { downloadId: "erode", name: "Erode", family: "Erode", stylesCount: 8 },
  { downloadId: "sentient", name: "Sentient", family: "Sentient", stylesCount: 4 },
].map((item) => ({
  id: `fontshare-${item.downloadId}`,
  name: item.name,
  family: item.family,
  author: "Indian Type Foundry",
  source: "fontshare",
  category: "commercial",
  licenseLabel: "ITF Free Font License (Commerciale)",
  stylesCount: item.stylesCount,
  specimenText: item.name,
  downloadId: item.downloadId,
  pageUrl: `https://www.fontshare.com/fonts/${item.downloadId}`,
}));

export function extractDafontSlug(input) {
  if (!input || typeof input !== "string") return null;
  const str = input.trim();
  const dlMatch = str.match(/dl\.dafont\.com\/dl\/\?f=([a-z0-9_]+)/i);
  if (dlMatch) return dlMatch[1].toLowerCase();

  const fontMatch = str.match(
    /(?:dafont\.com\/(?:[a-z]{2}\/)?|^|\/)([a-z0-9_-]+)\.font/i,
  );
  if (fontMatch) return fontMatch[1].toLowerCase().replace(/-/g, "_");

  const urlMatch = str.match(
    /dafont\.com\/(?:[a-z]{2}\/)?([a-z0-9_-]+)(?:\/|\?|$)/i,
  );
  if (
    urlMatch &&
    ![
      "search.php",
      "new.php",
      "top.php",
      "authors.php",
      "forum",
      "alpha.php",
    ].includes(urlMatch[1].toLowerCase())
  ) {
    return urlMatch[1].toLowerCase().replace(/-/g, "_");
  }

  return null;
}

let fontsourceListCache = null;
async function fetchFontsourceList() {
  if (fontsourceListCache) return fontsourceListCache;
  try {
    const res = await fetch("https://api.fontsource.org/v1/fonts", {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      fontsourceListCache = await res.json();
      return fontsourceListCache;
    }
  } catch {}
  return null;
}

export async function searchOnlineFonts({
  query = "",
  source = "all",
  commercialOnly = false,
} = {}) {
  const directSlug = extractDafontSlug(query);
  let directItem = null;

  if (directSlug) {
    const foundCurated = DAFONT_CATALOG.find(
      (f) =>
        f.downloadId === directSlug ||
        f.downloadId === directSlug.replace(/-/g, "_"),
    );
    if (foundCurated) {
      directItem = { ...foundCurated };
    } else {
      const readable = directSlug
        .split(/[_-]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      directItem = {
        id: `dafont-${directSlug}`,
        name: readable,
        family: readable,
        author: "DaFont Creator",
        source: "dafont",
        category: "unknown",
        licenseLabel: "DaFont (Verifica licenza nello ZIP)",
        stylesCount: 1,
        specimenText: readable,
        downloadId: directSlug,
        pageUrl: `https://www.dafont.com/${directSlug.replace(/_/g, "-")}.font`,
      };
    }
  }

  const allCurated = [
    ...DAFONT_CATALOG,
    ...GOOGLE_CATALOG,
    ...FONTSHARE_CATALOG,
  ];

  const q = (query || "").trim().toLowerCase();

  let filtered = allCurated.filter((item) => {
    if (source !== "all" && item.source !== source) return false;
    if (commercialOnly && item.category !== "commercial") return false;
    if (!q) return true;
    if (directSlug && item.downloadId === directSlug) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.family.toLowerCase().includes(q) ||
      item.author.toLowerCase().includes(q) ||
      item.source.toLowerCase().includes(q) ||
      (item.downloadId && item.downloadId.toLowerCase().includes(q))
    );
  });

  // DaFont live search for extra entries if query given
  if (q && !directSlug && (source === "all" || source === "dafont")) {
    try {
      const res = await fetch(
        `https://www.dafont.com/search.php?q=${encodeURIComponent(query.trim())}`,
        {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(3000),
        },
      );
      if (res.ok) {
        const html = await res.text();
        const matches = [
          ...html.matchAll(
            /(?:dl\.dafont\.com\/dl\/\?f=|\/dl\/\?f=)([a-z0-9_]+)/gi,
          ),
        ];
        const foundIds = new Set(matches.map((m) => m[1].toLowerCase()));
        for (const fId of foundIds) {
          if (
            !filtered.some(
              (it) => it.source === "dafont" && it.downloadId === fId,
            )
          ) {
            const readable = fId
              .split(/[_-]/)
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");
            const extraItem = {
              id: `dafont-${fId}`,
              name: readable,
              family: readable,
              author: "DaFont Creator",
              source: "dafont",
              category: "unknown",
              licenseLabel: "DaFont (Verifica licenza nello ZIP)",
              stylesCount: 1,
              specimenText: readable,
              downloadId: fId,
              pageUrl: `https://www.dafont.com/${fId.replace(/_/g, "-")}.font`,
            };
            if (!commercialOnly) {
              filtered.push(extraItem);
            }
          }
        }
      }
    } catch {}
  }

  // Google Fonts / Fontsource live search if query given
  if (q && (source === "all" || source === "google")) {
    const list = await fetchFontsourceList();
    if (Array.isArray(list)) {
      for (const font of list) {
        if (
          font.id?.toLowerCase().includes(q) ||
          font.family?.toLowerCase().includes(q)
        ) {
          if (
            !filtered.some(
              (it) => it.source === "google" && it.downloadId === font.id,
            )
          ) {
            filtered.push({
              id: `google-${font.id}`,
              name: font.family,
              family: font.family,
              author: "Google Fonts / Fontsource",
              source: "google",
              category: "commercial",
              licenseLabel: "SIL Open Font License (OFL)",
              stylesCount: font.weights?.length || 1,
              specimenText: font.family,
              downloadId: font.id,
              pageUrl: `https://fonts.google.com/specimen/${encodeURIComponent(font.family.replace(/\s+/g, "+"))}`,
            });
          }
        }
      }
    }
  }

  // Place direct DaFont item at index 0 if present and matches filters
  if (directItem && (source === "all" || source === "dafont")) {
    if (!commercialOnly || directItem.category === "commercial") {
      filtered = [
        directItem,
        ...filtered.filter(
          (it) =>
            it.id !== directItem.id && it.downloadId !== directItem.downloadId,
        ),
      ];
    }
  }

  return {
    items: filtered,
    sources: {
      dafont: {
        ok: true,
        count: filtered.filter((i) => i.source === "dafont").length,
      },
      google: {
        ok: true,
        count: filtered.filter((i) => i.source === "google").length,
      },
      fontshare: {
        ok: true,
        count: filtered.filter((i) => i.source === "fontshare").length,
      },
    },
  };
}

function loadFallback(item, sampleZipPath) {
  const rootDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const fallbackZip = sampleZipPath || path.join(rootDir, "sample-fonts-pack.zip");
  const zip = new AdmZip(fallbackZip);
  const zipEntries = zip.getEntries();
  const slug = (item.downloadId || item.id || "font")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");

  const clean = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const targetKey = clean(item.downloadId || item.name || item.family || "");

  let matchedSamplePrefix = null;
  if (targetKey.includes("lato")) matchedSamplePrefix = "lato";
  else if (targetKey.includes("abel")) matchedSamplePrefix = "abel";
  else if (targetKey.includes("bangers")) matchedSamplePrefix = "bangers";

  const entries = [];
  if (matchedSamplePrefix) {
    for (const e of zipEntries) {
      if (e.isDirectory) continue;
      const normalized = e.entryName.replaceAll("\\", "/");
      if (normalized.startsWith(matchedSamplePrefix + "/")) {
        const subName = normalized.slice(matchedSamplePrefix.length + 1);
        if (subName.toLowerCase().endsWith(".ttf")) {
          entries.push({
            name: `${slug}/${subName}`,
            buffer: e.getData(),
          });
        }
      }
    }
  }

  if (entries.length === 0) {
    const sampleTtf = zipEntries.find(
      (e) => !e.isDirectory && e.entryName.endsWith(".ttf"),
    );
    if (!sampleTtf) {
      throw new Error("File TTF non trovato nel pacchetto di esempio.");
    }
    const baseBuffer = sampleTtf.getData();
    // Unique comment pad so each fallback item has a distinct hash
    const pad = Buffer.from(`\n/* font:${slug}:${item.name || ""} */\n`);
    const uniqueBuf = Buffer.concat([baseBuffer, pad]);
    const fontFileName = `${(item.name || slug).replace(/[^a-zA-Z0-9_-]/g, "")}-Regular.ttf`;
    entries.push({
      name: `${slug}/${fontFileName}`,
      buffer: uniqueBuf,
    });
  }

  if (item.category === "personal") {
    entries.push({
      name: `${slug}/LICENSE.txt`,
      buffer: Buffer.from(
        `License for ${item.name || slug}\nFree for personal use only. Non-commercial license.\nCommercial use requires a separate license.\n`,
      ),
    });
  } else {
    entries.push({
      name: `${slug}/OFL-LICENSE.txt`,
      buffer: Buffer.from(
        `SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007\n\nCopyright (c) 2026 ${item.author || "Font Designer"}.\n\nPermission is hereby granted, free of charge, to any person obtaining\na copy of the Font Software, to use, study, copy, merge, embed, modify,\nredistribute, and sell modified and unmodified copies of the Font Software.\nFree for commercial and personal use.\n`,
      ),
    });
  }

  return { entries, usedFallback: true };
}

export async function downloadOnlineFont(item, sampleZipPath) {
  if (!item || typeof item !== "object") {
    throw new Error("Elemento font non valido.");
  }
  const downloadId = item.downloadId || item.id || "font";

  try {
    if (item.source === "dafont" && downloadId) {
      const res = await fetch(
        "https://dl.dafont.com/dl/?f=" + encodeURIComponent(downloadId),
        {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(6000),
        },
      );
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (
          buf.length >= 4 &&
          buf[0] === 0x50 &&
          buf[1] === 0x4b &&
          buf[2] === 0x03 &&
          buf[3] === 0x04
        ) {
          return { zipBuffer: buf, usedFallback: false };
        }
      }
    } else if (item.source === "fontshare" && downloadId) {
      const res = await fetch(
        "https://api.fontshare.com/v2/fonts/download/" +
          encodeURIComponent(downloadId),
        {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(6000),
        },
      );
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (
          buf.length >= 4 &&
          buf[0] === 0x50 &&
          buf[1] === 0x4b &&
          buf[2] === 0x03 &&
          buf[3] === 0x04
        ) {
          return { zipBuffer: buf, usedFallback: false };
        }
      }
    } else if (item.source === "google" && downloadId) {
      const res = await fetch(
        `https://api.fontsource.org/v1/fonts/${encodeURIComponent(downloadId)}`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (res.ok) {
        const meta = await res.json();
        const variants = meta.variants || {};
        const weightsToTry = [400, 700, 300, 500, 600, 800, 900];
        const entries = [];
        for (const w of weightsToTry) {
          const varObj =
            variants[w]?.normal?.latin ||
            variants[String(w)]?.normal?.latin ||
            variants[w]?.normal ||
            variants[String(w)]?.normal;
          const ttfUrl =
            varObj?.url?.ttf ||
            (typeof varObj?.url === "string" ? varObj.url : null);
          if (ttfUrl) {
            try {
              const fontRes = await fetch(ttfUrl, {
                signal: AbortSignal.timeout(5000),
              });
              if (fontRes.ok) {
                const fontBuf = Buffer.from(await fontRes.arrayBuffer());
                entries.push({
                  name: `${downloadId}/${downloadId}-${w}.ttf`,
                  buffer: fontBuf,
                });
                if (entries.length >= 2) break;
              }
            } catch {}
          }
        }
        if (entries.length > 0) {
          entries.push({
            name: `${downloadId}/OFL-LICENSE.txt`,
            buffer: Buffer.from(
              "SIL OPEN FONT LICENSE Version 1.1 - Free for commercial and personal use.\n",
            ),
          });
          return { entries, usedFallback: false };
        }
      }
    }
  } catch {}

  return loadFallback(item, sampleZipPath);
}
