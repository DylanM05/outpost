// The relay terminal: a small Linux machine (built from vm/) emulated in the
// page by v86. The player's shell is on the first serial port. The game's check
// agent (vm/guest/usr/local/lib/outpost/agent.py) is on the second: it runs
// Python as root, which is how missions are set up, checked, and saved.
//
// The machine starts from a saved state, so there's no boot. Once the check
// library is installed it saves itself again, uncompressed, and resetting
// restores that copy, which puts every file back the way it was.
import { V86 } from "v86";
import { LIBRARY_PY, resizeCode, restartShellCode, startCode } from "./checks";

export interface Manifest {
  state: string;
  memory: number;
  vgaMemory: number;
}

export interface MachineOptions {
  // Where v86.wasm and the vm folder are: URLs in the browser, paths in Node.
  wasm: string;
  base: string;
  manifest: Manifest;
  // The saved state, still compressed: v86 decompresses it on restore.
  state: ArrayBuffer;
}

export interface AgentReply {
  ok: boolean;
  value?: unknown;
  error?: string;
  printed: string;
}

type Pending = { resolve(reply: AgentReply): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout> };

const AGENT_TIMEOUT_MS = 30_000;
const encoder = new TextEncoder();

// The shell reports its directory with this escape sequence before every
// prompt (vm/guest/etc/bash/outpost.sh), so a prompt also means "ready".
const PROMPT = /\x1b\]7;file:\/\/[^/\x07]*([^\x07]*)\x07/g;

// Bytes as a string of the same length, one character per byte.
function latin1(bytes: Uint8Array): string {
  let text = "";
  for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return text;
}

export class RelayMachine {
  private readonly emulator: V86;
  private pristine: ArrayBuffer | null = null;
  // Counts restores; see guardFilesystem.
  private era = 0;
  private agentText = "";
  private shellTail = "";
  private pending = new Map<number, Pending>();
  private nextId = 1;
  private output = new Set<(bytes: Uint8Array) => void>();
  private prompts = new Set<(directory: string) => void>();
  private queued: number[] = [];
  private flushing = false;

  private constructor(options: MachineOptions) {
    this.emulator = new V86({
      wasm_path: options.wasm,
      memory_size: options.manifest.memory,
      vga_memory_size: options.manifest.vgaMemory,
      initial_state: { buffer: options.state },
      filesystem: { baseurl: options.base + "rootfs/" },
      autostart: true,
      uart1: true,
      disable_keyboard: true,
      disable_mouse: true,
      disable_speaker: true,
    });
    this.emulator.add_listener("serial0-output-byte", (byte: number) => this.shellByte(byte));
    this.emulator.add_listener("serial1-output-byte", (byte: number) => this.agentByte(byte));
  }

  // v86's 9p filesystem device answers some requests asynchronously. An
  // answer that arrives after a restore lands in the restored machine's queue,
  // which the restored kernel isn't expecting, and its filesystem hangs. So
  // each request is tagged with the restore it arrived in, and answers to
  // older ones are dropped. This reaches into v86's internals: if they change,
  // it does nothing and resets go back to being unguarded.
  private guardFilesystem() {
    type Chain = { era?: number };
    const device = (this.emulator as unknown as {
      v86?: { cpu?: { devices?: { virtio_9p?: { virtqueue?: { pop_request?(): Chain }; SendReply?(chain: Chain): void } } } };
    }).v86?.cpu?.devices?.virtio_9p;
    const queue = device?.virtqueue;
    if (!device?.SendReply || !queue?.pop_request) return;
    const pop = queue.pop_request.bind(queue);
    const send = device.SendReply.bind(device);
    queue.pop_request = () => Object.assign(pop(), { era: this.era });
    device.SendReply = (chain: Chain) => {
      if (chain.era === this.era) send(chain);
    };
  }

  static async start(options: MachineOptions): Promise<RelayMachine> {
    const machine = new RelayMachine(options);
    await new Promise<void>((resolve) => machine.emulator.add_listener("emulator-ready", () => resolve()));
    machine.guardFilesystem();
    await machine.call(LIBRARY_PY, true);
    machine.pristine = await machine.emulator.save_state();
    await machine.setClock();
    return machine;
  }

