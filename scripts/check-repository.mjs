import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import AdmZip from "adm-zip";
import { root, repositoryFiles } from "./repository-files.mjs";

const files = repositoryFiles();
const problems = [];
const fail = (file, rule, line) =>
  problems.push(`${file}${line ? `:${line}` : ""} — ${rule}`);
const binaryAssets = new Set([
  "build/icon.png",
  "build/icon.ico",
  "public/assets/easyfonts-logo.png",
  "docs/images/ingest.png",
  "docs/images/workspace.png",
  "sample-fonts-pack.zip",
]);
const forbiddenPath =
  /(^|\/)(?:node_modules|dist|release|\.desktop-build|\.easyfonts|\.git|\.tools|\.cache|\.agents|\.codex|\.aws|private|data|uploads|library|trash|artifacts)(\/|$)|(^|\/)(?:\.env(?:\..*)?|\.npmrc|database\.json|workspace\.json|Thumbs\.db|Desktop\.ini)$/i;
const forbiddenExtension =
  /\.(?:exe|msi|dmg|asar|pem|key|pfx|p12|crt|cer|keystore|db|sqlite\d*|log|dmp|heapsnapshot|cpuprofile|ttf|otf|woff2?|ttc|otc|zip|7z|tar|gz)$/i;
// Values are obtained at runtime; no local identity is embedded in this script.
const identities = [
  ...new Set([
    os.userInfo().username,
    os.hostname(),
    process.env.COMPUTERNAME,
    os.homedir(),
  ]),
]
  .filter((value) => value && value.length >= 5)
  .map((value) => value.toLowerCase());
