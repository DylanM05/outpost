---
id: ts-build-typed-command-engine
kind: code
language: typescript
title: Build an end-to-end strictly typed Outpost command & state engine
system: Type audit
symbol: controller
scene: tests
assessment: true
skills: ts-fundamentals, ts-narrowing-unions, ts-generics-utilities
---

## Briefing

Tie **TS I (*The type foundry*)** together by building a strictly typed **`CommandEngine`** that parses untrusted `unknown` commands with a type guard, executes discriminated-union transitions exhaustively returning `Result<StationState, string>`, enforces `readonly` state immutability, and publishes strongly typed events!

## Objective

Define and implement:
1. **Types:**
   - `interface StationState { readonly online: boolean; readonly kw: number; readonly alerts: readonly string[]; }`
   - `type StationCommand = { kind: "power"; online: boolean } | { kind: "adjust"; deltaKw: number } | { kind: "alert"; message: string } | { kind: "clearAlerts" };`
   - `type Result<T, E = string> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };`
   - `type EngineEvents = { changed: { prev: StationState; next: StationState }; rejected: { reason: string } };`
2. **Type guard:**
   - `function isStationCommand(raw: unknown): raw is StationCommand` — validates untrusted `unknown` objects against all four `StationCommand` variants (`"power"` requires boolean `online`, `"adjust"` requires finite number `deltaKw`, `"alert"` requires non-empty string `message`, `"clearAlerts"` needs only `kind`).
3. **Exhaustive reducer:**
   - `function reduceState(state: StationState, cmd: StationCommand): Result<StationState, string>`:
     - `"power"`: returns `{ ok: true, value: { ...state, online: cmd.online } }`.
     - `"adjust"`: if `state.kw + cmd.deltaKw < 0`, returns `{ ok: false, error: "kw cannot be negative" }`; otherwise returns `{ ok: true, value: { ...state, kw: state.kw + cmd.deltaKw } }`.
     - `"alert"`: appends `cmd.message` to a new `alerts` array (`[...state.alerts, cmd.message]`).
     - `"clearAlerts"`: resets `alerts` to `[]`.
     - Includes an exhaustive `never` check in `default`.
4. **Engine class `class CommandEngine`:**
   - `constructor(initial: Partial<StationState> = {})` — initializes `state` with defaults `{ online: false, kw: 0, alerts: [] }` merged with `initial` (cloning `alerts`).
   - `getState(): StationState`
   - `on<K extends keyof EngineEvents>(event: K, fn: (payload: EngineEvents[K]) => void): () => void`
   - `dispatch(raw: unknown): Result<StationState, string>`:
     - Validates `raw` with `isStationCommand(raw)`. If invalid, emits `"rejected"` with `{ reason: "invalid command" }` and returns `{ ok: false, error: "invalid command" }`.
     - Runs `reduceState(this.state, raw)`. If `!res.ok`, emits `"rejected"` with `{ reason: res.error }` and returns `res`.
     - Updates `this.state = res.value`, emits `"changed"` with `{ prev, next: res.value }`, and returns `res`.

## Concept

Combine every TS I pattern: `readonly` state interfaces, discriminated unions with `never` exhaustiveness, `unknown` user-defined type guards, `Partial<StationState>`, generic `Result<T, E>`, and `<K extends keyof EngineEvents>` typed pub/sub!

## Hints

1. Keep `assertNever(x: never): never` for the `default:` branch of `reduceState`.
2. Make sure `isStationCommand` rejects `null`, arrays, non-objects, `NaN`/`Infinity` in `deltaKw`, and empty string `""` in `alert.message`.

## Starter: guided

```typescript
interface StationState {
  readonly online: boolean;
  readonly kw: number;
  readonly alerts: readonly string[];
}

type StationCommand =
  | { kind: "power"; online: boolean }
  | { kind: "adjust"; deltaKw: number }
  | { kind: "alert"; message: string }
  | { kind: "clearAlerts" };

type Result<T, E = string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

type EngineEvents = {
  changed: { prev: StationState; next: StationState };
  rejected: { reason: string };
};

function isStationCommand(raw: unknown): raw is StationCommand {
  return false;
}

function reduceState(state: StationState, cmd: StationCommand): Result<StationState, string> {
  return { ok: false, error: "not implemented" };
}

class CommandEngine {
  constructor(initial: Partial<StationState> = {}) {}
  getState(): StationState { return { online: false, kw: 0, alerts: [] }; }
  on<K extends keyof EngineEvents>(event: K, fn: (payload: EngineEvents[K]) => void): () => void { return () => {}; }
  dispatch(raw: unknown): Result<StationState, string> { return { ok: false, error: "not implemented" }; }
}
```

## Starter: standard

```typescript
// Define StationState, StationCommand, Result, EngineEvents, isStationCommand, reduceState, and CommandEngine
```

## Starter: challenge

```typescript
```

## Checks

