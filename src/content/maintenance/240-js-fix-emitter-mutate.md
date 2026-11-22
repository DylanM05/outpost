---
id: maintenance-js-fix-emitter-mutate
language: javascript
title: Fix an event emitter that skips the next listener when a listener unsubscribes during emit
system: Event bench
symbol: equipment
scene: tests
skills: js-streams-buffers
reviewSkill: js-streams-buffers
prerequisite: async-stream-pipeline
---

## Briefing

`createMiniBus()` iterates directly over its live `listeners` array during `emit()`. When the first listener unsubscribes itself (`off`), `splice` shifts the array in place and causes the loop to skip the second listener!

## Objective

Fix `createMiniBus()` so `emit(event, ...args)` iterates over a shallow snapshot (`[...list]`) of the listener array, ensuring every listener registered at the start of `emit` runs even if an earlier listener calls `off`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Change `for (const fn of list)` in `emit` to `for (const fn of [...list])`.

## Starter

```javascript
function createMiniBus() {
  const events = new Map();
  return {
    on(event, fn) {
      const list = events.get(event) ?? [];
      list.push(fn);
      events.set(event, list);
      return () => this.off(event, fn);
    },
    off(event, fn) {
      const list = events.get(event);
      if (!list) return;
      const i = list.indexOf(fn);
      if (i !== -1) list.splice(i, 1);
    },
    emit(event, ...args) {
      const list = events.get(event) ?? [];
      for (const fn of list) {
        fn(...args);
      }
    },
  };
}
```

## Checks

```javascript
expect("runs all listeners in order even when the first listener unsubscribes during emit", () => {
  const bus = get("createMiniBus")();
  const log = [];
  const off1 = bus.on("alert", (x) => {
    log.push(`first:${x}`);
    off1();
  });
  bus.on("alert", (x) => {
    log.push(`second:${x}`);
  });

  bus.emit("alert", 1);
  bus.emit("alert", 2);
  return log;
}, ["first:1", "second:1", "second:2"]);
```

## Hidden checks

```javascript
expect("handles emitting an event with no listeners", () => {
  const bus = get("createMiniBus")();
  bus.emit("empty", 123);
  return true;
}, true);
```

## Solution

```javascript
function createMiniBus() {
  const events = new Map();
  return {
    on(event, fn) {
      const list = events.get(event) ?? [];
      list.push(fn);
      events.set(event, list);
      return () => this.off(event, fn);
    },
    off(event, fn) {
      const list = events.get(event);
      if (!list) return;
      const i = list.indexOf(fn);
      if (i !== -1) list.splice(i, 1);
    },
    emit(event, ...args) {
      const list = events.get(event) ?? [];
      for (const fn of [...list]) {
        fn(...args);
      }
    },
  };
}
```

## Restored

The event bus now snapshots the listener list before emission so self-removing listeners never skip sibling callbacks.
