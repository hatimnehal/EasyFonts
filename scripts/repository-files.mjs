import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export function repositoryFiles() {
  // Include tracked files even if a later ignore rule would hide them.
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root },
  );
  return [
    ...new Set(output.toString("utf8").split("\0").filter(Boolean)),
  ].sort();
}
