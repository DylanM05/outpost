// The page's one relay machine and the mission it's set up for. The machine
// is about 13 MB to download, so it starts the first time a terminal mission
// opens and then stays for the session, paused while no terminal is shown.
//
// Opening a mission restores the machine's saved state, then puts back the
// player's files from their last visit, or runs the mission's setup the
// first time. After each command the files are saved again.
import wasmUrl from "v86/build/v86.wasm?url";
import type { Mission } from "../content/parse";
import type { RunMode } from "../components/Bench";
import type { RunOutcome } from "../python/runner";
import { checkCode, loadWorkspaceCode, saveWorkspaceCode, setupCode, toRunResult, viewCode, type CheckReply } from "./checks";
import type { Manifest, RelayMachine } from "./machine";
import { clearWorkspace, loadWorkspace, saveWorkspace } from "./workspace";

const BASE = `${import.meta.env.BASE_URL}vm/`;
// A home directory bigger than this, compressed, isn't saved between visits.
const HOME_LIMIT = 2_000_000;
const SAVE_DELAY_MS = 1200;
const VIEW_DELAY_MS = 200;
const encoder = new TextEncoder();
// What a new terminal shows from before it opened.
const REPLAY_LIMIT = 200_000;

export const NOT_INSTALLED =
  "The relay terminal isn't installed on this server. Whoever runs it needs to build it once with `npm run vm`, which uses Docker.";

export type RelayStatus =
  | { kind: "off" }
  | { kind: "loading"; loaded: number; total: number }
  | { kind: "preparing" }
  | { kind: "ready"; missionId: string }
  | { kind: "failed"; message: string };

export type FileEntry = [name: string, children: FileEntry[] | null];

export interface FilesView {
  cwd: string | null;
  root: string;
  entries: FileEntry[];
  cut: boolean;
}

async function download(url: string, progress: (loaded: number, total: number) => void): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`Couldn't download the relay machine (${response.status}).`);
  const total = Number(response.headers.get("Content-Length")) || 0;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    progress(loaded, total);
  }
  const state = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    state.set(chunk, offset);
    offset += chunk.length;
  }
  return state.buffer;
}

async function readManifest(): Promise<Manifest> {
  const response = await fetch(BASE + "manifest.json", { cache: "no-cache" });
  // A server without the machine answers with the game's own page instead.
  const manifest = response.ok ? await response.json().catch(() => null) : null;
  if (!manifest?.state) throw new Error(NOT_INSTALLED);
  return manifest as Manifest;
}

