import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sources = [
  ["lato", "Lato-Regular.ttf"],
  ["lato", "Lato-Bold.ttf"],
  ["abel", "Abel-Regular.ttf"],
  ["bangers", "Bangers-Regular.ttf"],
];
const zip = new AdmZip();
for (const [family, filename] of sources) {
  const url = `https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/${filename}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw Error(`Download non riuscito: ${url} (${r.status})`);
  const buffer = Buffer.from(await r.arrayBuffer());
  if (
    buffer.readUInt32BE(0) !== 0x00010000 &&
    buffer.toString("ascii", 0, 4) !== "OTTO"
  )
    throw Error(`Non è un font TrueType/OpenType: ${filename}`);
  zip.addFile(`${family}/${filename}`, buffer);
  console.log(`Aggiunto ${filename}`);
}
for (const family of new Set(sources.map((s) => s[0]))) {
  const r = await fetch(
    `https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`,
    { signal: AbortSignal.timeout(60000) },
  );
  if (!r.ok) throw Error(`Licenza non disponibile: ${family}`);
  zip.addFile(`${family}/LICENSE.txt`, Buffer.from(await r.text()));
}
zip.addFile(
  "SOURCES.md",
  Buffer.from(
    "# EasyFonts — Sample pack\n\n4 font reali dal repository ufficiale Google Fonts.\n\n" +
      sources
        .map(
          ([family, file]) =>
            `- ${file}: https://github.com/google/fonts/tree/main/ofl/${family}`,
        )
        .join("\n") +
      "\n\nOgni cartella contiene la licenza SIL Open Font License originale.\n",
  ),
);
await fs.writeFile(path.join(root, "sample-fonts-pack.zip"), zip.toBuffer());
console.log("Creato sample-fonts-pack.zip con 4 TTF reali e relative licenze.");
