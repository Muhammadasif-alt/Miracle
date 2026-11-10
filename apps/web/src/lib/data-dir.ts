import path from "node:path";
import fs from "node:fs";

/**
 * Returns the canonical data directory regardless of whether the process
 * was started in repository root or in apps/web.
 */
export function getCanonicalDataDir(): string {
  const cwd = process.cwd();
  const dir = cwd.endsWith("apps\\web") || cwd.endsWith("apps/web")
    ? path.join(cwd, ".data")
    : path.join(cwd, "apps", "web", ".data");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getDataFilePath(filename: string): string {
  return path.join(getCanonicalDataDir(), filename);
}
