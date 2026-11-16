// Builds the relay terminal's machine into public/vm: the Linux image (with
// Docker, from the relay stages of the Dockerfile), then the saved state.
// Usage: npm run vm
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "vm");

rmSync(out, { recursive: true, force: true });
console.log("[vm] building the Linux image with Docker…");
const docker = spawnSync("docker", ["build", "--target", "relay-files", "--output", `type=local,dest=${out}`, root], {
  stdio: "inherit",
});
if (docker.error || docker.status !== 0) {
  console.error("[vm] the Docker build failed. The relay terminal needs Docker (or Podman) to build its Linux image.");
  process.exit(1);
}
await import("./build-state.mjs");
