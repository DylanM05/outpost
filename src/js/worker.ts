// Runs learner JavaScript off the main thread. The runner terminates this
// worker if a run goes past its time limit, stopping infinite loops safely.
import { runJsMission } from "./harness";

export type JsWorkerRequest = { id: number; code: string; checks: string; hidden: string };

export type JsWorkerMessage =
  | { type: "ready" }
  | { type: "started"; id: number }
  | { type: "result"; id: number; json: string }
  | { type: "failed"; id: number; message: string };

const scope = self as unknown as {
  postMessage(message: JsWorkerMessage): void;
  onmessage: ((event: MessageEvent<JsWorkerRequest>) => void) | null;
};

scope.postMessage({ type: "ready" });

scope.onmessage = async (event) => {
  const { id, code, checks, hidden } = event.data;
  scope.postMessage({ type: "started", id });
  try {
    const result = await runJsMission(code, checks, hidden);
    scope.postMessage({ type: "result", id, json: JSON.stringify(result) });
  } catch (err) {
    scope.postMessage({ type: "failed", id, message: String(err) });
  }
};
