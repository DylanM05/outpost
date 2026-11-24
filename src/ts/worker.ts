// Runs learner TypeScript code off the main thread in a dedicated Web Worker
// so strict typechecking + execution stay non-blocking and timeout-protected.
import { runTsMission } from "./harness";

export type TsWorkerRequest = { id: number; code: string; checks: string; hidden: string };

export type TsWorkerMessage =
  | { type: "ready" }
  | { type: "started"; id: number }
  | { type: "result"; id: number; json: string }
  | { type: "failed"; id: number; message: string };

const scope = self as unknown as {
  postMessage(message: TsWorkerMessage): void;
  onmessage: ((event: MessageEvent<TsWorkerRequest>) => void) | null;
};

scope.postMessage({ type: "ready" });

scope.onmessage = async (event) => {
  const { id, code, checks, hidden } = event.data;
  scope.postMessage({ type: "started", id });
  try {
    const result = await runTsMission(code, checks, hidden);
    scope.postMessage({ type: "result", id, json: JSON.stringify(result) });
  } catch (err) {
    scope.postMessage({ type: "failed", id, message: String(err) });
  }
};