  // Puts the whole machine back to how it started.
  async reset(): Promise<void> {
    this.dropPending("The relay machine was reset.");
    this.era++;
    // v86 may reuse the buffer it restores from, so give it a copy.
    await this.emulator.restore_state(this.pristine!.slice(0));
    this.agentText = "";
    this.shellTail = "";
    await this.setClock();
  }

  // A restored machine's clock reads the time it was saved.
  private async setClock() {
    await this.call(startCode(Math.floor(Date.now() / 1000)));
  }

  // Stops the emulated CPU while no terminal is on screen, and starts it again.
  pause() {
    void this.emulator.stop();
  }

  resume() {
    void this.emulator.run();
  }

  destroy() {
    this.dropPending("The relay machine stopped.");
    void this.emulator.destroy();
  }

  // Keystrokes from the terminal.
  type(text: string) {
    this.emulator.serial_send_bytes(0, encoder.encode(text));
  }

  onOutput(listener: (bytes: Uint8Array) => void): () => void {
    this.output.add(listener);
    return () => this.output.delete(listener);
  }

  // Called each time the shell shows a prompt, with its directory.
  onPrompt(listener: (directory: string) => void): () => void {
    this.prompts.add(listener);
    return () => this.prompts.delete(listener);
  }

  nextPrompt(timeoutMs = 20_000): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        stop();
        reject(new Error("The relay shell didn't show a prompt."));
      }, timeoutMs);
      const stop = this.onPrompt((directory) => {
        clearTimeout(timer);
        stop();
        resolve(directory);
      });
    });
  }

  // Starts a fresh login shell, which reads the home directory's history and
  // settings, and waits for its first prompt.
  async restartShell(): Promise<void> {
    const prompt = this.nextPrompt();
    await this.exec(restartShellCode());
    await prompt;
  }

  async resize(columns: number, rows: number): Promise<void> {
    await this.exec(resizeCode(columns, rows));
  }

  // Runs Python in the check agent, as root. With persist, definitions stay
  // for later requests; otherwise the code gets a fresh copy of them.
  exec(code: string, persist = false, timeoutMs = AGENT_TIMEOUT_MS): Promise<AgentReply> {
    const id = this.nextId++;
    // Plain ASCII on the wire, so nothing is lost between the serial port and Python.
    const line = JSON.stringify({ id, code, persist }).replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("The relay machine stopped responding."));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.emulator.serial_send_bytes(1, encoder.encode(line + "\n"));
    });
  }

  // exec, for code that must work: a Python error becomes a thrown Error.
  async call<T = unknown>(code: string, persist = false): Promise<T> {
    const reply = await this.exec(code, persist);
    if (!reply.ok) throw new Error(reply.error);
    return reply.value as T;
  }

  private agentByte(byte: number) {
    if (byte !== 10) {
      this.agentText += String.fromCharCode(byte);
      return;
    }
    const line = this.agentText;
    this.agentText = "";
    let message: { id?: number } & AgentReply;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    const pending = message.id === undefined ? undefined : this.pending.get(message.id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(message.id!);
    pending.resolve({ ok: message.ok, value: message.value, error: message.error, printed: message.printed ?? "" });
  }

  // Bytes arrive one at a time; hand them on in chunks.
  private shellByte(byte: number) {
    this.queued.push(byte);
    if (this.flushing) return;
    this.flushing = true;
    setTimeout(() => this.flush(), 0);
  }

  private flush() {
    this.flushing = false;
    const bytes = Uint8Array.from(this.queued);
    this.queued = [];
    for (const listener of this.output) listener(bytes);

    // Look for prompts, keeping any sequence that's only partly arrived.
    let text = this.shellTail + latin1(bytes);
    let rest = 0;
    for (const match of text.matchAll(PROMPT)) {
      rest = match.index + match[0].length;
      const directory = new TextDecoder().decode(Uint8Array.from(match[1], (c) => c.charCodeAt(0)));
      for (const listener of [...this.prompts]) listener(directory);
    }
    text = text.slice(rest);
    const start = text.lastIndexOf("\x1b]");
    this.shellTail = start === -1 ? "" : text.slice(start, start + 4096);
  }

  private dropPending(message: string) {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error(message));
      this.pending.delete(id);
    }
  }
}
