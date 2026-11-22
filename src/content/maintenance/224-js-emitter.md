---
id: maintenance-js-emitter
language: javascript
title: Build a minimal pub/sub EventEmitter class in JavaScript
system: Closure deck
symbol: instrument
scene: tests
skills: js-closures-classes
reviewSkill: js-closures-classes
prerequisite: deep-clone-merge
---

## Briefing

Node.js streams, sockets, and UI stores all revolve around the `EventEmitter` pattern: `on(event, listener)`, `off(event, listener)`, and `emit(event, ...args)`.

## Objective

Implement `class MiniEmitter` with:
- `on(event, fn)`: subscribes `fn` to `event` and returns an `unsubscribe` function that removes `fn`!
- `off(event, fn)`: removes `fn` from `event`.
- `emit(event, ...args)`: invokes all subscribed listeners for `event` in registration order and returns the number of listeners called.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Store `Map<string, Set<Function>>` and iterate over `[...(listeners ?? [])]` during `emit` so a listener unsubscribing itself mid-emit doesn't skip neighbors!

## Starter

```javascript
```

## Checks

```javascript
expect("subscribes, emits in order, and unsubscribes via returned handle", () => {
  const em = new (get("MiniEmitter"))();
  const seen = [];
  const offA = em.on("ping", (v) => seen.push(`a:${v}`));
  em.on("ping", (v) => seen.push(`b:${v}`));
  const c1 = em.emit("ping", 1);
  offA();
  const c2 = em.emit("ping", 2);
  return { seen, c1, c2 };
}, { seen: ["a:1", "b:1", "b:2"], c1: 2, c2: 1 });
```

## Hidden checks

```javascript
expect("emitting unknown event returns 0", () => new (get("MiniEmitter"))().emit("none"), 0);
```

## Solution

```javascript
class MiniEmitter {
  #events = new Map();

  on(event, fn) {
    if (!this.#events.has(event)) this.#events.set(event, new Set());
    this.#events.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    const set = this.#events.get(event);
    if (!set) return;
    set.delete(fn);
    if (set.size === 0) this.#events.delete(event);
  }

  emit(event, ...args) {
    const set = this.#events.get(event);
    if (!set) return 0;
    const snapshot = [...set];
    for (const fn of snapshot) fn(...args);
    return snapshot.length;
  }
}
```

## Restored

Event listeners now subscribe, fire, and clean up cleanly via `MiniEmitter`.