```javascript
expectType(
  "CommandEngine, isStationCommand, and reduceState expose strict typed APIs",
  `const _eng = new CommandEngine({ kw: 50 });
   const _st: StationState = _eng.getState();
   const _unsub: () => void = _eng.on("changed", ({ prev, next }) => { const _diff: number = next.kw - prev.kw; });
   const _res: Result<StationState, string> = _eng.dispatch({ kind: "power", online: true });`,
);

expectTypeError(
  "StationState forbids mutating readonly kw at compile time",
  "const _s: StationState = { online: true, kw: 10, alerts: [] }; _s.kw = 20;",
  2540,
);

expectTypeError(
  "CommandEngine.on rejects unknown event names at compile time",
  "const _e = new CommandEngine(); _e.on('bogus', () => {});",
  2345,
);

expect("validates unknown commands, applies immutable transitions, rejects invalid/negative deltas, and emits events", () => {
  const Engine = get("CommandEngine");
  const eng = new Engine({ kw: 20 });
  const changes = [];
  const rejections = [];
  eng.on("changed", ({ prev, next }) => changes.push(`${prev.kw}->${next.kw}`));
  eng.on("rejected", ({ reason }) => rejections.push(reason));

  const r1 = eng.dispatch({ kind: "power", online: true });
  const r2 = eng.dispatch({ kind: "adjust", deltaKw: 30 });
  const r3 = eng.dispatch({ kind: "adjust", deltaKw: -100 });
  const r4 = eng.dispatch({ kind: "alert", message: "heat" });
  const r5 = eng.dispatch({ kind: "alert", message: "" });
  const r6 = eng.dispatch({ kind: "clearAlerts" });

  return {
    r1Ok: r1.ok,
    r2Kw: r2.value.kw,
    r3,
    r4Alerts: r4.value.alerts,
    r5,
    r6Alerts: r6.value.alerts,
    finalState: eng.getState(),
    changes,
    rejections,
  };
}, {
  r1Ok: true,
  r2Kw: 50,
  r3: { ok: false, error: "kw cannot be negative" },
  r4Alerts: ["heat"],
  r5: { ok: false, error: "invalid command" },
  r6Alerts: [],
  finalState: { online: true, kw: 50, alerts: [] },
  changes: ["20->20", "20->50", "50->50", "50->50"],
  rejections: ["kw cannot be negative", "invalid command"],
});
```

## Hidden checks

```javascript
expect("isStationCommand rejects null, arrays, NaN deltaKw, and wrong field types", () => {
  const isCmd = get("isStationCommand");
  return [
    isCmd(null),
    isCmd([]),
    isCmd({ kind: "power", online: "yes" }),
    isCmd({ kind: "adjust", deltaKw: NaN }),
    isCmd({ kind: "unknown" }),
    isCmd({ kind: "clearAlerts" }),
  ];
}, [false, false, false, false, false, true]);
```

## Solution

```typescript
interface StationState {
  readonly online: boolean;
  readonly kw: number;
  readonly alerts: readonly string[];
}

type StationCommand =
  | { kind: "power"; online: boolean }
  | { kind: "adjust"; deltaKw: number }
  | { kind: "alert"; message: string }
  | { kind: "clearAlerts" };

type Result<T, E = string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

type EngineEvents = {
  changed: { prev: StationState; next: StationState };
  rejected: { reason: string };
};

function assertNever(val: never): never {
  throw new Error(`Unexpected command: ${JSON.stringify(val)}`);
}

function isStationCommand(raw: unknown): raw is StationCommand {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return false;
  const rec = raw as Record<string, unknown>;
  switch (rec.kind) {
    case "power":
      return typeof rec.online === "boolean";
    case "adjust":
      return typeof rec.deltaKw === "number" && Number.isFinite(rec.deltaKw);
    case "alert":
      return typeof rec.message === "string" && rec.message.length > 0;
    case "clearAlerts":
      return true;
    default:
      return false;
  }
}

function reduceState(state: StationState, cmd: StationCommand): Result<StationState, string> {
  switch (cmd.kind) {
    case "power":
      return { ok: true, value: { ...state, online: cmd.online } };
    case "adjust": {
      const nextKw = state.kw + cmd.deltaKw;
      if (nextKw < 0) return { ok: false, error: "kw cannot be negative" };
      return { ok: true, value: { ...state, kw: nextKw } };
    }
    case "alert":
      return { ok: true, value: { ...state, alerts: [...state.alerts, cmd.message] } };
    case "clearAlerts":
      return { ok: true, value: { ...state, alerts: [] } };
    default:
      return assertNever(cmd);
  }
}

class CommandEngine {
  private state: StationState;
  private listeners = new Map<keyof EngineEvents, Set<(payload: any) => void>>();

  constructor(initial: Partial<StationState> = {}) {
    this.state = {
      online: initial.online ?? false,
      kw: initial.kw ?? 0,
      alerts: initial.alerts ? [...initial.alerts] : [],
    };
  }

  getState(): StationState {
    return this.state;
  }

  on<K extends keyof EngineEvents>(event: K, fn: (payload: EngineEvents[K]) => void): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn);
    return () => {
      set!.delete(fn);
    };
  }

  private emit<K extends keyof EngineEvents>(event: K, payload: EngineEvents[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of [...set]) fn(payload);
  }

  dispatch(raw: unknown): Result<StationState, string> {
    if (!isStationCommand(raw)) {
      this.emit("rejected", { reason: "invalid command" });
      return { ok: false, error: "invalid command" };
    }
    const prev = this.state;
    const res = reduceState(prev, raw);
    if (!res.ok) {
      this.emit("rejected", { reason: res.error });
      return res;
    }
    this.state = res.value;
    this.emit("changed", { prev, next: res.value });
    return res;
  }
}
```

## Restored

The type foundry is fully online — your strictly typed `CommandEngine` guarantees compile-time immutability, exhaustive transitions, `unknown` boundary guards, and type-safe event dispatch.
