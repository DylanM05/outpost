import type { RunResult } from "./harness";
import type { WorkerMessage, WorkerRequest } from "./worker";

export type RunnerStatus = "loading" | "ready" | "running" | "unavailable";

export type RunOutcome =
  | { kind: "finished"; result: RunResult }
  | { kind: "timeout"; seconds: number }
  | { kind: "failed"; message: string };

type Pending = { resolve: (outcome: RunOutcome) => void; timer?: ReturnType<typeof setTimeout> };

const TIME_LIMIT_MS = 5000;

// Reported when deep recursion crashed the interpreter, in the same form as
// Python's own RecursionError so the player gets the same explanation.
const STACK_OVERFLOW: RunResult = {
  stdout: "",
  stdoutTruncated: false,
  error: {
    phase: "runtime",
    type: "RecursionError",
    message: "the program called functions so deeply that Python ran out of room and had to restart",
    line: null,
  },
  checks: [],
  events: [],
};

// Owns the Python worker. One run at a time; a run that exceeds the time limit
// gets its worker terminated and replaced with a fresh interpreter.
export class PythonRunner {
  private worker: Worker | null = null;
  private pending = new Map<number, Pending>();
  private nextId = 1;
  private listeners = new Set<(status: RunnerStatus) => void>();
  status: RunnerStatus = "loading";

  constructor() {
    this.spawn();
  }

  subscribe(listener: (status: RunnerStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  run(code: string, checks: string, hidden = ""): Promise<RunOutcome> {
    if (!this.worker) this.spawn();
    const id = this.nextId++;
    const request: WorkerRequest = { id, code, checks, hidden };
    return new Promise((resolve) => {
      this.pending.set(id, { resolve });
      this.setStatus("running");
      this.worker!.postMessage(request);
    });
  }

  private spawn() {
    this.setStatus("loading");
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => this.handle(event.data);
    worker.onerror = (event) => this.fail(`The Python runtime stopped unexpectedly: ${event.message}`);
    this.worker = worker;
  }

  private handle(message: WorkerMessage) {
    switch (message.type) {
      case "ready":
        if (this.pending.size === 0) this.setStatus("ready");
        break;
      case "boot-failed":
        this.fail(`Python could not start: ${message.message}`);
        this.setStatus("unavailable");
        break;
      case "started": {
        // The clock starts once Python is actually running the code, so the
        // first run isn't charged for downloading the interpreter.
        const pending = this.pending.get(message.id);
        if (pending) pending.timer = setTimeout(() => this.timeout(message.id), TIME_LIMIT_MS);
        break;
      }
      case "result":
        this.settle(message.id, { kind: "finished", result: JSON.parse(message.json) as RunResult });
        break;
      case "failed":
        this.settle(message.id, { kind: "failed", message: message.message });
        break;
      case "crashed":
        this.replace(message.id, { kind: "finished", result: STACK_OVERFLOW });
        break;
    }
  }

  private settle(id: number, outcome: RunOutcome) {
    const pending = this.pending.get(id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(id);
    pending.resolve(outcome);
    if (this.pending.size === 0) this.setStatus("ready");
  }

  private timeout(id: number) {
    this.replace(id, { kind: "timeout", seconds: TIME_LIMIT_MS / 1000 });
  }

  // Ends a run whose interpreter can't be trusted any more, and starts a fresh one.
  private replace(id: number, outcome: RunOutcome) {
    this.worker?.terminate();
    this.worker = null;
    this.settle(id, outcome);
    this.spawn();
  }

  private fail(message: string) {
    for (const id of [...this.pending.keys()]) this.settle(id, { kind: "failed", message });
  }

  private setStatus(status: RunnerStatus) {
    this.status = status;
    for (const listener of this.listeners) listener(status);
  }
}
