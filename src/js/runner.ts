import type { RunResult } from "../python/harness";
import type { RunnerStatus, RunOutcome } from "../python/runner";
import type { JsWorkerMessage, JsWorkerRequest } from "./worker";

type Pending = { resolve: (outcome: RunOutcome) => void; timer?: ReturnType<typeof setTimeout> };

const TIME_LIMIT_MS = 5000;

// Owns the JavaScript Web Worker. Mirrors PythonRunner so the UI treats both
// runtimes identically, including 5-second timeout termination & respawn.
export class JsRunner {
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
    const request: JsWorkerRequest = { id, code, checks, hidden };
    return new Promise((resolve) => {
      this.pending.set(id, { resolve });
      this.setStatus("running");
      this.worker!.postMessage(request);
    });
  }

  private spawn() {
    this.setStatus("loading");
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<JsWorkerMessage>) => this.handle(event.data);
    worker.onerror = (event) => this.fail(`The JavaScript runtime stopped unexpectedly: ${event.message}`);
    this.worker = worker;
  }

  private handle(message: JsWorkerMessage) {
    switch (message.type) {
      case "ready":
        if (this.pending.size === 0) this.setStatus("ready");
        break;
      case "started": {
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
    this.worker?.terminate();
    this.worker = null;
    this.settle(id, { kind: "timeout", seconds: TIME_LIMIT_MS / 1000 });
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
