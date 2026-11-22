---
id: js-event-emitter
kind: code
language: javascript
title: Implement a snapshot-safe EventEmitter with once and Promise waitFor
system: Event bench
symbol: equipment
scene: tests
skills: js-streams-buffers
---

## Briefing

Runtime subsystems coordinate through an event bus. A classic bug in hand-rolled event emitters occurs when a `once` listener (or a listener calling `off`) mutates the listener array *while* `emit` is iterating over it — causing the very next listener in line to be skipped!

## Concept

Implement `class EventEmitter` with:
- **`on(event, fn)`:** appends `fn` to the listener list for `event` and returns an unsubscribe function `() => this.off(event, fn)`.
- **`once(event, fn)`:** registers a wrapper listener that removes itself before invoking `fn(...args)` and returns an unsubscribe function. Attach `wrapper.fn = fn` so `this.off(event, fn)` also removes an un-fired `once` listener!
- **`off(event, fn)`:** removes the listener matching `l === fn || l.fn === fn` from `event` (and returns `this`).
- **`emit(event, ...args)`:**
  - Returns `false` if there are no listeners registered for `event`.
  - Takes a **shallow snapshot** (`[...listeners]`) before invoking each listener with `(...args)`, so mutations during emission (`once` auto-removal or `off`/`on` calls inside a listener) never skip or prematurely fire listeners in the current cycle.
  - Returns `true` when at least one listener was invoked.
- **`listenerCount(event)`:** returns the current number of active listeners for `event`.
- **`waitFor(event)`:** returns a `Promise` that resolves with the first argument passed to the next `emit(event, firstArg, ...)`.

## Objective

Implement `class EventEmitter` with `on`, `once`, `off`, `emit`, `listenerCount`, and `waitFor`.

## Hints

1. Store listeners per event in a `Map<string, Array<Function>>`.
2. In `once(event, fn)`, define `const wrapper = (...args) => { this.off(event, wrapper); fn(...args); }; wrapper.fn = fn; return this.on(event, wrapper);`.

## Starter: guided

```javascript
class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  on(event, fn) {
    // Register fn and return an unsubscribe callback
  }

  once(event, fn) {
    // Register a one-time wrapper with wrapper.fn = fn and return unsubscribe
  }

  off(event, fn) {
    // Remove matching listener (l === fn || l.fn === fn)
    return this;
  }

  emit(event, ...args) {
    // Snapshot current listeners, invoke each, and return true if any ran
    return false;
  }

  listenerCount(event) {
    return (this._events.get(event) ?? []).length;
  }

  waitFor(event) {
    // Return a Promise resolved by a once(event, ...) listener
  }
}
```

## Starter: standard

```javascript
class EventEmitter {
  on(event, fn) {}
  once(event, fn) {}
  off(event, fn) {}
  emit(event, ...args) {}
  listenerCount(event) {}
  waitFor(event) {}
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
await expect("handles on, once, snapshot-safe emission, and Promise waitFor", async () => {
  const EventEmitter = get("EventEmitter");
  const bus = new EventEmitter();
  const order = [];

  bus.once("pulse", (v) => order.push(`once:${v}`));
  const unsub = bus.on("pulse", (v) => order.push(`on:${v}`));

  const firstEmit = bus.emit("pulse", 1);
  const secondEmit = bus.emit("pulse", 2);
  unsub();
  const thirdEmit = bus.emit("pulse", 3);

  const p = bus.waitFor("ready");
  bus.emit("ready", { status: "green" }, "ignored");
  const awaited = await p;

  return {
    order,
    emits: [firstEmit, secondEmit, thirdEmit],
    countAfter: bus.listenerCount("pulse"),
    awaited,
  };
}, {
  order: ["once:1", "on:1", "on:2"],
  emits: [true, true, false],
  countAfter: 0,
  awaited: { status: "green" },
});
```

## Hidden checks

```javascript
expect("off(event, originalFn) removes an unfired once listener before emit", () => {
  const EventEmitter = get("EventEmitter");
  const bus = new EventEmitter();
  let called = 0;
  const fn = () => { called++; };
  bus.once("ping", fn);
  bus.off("ping", fn);
  const emitted = bus.emit("ping");
  return { called, emitted, count: bus.listenerCount("ping") };
}, { called: 0, emitted: false, count: 0 });
```

## Solution

```javascript
class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  on(event, fn) {
    const list = this._events.get(event) ?? [];
    list.push(fn);
    this._events.set(event, list);
    return () => {
      this.off(event, fn);
    };
  }

  once(event, fn) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      fn(...args);
    };
    wrapper.fn = fn;
    return this.on(event, wrapper);
  }

  off(event, fn) {
    const list = this._events.get(event);
    if (!list) return this;
    const idx = list.findIndex((l) => l === fn || l.fn === fn);
    if (idx !== -1) list.splice(idx, 1);
    if (list.length === 0) this._events.delete(event);
    return this;
  }

  emit(event, ...args) {
    const list = this._events.get(event);
    if (!list || list.length === 0) return false;
    for (const fn of [...list]) {
      fn(...args);
    }
    return true;
  }

  listenerCount(event) {
    return (this._events.get(event) ?? []).length;
  }

  waitFor(event) {
    return new Promise((resolve) => {
      this.once(event, (firstArg) => resolve(firstArg));
    });
  }
}
```

## Restored

The event bench bus now dispatches listeners over immutable snapshots, cleans up `once` wrappers reliably, and bridges events into Promises via `waitFor`.
