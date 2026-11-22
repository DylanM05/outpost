---
id: maintenance-js-once-listener
language: javascript
title: Implement a one-time event subscription helper that auto-unsubscribes on first emit
system: Event bench
symbol: equipment
scene: tests
skills: js-streams-buffers
reviewSkill: js-streams-buffers
prerequisite: async-stream-pipeline
---

## Briefing

An event bus exposes `on(event, fn)` and `off(event, fn)`, and callers need a ` subscribeOnce(bus, event, fn)` helper that fires `fn(...args)` on the next emission only and returns a manual cancel callback.

## Objective

Implement `subscribeOnce(bus, event, fn)` so that `fn` runs at most once when `event` is emitted, automatically unsubscribes itself before calling `fn`, and returns a function that cancels the listener if called before `event` fires.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Define `const wrapper = (...args) => { bus.off(event, wrapper); fn(...args); };`, register `bus.on(event, wrapper)`, and return `() => bus.off(event, wrapper)`.

## Starter

```javascript
function subscribeOnce(bus, event, fn) {
  // Register a one-time wrapper on bus and return an unsubscribe function
}
```

## Checks

```javascript
expect("fires listener only on the first emission", () => {
  const subscribeOnce = get("subscribeOnce");
  const handlers = new Map();
  const bus = {
    on(e, fn) { handlers.set(e, [...(handlers.get(e) ?? []), fn]); },
    off(e, fn) { handlers.set(e, (handlers.get(e) ?? []).filter((f) => f !== fn)); },
    emit(e, ...a) { for (const fn of [...(handlers.get(e) ?? [])]) fn(...a); },
  };

  const seen = [];
  subscribeOnce(bus, "tick", (v) => seen.push(v));
  bus.emit("tick", 10);
  bus.emit("tick", 20);
  return seen;
}, [10]);
```

## Hidden checks

```javascript
expect("returned cancel function prevents listener from firing", () => {
  const subscribeOnce = get("subscribeOnce");
  const handlers = new Map();
  const bus = {
    on(e, fn) { handlers.set(e, [...(handlers.get(e) ?? []), fn]); },
    off(e, fn) { handlers.set(e, (handlers.get(e) ?? []).filter((f) => f !== fn)); },
    emit(e, ...a) { for (const fn of [...(handlers.get(e) ?? [])]) fn(...a); },
  };

  let count = 0;
  const cancel = subscribeOnce(bus, "tick", () => count++);
  cancel();
  bus.emit("tick");
  return count;
}, 0);
```

## Solution

```javascript
function subscribeOnce(bus, event, fn) {
  const wrapper = (...args) => {
    bus.off(event, wrapper);
    fn(...args);
  };
  bus.on(event, wrapper);
  return () => {
    bus.off(event, wrapper);
  };
}
```

## Restored

One-time event subscriptions now detach automatically on first emission or manual cancellation.
