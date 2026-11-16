// Runs learner code off the main thread. The runner terminates this worker if
// a run goes past its time limit, which is how infinite loops are stopped.
import type { PyodideInterface } from "pyodide";
import { HARNESS_PY } from "./harness";

export type WorkerRequest = { id: number; code: string; checks: string; hidden: string };

export type WorkerMessage =
  | { type: "ready" }
  | { type: "boot-failed"; message: string }
  | { type: "started"; id: number }
  | { type: "result"; id: number; json: string }
  | { type: "failed"; id: number; message: string }
  | { type: "crashed"; id: number };

const scope = self as unknown as {
  postMessage(message: WorkerMessage): void;
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  location: Location;
};

// Pyodide is served from public/pyodide by the game's own server. An absolute
// URL keeps Vite from rewriting the import in development.
const indexURL = new URL(`${import.meta.env.BASE_URL}pyodide/`, scope.location.origin).href;

async function boot(): Promise<PyodideInterface> {
  const { loadPyodide } = (await import(/* @vite-ignore */ `${indexURL}pyodide.mjs`)) as typeof import("pyodide");
  const pyodide = await loadPyodide({ indexURL });
  pyodide.setStdin({ error: true });
  pyodide.runPython(HARNESS_PY);
  return pyodide;
}

const ready = boot();
ready.then(
  () => scope.postMessage({ type: "ready" }),
  (err: unknown) => scope.postMessage({ type: "boot-failed", message: String(err) }),
);

scope.onmessage = async (event) => {
  const { id, code, checks, hidden } = event.data;
  const pyodide = await ready;
  scope.postMessage({ type: "started", id });
  const runMission = pyodide.globals.get("run_mission");
  try {
    scope.postMessage({ type: "result", id, json: runMission(code, checks, hidden) as string });
  } catch (err) {
    // Recursion through built-in functions (sum() over a generator that
    // recurses, say) grows the browser's stack, and can exhaust it before
    // Python's own recursion limit. That's fatal to this interpreter, so the
    // runner replaces the worker.
    const message = String(err);
    if (/Maximum call stack size exceeded|fatally failed/.test(message)) scope.postMessage({ type: "crashed", id });
    else scope.postMessage({ type: "failed", id, message });
  } finally {
    try {
      runMission.destroy();
    } catch {
      // Already unusable after a crash.
    }
  }
};