// Where the prompt's escape sequence (ESC ] 7 ;) starts, or -1.
function promptStart(bytes: number[]): number {
  for (let i = 0; i + 3 < bytes.length; i++) {
    if (bytes[i] === 0x1b && bytes[i + 1] === 0x5d && bytes[i + 2] === 0x37 && bytes[i + 3] === 0x3b) return i;
  }
  return -1;
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

class RelaySession {
  status: RelayStatus = { kind: "off" };
  view: FilesView | null = null;
  private machine: Promise<RelayMachine> | null = null;
  // The mission whose files are in the machine, once it's ready.
  private mission: Mission | null = null;
  // Bumped whenever the files are replaced, so a save that started before
  // can't overwrite the new mission's workspace.
  private generation = 0;
  private queue: Promise<unknown> = Promise.resolve();
  private listeners = new Set<() => void>();
  private output = new Set<(bytes: Uint8Array) => void>();
  private clears = new Set<() => void>();
  // After a shell restart, output is held back until the new shell's first
  // prompt, so the terminal doesn't show the old session or the login.
  private holding: number[] | null = null;
  // Shown above that first prompt.
  private notice = "";
  private replay: Uint8Array[] = [];
  private replaySize = 0;
  private size = { columns: 80, rows: 24 };
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  private viewTimer: ReturnType<typeof setTimeout> | undefined;
  private shown = 0;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getStatus = () => this.status;
  getView = () => this.view;

  // Sets the machine up for a mission, unless it already is.
  open(mission: Mission): Promise<void> {
    return this.enqueue(async () => {
      if (this.mission?.id === mission.id && this.status.kind === "ready") return;
      await this.prepare(mission, await loadWorkspace(mission.id));
    }).catch(() => {});
  }

  // Throws away the player's files and starts the mission over.
  reset(mission: Mission): Promise<void> {
    return this.enqueue(async () => {
      await clearWorkspace(mission.id);
      await this.prepare(mission, null);
    }).catch(() => {});
  }

  check(mission: Mission, mode: RunMode, answer: string): Promise<RunOutcome> {
    return this.enqueue(async (): Promise<RunOutcome> => {
      try {
        if (this.mission?.id !== mission.id) await this.prepare(mission, await loadWorkspace(mission.id));
        const machine = await this.start();
        const hidden = mode === "submit" ? mission.hiddenChecks : "";
        const reply = await machine.call<CheckReply>(checkCode(mission.checks, hidden, answer, mission.scene));
        await this.save(mission.id, this.generation);
        return { kind: "finished", result: toRunResult(reply) };
      } catch (error) {
        return { kind: "failed", message: message(error) };
      }
    });
  }

  type(text: string) {
    void this.machine?.then((machine) => machine.type(text));
  }

  resize(columns: number, rows: number) {
    if (columns === this.size.columns && rows === this.size.rows) return;
    this.size = { columns, rows };
    void this.machine?.then((machine) => machine.resize(columns, rows)).catch(() => {});
  }

  // A terminal gets what the shell has printed since the mission opened, then
  // everything new.
  onOutput(listener: (bytes: Uint8Array) => void): () => void {
    for (const chunk of this.replay) listener(chunk);
    this.output.add(listener);
    return () => this.output.delete(listener);
  }

  onClear(listener: () => void): () => void {
    this.clears.add(listener);
    return () => this.clears.delete(listener);
  }

  // Terminals on screen. The machine only runs while there's at least one.
  show(): () => void {
    this.shown++;
    void this.machine?.then((machine) => machine.resume());
    return () => {
      this.shown--;
      if (this.shown > 0) return;
      void this.enqueue(async () => {
        if (this.mission) await this.save(this.mission.id, this.generation);
        if (this.shown === 0) (await this.machine)?.pause();
      }).catch(() => {});
    };
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const next = this.queue.then(task);
    this.queue = next.catch(() => {});
    return next;
  }

  private start(): Promise<RelayMachine> {
    this.machine ??= (async () => {
      this.setStatus({ kind: "loading", loaded: 0, total: 0 });
      const manifest = await readManifest();
      const state = await download(BASE + manifest.state, (loaded, total) => this.setStatus({ kind: "loading", loaded, total }));
      // The emulator is only fetched once someone opens a terminal mission.
      const { RelayMachine } = await import("./machine");
      const machine = await RelayMachine.start({ wasm: wasmUrl, base: BASE, manifest, state });
      machine.onOutput((bytes) => this.print(bytes));
      machine.onPrompt(() => this.afterCommand());
      return machine;
    })().catch((error) => {
      this.machine = null;
      this.setStatus({ kind: "failed", message: message(error) });
      throw error;
    });
    return this.machine;
  }

  private async prepare(mission: Mission, saved: string | null) {
    const machine = await this.start();
    this.generation++;
    this.mission = null;
    clearTimeout(this.saveTimer);
    this.setStatus({ kind: "preparing" });
    try {
      await machine.reset();
      await machine.resize(this.size.columns, this.size.rows);
      // The root setup always runs: it can do things a saved workspace can't
      // bring back, like adding users. Then the player's files go on top.
      if (mission.rootSetup.trim()) await machine.call(setupCode(mission.rootSetup, true));
      let restored = false;
      if (saved) restored = (await machine.exec(loadWorkspaceCode(saved))).ok;
      if (!restored && mission.setup.trim()) await machine.call(setupCode(mission.setup));
      this.replay = [];
      this.replaySize = 0;
      for (const clear of this.clears) clear();
      this.holding = [];
      this.notice = restored ? "Your files and command history are as you left them. Start over to begin again." : "";
      try {
        await machine.restartShell();
      } finally {
        // A shell whose settings hide the prompt sequence still gets shown.
        const held = this.holding;
        this.holding = null;
        if (held?.length) this.print(Uint8Array.from(held));
      }
      if (!this.shown) machine.pause();
    } catch (error) {
      this.setStatus({ kind: "failed", message: `This mission couldn't be set up: ${message(error)}` });
      throw error;
    }
    this.mission = mission;
    this.setStatus({ kind: "ready", missionId: mission.id });
    this.refreshView();
  }

  private print(bytes: Uint8Array) {
    if (this.holding) {
      for (const byte of bytes) this.holding.push(byte);
      const start = promptStart(this.holding);
      if (start === -1) return;
      const notice = this.notice ? encoder.encode(`\x1b[2m${this.notice}\x1b[0m\r\n`) : new Uint8Array();
      bytes = Uint8Array.from([...notice, ...this.holding.slice(start)]);
      this.holding = null;
      this.notice = "";
    }
    this.replay.push(bytes);
    this.replaySize += bytes.length;
    while (this.replaySize > REPLAY_LIMIT && this.replay.length > 1) this.replaySize -= this.replay.shift()!.length;
    for (const listener of this.output) listener(bytes);
  }

  private afterCommand() {
    if (!this.mission) return;
    const id = this.mission.id;
    const generation = this.generation;
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.enqueue(() => this.save(id, generation)).catch(() => {}), SAVE_DELAY_MS);
    this.refreshView();
  }

  private async save(missionId: string, generation: number) {
    if (generation !== this.generation || this.mission?.id !== missionId) return;
    const machine = await this.start();
    const home = await machine.call<string | null>(saveWorkspaceCode(HOME_LIMIT));
    if (home && generation === this.generation) await saveWorkspace(missionId, home);
  }

  // The files scene's view of the home directory, refreshed after each command.
  private refreshView() {
    if (this.mission?.scene !== "files") return;
    const generation = this.generation;
    clearTimeout(this.viewTimer);
    this.viewTimer = setTimeout(async () => {
      try {
        const view = await (await this.start()).call<FilesView>(viewCode());
        if (generation !== this.generation) return;
        this.view = view;
        this.emit();
      } catch {
        // The view is decoration; a missed refresh is fine.
      }
    }, VIEW_DELAY_MS);
  }

  private setStatus(status: RelayStatus) {
    this.status = status;
    this.emit();
  }

  private emit() {
    for (const listener of this.listeners) listener();
  }
}

export const relay = new RelaySession();
