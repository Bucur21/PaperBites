import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const nextDir = join(appRoot, ".next");
if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
}
