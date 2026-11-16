// Boots the relay machine from the image files in public/vm and saves its
// state once the player's shell and the check agent are both up. Players
// restore this state instead of booting Linux, so the terminal is ready in a
// second or two rather than half a minute.
//
// Writes public/vm/state-<hash>.bin.zst and public/vm/manifest.json, which
// names the state file and the settings the game must restore it with.
import { createHash } from "node:crypto";
import { readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { constants, zstdCompressSync } from "node:zlib";
import { V86 } from "v86";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "public", "vm");
const require = createRequire(import.meta.url);

const settings = {
  memory: 128 * 1024 * 1024,
  vgaMemory: 2 * 1024 * 1024,
  // A 9p root filesystem, served file by file. init_on_free zeroes freed
  // memory so the saved state compresses well.
  cmdline:
    "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable init_on_free=1 quiet",
};

// Programs most missions use, run once before saving so they're already in
// the state rather than fetched file by file on a player's first command.
const WARM = ["git --version", "python3 -c pass", "nano --version", "less --version", "tree --version", "man -w ls"];

const started = Date.now();
const elapsed = () => `${((Date.now() - started) / 1000).toFixed(1)}s`;

const emulator = new V86({
  wasm_path: require.resolve("v86/build/v86.wasm"),
  bios: { url: join(here, "bios", "seabios.bin") },
  vga_bios: { url: join(here, "bios", "vgabios.bin") },
  memory_size: settings.memory,
  vga_memory_size: settings.vgaMemory,
  autostart: true,
  uart1: true,
  bzimage_initrd_from_filesystem: true,
  cmdline: settings.cmdline,
  filesystem: { baseurl: join(out, "rootfs") + "/", basefs: join(out, "fs.json") },
});

let shell = "";
let agent = "";
emulator.add_listener("serial0-output-byte", (byte) => (shell += String.fromCharCode(byte)));
emulator.add_listener("serial1-output-byte", (byte) => (agent += String.fromCharCode(byte)));

function until(test, what, seconds = 180) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + seconds * 1000;
    const timer = setInterval(() => {
      if (test()) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() > deadline) {
        clearInterval(timer);
        reject(new Error(`Timed out waiting for ${what}.\nShell: ${shell.slice(-400)}\nAgent: ${agent.slice(-400)}`));
      }
    }, 50);
  });
}

let requests = 0;
async function run(code) {
  const id = ++requests;
  emulator.serial_send_bytes(1, new TextEncoder().encode(JSON.stringify({ id, code }) + "\n"));
  let reply;
  await until(() => {
    for (const line of agent.split("\n")) {
      if (line.startsWith(`{"id": ${id},`)) reply = JSON.parse(line);
    }
    return reply;
  }, `agent reply ${id}`, 60);
  if (!reply.ok) throw new Error(reply.error);
  return reply.value;
}

console.log("[vm] booting the relay machine…");
await until(() => shell.includes("ranger@relay"), "the player's shell");
await until(() => agent.includes('{"ready": true}'), "the check agent");
console.log(`[vm] shell and agent up after ${elapsed()}`);

await run(`
import subprocess
for command in ${JSON.stringify(WARM)}:
    subprocess.run(command, shell=True, capture_output=True, cwd="/home/ranger")
subprocess.run("sync; echo 3 > /proc/sys/vm/drop_caches", shell=True)
`);
// Let the shell settle before the snapshot.
await new Promise((resolve) => setTimeout(resolve, 3000));

const state = Buffer.from(await emulator.save_state());
emulator.destroy();
const compressed = zstdCompressSync(state, { params: { [constants.ZSTD_c_compressionLevel]: 19 } });
const name = `state-${createHash("sha256").update(compressed).digest("hex").slice(0, 12)}.bin.zst`;

for (const file of readdirSync(out)) if (/^state-.*\.bin\.zst$/.test(file)) rmSync(join(out, file));
writeFileSync(join(out, name), compressed);
writeFileSync(join(out, "manifest.json"), JSON.stringify({ state: name, ...settings }, null, 2) + "\n");
console.log(`[vm] saved ${name}: ${(compressed.length / 1e6).toFixed(1)} MB (${(state.length / 1e6).toFixed(1)} MB raw) after ${elapsed()}`);
// Vite's dev server keeps a list of public files and can miss thousands of
// them being replaced at once, then answers with the game's page instead.
console.log("[vm] if `npm run dev` is running, restart it so it serves the new files.");
process.exit(0);