const rules = [
  [
    "percorso home personale",
    /(?:[a-z]:[\\/]+Users[\\/]+(?!Public\b|Default\b|<|\$|%)[^\s\\/`"'<>]+|\/(?:Users|home)\/(?!<|\$)[a-z0-9_.-]+)[\\/]/i,
  ],
  ["chiave privata", /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/],
  [
    "token GitHub",
    /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/,
  ],
  ["chiave di accesso cloud", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  [
    "token servizio",
    /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{24,}|xox[baprs]-[A-Za-z0-9-]{20,}|AIza[A-Za-z0-9_-]{35})\b/,
  ],
  ["credenziali in URL", /https?:\/\/[^\s/]+:[^\s/@]+@/i],
  [
    "credenziale assegnata",
    /\b(?:api[_-]?key|client[_-]?secret|password|access[_-]?token)\b\s*[:=]\s*["'][A-Za-z0-9_+/=-]{16,}["']/i,
  ],
];

function inspectText(name, text) {
  text.split(/\r?\n/).forEach((line, index) => {
    for (const [rule, expression] of rules)
      if (expression.test(line)) fail(name, rule, index + 1);
    if (identities.some((value) => line.toLowerCase().includes(value)))
      fail(name, "identità locale", index + 1);
    // Preserve upstream notices and permit GitHub's privacy-preserving identities.
    const emails =
      line.match(/[a-z0-9._%+\[\]-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
    if (
      !name.startsWith("build/THIRD_PARTY_LICENSES") &&
      name !== "package-lock.json" &&
      emails.some(
        (email) =>
          email !== "contributors@easyfonts.invalid" &&
          !/^(?:\d+\+)?[a-z0-9\[\]-]+@users\.noreply\.github\.com$/i.test(
            email,
          ) &&
          email !== "noreply@github.com",
      )
    )
      fail(name, "indirizzo email da verificare", index + 1);
  });
}

function inspectPng(name, buffer) {
  if (buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a")
    return fail(name, "PNG non valido");
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const size = buffer.readUInt32BE(offset);
    const kind = buffer.toString("ascii", offset + 4, offset + 8);
    if (["tEXt", "zTXt", "iTXt", "eXIf", "tIME"].includes(kind))
      fail(name, "metadati immagine da rimuovere");
    offset += size + 12;
    if (kind === "IEND") break;
  }
  if (offset !== buffer.length) fail(name, "dati PNG aggiuntivi o troncati");
}

for (const name of files) {
  if (
    forbiddenPath.test(name) ||
    (forbiddenExtension.test(name) && !binaryAssets.has(name))
  ) {
    fail(name, "file locale o formato non pubblicabile");
    continue;
  }
  const filename = path.join(root, name);
  const stat = await fs.lstat(filename);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    fail(name, "link o file speciale");
    continue;
  }
  if (stat.size > 10 * 1024 * 1024) {
    fail(name, "file oltre 10 MiB");
    continue;
  }
  const buffer = await fs.readFile(filename);
  if (name === "sample-fonts-pack.zip") {
    const manifest = JSON.parse(
      await fs.readFile(path.join(root, "docs/SAMPLE_FONTS.json"), "utf8"),
    );
    const expected = new Set([
      "abel/Abel-Regular.ttf",
      "abel/LICENSE.txt",
      "bangers/Bangers-Regular.ttf",
      "bangers/LICENSE.txt",
      "lato/Lato-Regular.ttf",
      "lato/Lato-Bold.ttf",
      "lato/LICENSE.txt",
      "SOURCES.md",
    ]);
    const zip = new AdmZip(buffer);
    if (zip.getZipComment()) fail(name, "commento archivio inatteso");
    const entries = zip.getEntries();
    for (const entry of entries) {
      if (!expected.delete(entry.entryName))
        fail(name, "contenuto ZIP inatteso");
      const content = entry.getData();
      const known = manifest[entry.entryName];
      if (
        !known ||
        content.length !== known.bytes ||
        crypto.createHash("sha256").update(content).digest("hex") !==
          known.sha256
      )
        fail(name, "contenuto diverso dal sample pubblico approvato");
      if (entry.comment) fail(name, "commento ZIP inatteso");
      if (!entry.entryName.endsWith(".ttf")) {
        // Licence documents contain public authors' emails required by the OFL.
        const value = entry.getData().toString("utf8");
        if (
          identities.some((identity) => value.toLowerCase().includes(identity))
        )
          fail(name, "identità locale nello ZIP");
      }
    }
    if (expected.size) fail(name, "sample pack incompleto");
  } else if (name.endsWith(".png")) {
    if (!binaryAssets.has(name)) fail(name, "immagine non approvata");
    inspectPng(name, buffer);
  } else if (name.endsWith(".ico")) {
    if (!binaryAssets.has(name)) fail(name, "icona non approvata");
  } else if (buffer.includes(0)) fail(name, "file binario non approvato");
  else inspectText(name, buffer.toString("utf8"));
}

const lock = JSON.parse(
  await fs.readFile(path.join(root, "package-lock.json"), "utf8"),
);
for (const [name, item] of Object.entries(lock.packages)) {
  if (item.resolved && !item.resolved.startsWith("https://registry.npmjs.org/"))
    fail("package-lock.json", `origine dipendenza da verificare: ${name}`);
}
// Review existing commit metadata as well; the diagnostic never echoes identities.
try {
  const history = execFileSync(
    "git",
    ["log", "--all", "--format=%an <%ae>%n%cn <%ce>%n%B"],
    { cwd: root, stdio: ["ignore", "pipe", "ignore"] },
  ).toString("utf8");
  inspectText("Git history metadata", history);
} catch (error) {
  if (error.status !== 128) throw error; // An unborn repository has no history yet.
}
if (problems.length) {
  console.error(
    `Controllo repository FALLITO (${problems.length}). Valori sensibili omessi.\n${problems.join("\n")}`,
  );
  process.exitCode = 1;
} else
  console.log(
    `Repository PASS: ${files.length} file; percorsi, identità locali, segreti noti, metadati PNG e sample ZIP controllati.`,
  );
