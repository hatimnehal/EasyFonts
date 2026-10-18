import fs from "node:fs/promises";
import path from "node:path";
const { version } = JSON.parse(await fs.readFile("package.json", "utf8"));
await fs.mkdir("release", { recursive: true });
await fs.copyFile(".desktop-build/EasyFonts.exe", "release/EasyFonts.exe");
await fs.copyFile("sample-fonts-pack.zip", "release/sample-fonts-pack.zip");
for (const [source, destination] of [
  ["LICENSE", "LICENSE.easyfonts.txt"],
  ["THIRD_PARTY_NOTICES.md", "THIRD_PARTY_NOTICES.md"],
  ["build/THIRD_PARTY_LICENSES.txt", "THIRD_PARTY_LICENSES.txt"],
])
  await fs.copyFile(source, path.join("release", destination));
const { createHash } = await import("node:crypto");
const binary = await fs.readFile("release/EasyFonts.exe");
await fs.writeFile(
  "release/SHA256SUMS.txt",
  `${createHash("sha256").update(binary).digest("hex")}  EasyFonts.exe\n`,
);
// Keep older public builds recoverable, outside the main delivery folder.
const previous = path.resolve("release/EasyFonts-1.0.0-Windows.exe");
if (previous !== path.resolve("release", "EasyFonts-1.0.0-Windows.exe"))
  throw Error("Percorso build precedente non valido");
try {
  await fs.access(previous);
  await fs.mkdir("release/previous", { recursive: true });
  await fs.rename(
    previous,
    path.resolve("release/previous/EasyFonts-1.0.0-Windows.exe"),
  );
} catch (error) {
  if (error.code !== "ENOENT")
    console.warn("Build precedente conservata:", error.message);
}
const previousTechnical = path.resolve("release/win-unpacked");
const archivedTechnical = path.resolve("release/previous/technical-1.0");
if (
  path.dirname(previousTechnical) !== path.resolve("release") ||
  path.dirname(archivedTechnical) !== path.resolve("release/previous")
)
  throw Error("Percorso build tecnica non valido");
try {
  await fs.access(previousTechnical);
  await fs.mkdir("release/previous", { recursive: true });
  await fs.rename(previousTechnical, archivedTechnical);
} catch (error) {
  if (!["ENOENT", "EEXIST", "ENOTEMPTY"].includes(error.code))
    console.warn("Build tecnica precedente conservata:", error.message);
}
await fs.writeFile(
  "release/LEGGIMI.txt",
  `EASYFONTS ${version} — WINDOWS

Avvio: doppio clic su EasyFonts.exe.
Non servono Node.js, npm, browser o servizi da avviare manualmente.

Per una prova immediata: UPLOAD > sample-fonts-pack.zip.
Il pacchetto contiene 4 font open source e le licenze originali.

Trascina il divisore tra lista e preview per ridimensionare le aree.
Nella lista: elenco, compatta, griglia, nomi nel proprio font,
raggruppamento famiglie e selezione di tutti i font non protetti.
Nelle preview: viste impilate, affiancate o griglia, con cambio varianti.
Le card hanno anteprima, nome del font e controlli.
Senza testo personalizzato viene mostrato il nome del font.
Modifica tutte attiva il testo condiviso; altrimenti ogni preview è indipendente.
L'ultima cartella, le viste, il tema e la larghezza vengono ripristinati all'avvio.

I dati sono in %APPDATA%\\EasyFonts\\library.
Le copie recuperabili dei font rimossi sono nella sottocartella trash.
Le build precedenti sono conservate nella cartella previous.
`,
);
console.log(`Pronto: release/EasyFonts.exe (${version})`);
