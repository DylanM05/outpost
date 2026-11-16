// Copies the Pyodide runtime into public/ so the game serves Python itself.
// No CDN is involved: a self-hosted install works fully offline.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "pyodide");
const target = join(root, "public", "pyodide");

if (!existsSync(source)) {
  console.warn("[copy-pyodide] pyodide is not installed yet; skipping.");
  process.exit(0);
}

const runtimeFile = /\.(mjs|js|wasm|zip|json)$/;
const skip = new Set(["package.json"]);

mkdirSync(target, { recursive: true });
let copied = 0;
for (const name of readdirSync(source)) {
  if (!runtimeFile.test(name) || skip.has(name)) continue;
  cpSync(join(source, name), join(target, name));
  copied++;
}
console.log(`[copy-pyodide] copied ${copied} runtime files to public/pyodide`);
