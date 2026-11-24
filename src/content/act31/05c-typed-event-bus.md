---
id: ts-typed-event-bus
kind: code
language: typescript
title: Build a type-safe generic TypedBus<Events> mapping event names to payload types
system: Utility deck
symbol: controller
scene: tests
skills: ts-generics-utilities
---

## Briefing

Plain JavaScript `EventEmitter`s accept any string event name and pass `any` payload — one typo in an event name or payload field fails silently at runtime. Parameterize a generic **`TypedBus<Events>`** over an event-map interface so TypeScript verifies every listener and `emit` call!

## Objective

Implement `class TypedBus<Events extends Record<string, unknown>>`:
- `on<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): () => void`
  - Registers `listener` for `event` and returns an unsubscribe function `() => void`.
- `emit<K extends keyof Events>(event: K, payload: Events[K]): number`
  - Invokes all current listeners for `event` in registration order (snapshot-safe if a listener unsubscribes during `emit`) and returns the number of listeners called.
- `listenerCount<K extends keyof Events>(event: K): number`
  - Returns the number of active listeners for `event`.

## Concept

- `Events extends Record<string, unknown>` lets callers pass an event map like `type AppEvents = { boot: { version: number }; alert: string };`.
- `<K extends keyof Events>(event: K, payload: Events[K])` links the first argument's literal key (`"boot"`) directly to the second argument's required payload type (`{ version: number }`)!
- Internally, storing listeners in a `Map<keyof Events, Set<(payload: any) => void>>` keeps the runtime implementation tiny while the public methods stay 100% strictly typed.

## Hints

1. Declare `private listeners = new Map<keyof Events, Set<(payload: any) => void>>();`.
2. In `emit`, snapshot with `[...set]` before iterating so unsubscribing inside a callback never skips the next listener.

## Starter: guided

```typescript
class TypedBus<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<(payload: any) => void>>();

  on<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): () => void {
    return () => {};
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): number {
    return 0;
  }

  listenerCount<K extends keyof Events>(event: K): number {
    return 0;
  }
}
```

## Starter: standard

```typescript
// Implement generic class TypedBus<Events extends Record<string, unknown>> with on, emit, and listenerCount
```

## Starter: challenge

```typescript
```

## Checks

```javascript
expectType(
  "enforces exact payload types per event name on both on() and emit()",
  `type GridEvents = { power: { kw: number }; alert: string };
   const _bus = new TypedBus<GridEvents>();
   const _unsub: () => void = _bus.on("power", (p) => { const _n: number = p.kw; });
   const _count: number = _bus.emit("alert", "overheat");`,
);

expectTypeError(
  "rejects wrong payload type for an event name at compile time",
  `type GridEvents = { power: { kw: number }; alert: string };
   const _bus = new TypedBus<GridEvents>();
   _bus.emit("power", "not-an-object");`,
  2345,
);

expectTypeError(
  "rejects unknown event name at compile time",
  `type GridEvents = { power: { kw: number } };
   const _bus = new TypedBus<GridEvents>();
   _bus.on("typo", () => {});`,
  2345,
);

expect("delivers payloads in order, supports unsubscribe, and returns invoked count", () => {
  const Bus = get("TypedBus");
  const bus = new Bus();
  const seen = [];
  const off1 = bus.on("power", (p) => seen.push(`a:${p.kw}`));
  bus.on("power", (p) => seen.push(`b:${p.kw}`));
  const c1 = bus.emit("power", { kw: 50 });
  off1();
  const c2 = bus.emit("power", { kw: 80 });
  return { seen, c1, c2, left: bus.listenerCount("power") };
}, {
  seen: ["a:50", "b:50", "b:80"],
  c1: 2,
  c2: 1,
  left: 1,
});
```

## Hidden checks

```javascript
expect("unsubscribing during emit does not skip remaining listeners", () => {
  const bus = new (get("TypedBus"))();
  const log = [];
  let off;
  off = bus.on("ping", () => { log.push(1); off(); });
  bus.on("ping", () => log.push(2));
  bus.emit("ping", null);
  bus.emit("ping", null);
  return log;
}, [1, 2, 2]);
```

## Solution

```typescript
class TypedBus<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<(payload: any) => void>>();

  on<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return () => {
      set!.delete(listener);
    };
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): number {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return 0;
    const snapshot = [...set];
    for (const fn of snapshot) {
      fn(payload);
    }
    return snapshot.length;
  }

  listenerCount<K extends keyof Events>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
```

## Restored

Utility deck typed event bus online — event names and payloads are now checked end to end by TypeScript.
