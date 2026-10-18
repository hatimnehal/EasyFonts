import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import AdmZip from "adm-zip";
import { root, repositoryFiles } from "./repository-files.mjs";

// Fixed upstream version, binary verified against the official SHA-256 manifest.
const version = "8.30.1";
const platforms = { win32: "windows", linux: "linux", darwin: "darwin" };
if (!platforms[process.platform] || !["x64", "arm64"].includes(process.arch))
  throw Error("Piattaforma Gitleaks non supportata");
const extension = process.platform === "win32" ? "zip" : "tar.gz";
const asset = `gitleaks_${version}_${platforms[process.platform]}_${process.arch}.${extension}`;
const base = `https://github.com/gitleaks/gitleaks/releases/download/v${version}`;
const tools = path.join(
  root,
  ".tools",
  `gitleaks-${version}-${process.platform}-${process.arch}`,
);
const exe = path.join(
  tools,
  process.platform === "win32" ? "gitleaks.exe" : "gitleaks",
);
await fs.mkdir(tools, { recursive: true });
async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok)
    throw Error(`Download strumento non riuscito (${response.status})`);
  return Buffer.from(await response.arrayBuffer());
}
let archive;
try {
  archive = await fs.readFile(path.join(tools, asset));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  archive = await download(`${base}/${asset}`);
}
let manifest;
try {
  manifest = await fs.readFile(path.join(tools, "checksums.txt"), "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  manifest = (
    await download(`${base}/gitleaks_${version}_checksums.txt`)
  ).toString("utf8");
}
const expected = manifest
  .split(/\r?\n/)
  .map((line) => line.trim().split(/\s+/))
  .find((parts) => parts[1] === asset)?.[0];
if (
  !expected ||
  crypto.createHash("sha256").update(archive).digest("hex") !== expected
)
  throw Error("Checksum Gitleaks non valido");
await fs.writeFile(path.join(tools, asset), archive);
await fs.writeFile(path.join(tools, "checksums.txt"), manifest);
if (extension === "zip") {
  const entry = new AdmZip(archive).getEntry("gitleaks.exe");
  if (!entry) throw Error("Eseguibile Gitleaks assente");
  await fs.writeFile(exe, entry.getData());
} else {
  execFileSync("tar", [
    "-xzf",
    path.join(tools, asset),
    "-C",
    tools,
    "gitleaks",
  ]);
  await fs.chmod(exe, 0o755);
}
const snapshot = await fs.mkdtemp(
  path.join(os.tmpdir(), "easyfonts-source-scan-"),
);
try {
  for (const name of repositoryFiles()) {
    const source = path.join(root, name);
    if (!(await fs.lstat(source)).isFile())
      throw Error("File speciale nello snapshot");
    const target = path.join(snapshot, name);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(source, target);
  }
  const scans = [["dir", snapshot]];
  if (process.argv.includes("--history")) scans.push(["git", root]);
  for (const args of scans) {
    const result = spawnSync(
      exe,
      [
        ...args,
        "--redact=100",
        "--no-banner",
        "--max-archive-depth=2",
        "--max-decode-depth=2",
      ],
      { cwd: root, stdio: "inherit" },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      process.exitCode = result.status || 1;
      break;
    }
  }
} finally {
  if (
    path.dirname(snapshot) !== path.resolve(os.tmpdir()) ||
    !path.basename(snapshot).startsWith("easyfonts-source-scan-")
  )
    throw Error("Percorso temporaneo non valido");
  await fs.rm(snapshot, { recursive: true, force: true });
}
