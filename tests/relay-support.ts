// Starts the relay machine in Node from the files `npm run vm` builds.
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { RelayMachine, type Manifest } from "../src/relay/machine";

const vm = join(__dirname, "..", "public", "vm");
export const machineBuilt = existsSync(join(vm, "manifest.json"));

export async function startMachine(): Promise<RelayMachine> {
  const manifest = JSON.parse(readFileSync(join(vm, "manifest.json"), "utf8")) as Manifest;
  const state = readFileSync(join(vm, manifest.state));
  return RelayMachine.start({
    wasm: createRequire(import.meta.url).resolve("v86/build/v86.wasm"),
    base: vm + "/",
    manifest,
    state: state.buffer.slice(state.byteOffset, state.byteOffset + state.byteLength) as ArrayBuffer,
  });
}
