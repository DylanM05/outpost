---
id: maintenance-js-fix-store-notify
language: javascript
title: Fix a state setter that mutates state in place and notifies on no-ops
system: Store bay
symbol: equipment
scene: tests
skills: js-reactive-ui
reviewSkill: js-reactive-ui
prerequisite: lru-fetch-cache
---

## Briefing

A mini state store is mutating `state` directly with `Object.assign(state, patch)` (breaking snapshot comparisons!) AND calling listeners even when every patched value was identical!

## Objective

Fix `createMiniStore(initial)` so `set(patch)` skips notification if no own key in `patch` changed (`Object.is`), and otherwise replaces `state` with a fresh `{ ...state, ...patch }` object before notifying listeners.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `Object.keys(patch).some((k) => !Object.is(state[k], patch[k]))` before creating `state = { ...state, ...patch }` and firing listeners!

## Starter

```javascript
function createMiniStore(initial) {
  let state = { ...initial };
  const listeners = new Set();
  return {
    get: () => state,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    set: (patch) => {
      Object.assign(state, patch);
      for (const fn of listeners) fn(state);
    },
  };
}
```

## Checks

```javascript
expect("creates immutable next snapshot and skips no-op notifications", () => {
  const s = get("createMiniStore")({ n: 1 });
  let calls = 0;
  s.subscribe(() => calls++);
  const snap1 = s.get();
  s.set({ n: 1 }); // no-op!
  s.set({ n: 2 }); // real change!
  return { calls, snap1N: snap1.n, snap2N: s.get().n, diffRef: snap1 !== s.get() };
}, { calls: 1, snap1N: 1, snap2N: 2, diffRef: true });
```

## Hidden checks

```javascript
expect("unsubscribe stops future calls", () => {
  const s = get("createMiniStore")({ x: 0 });
  let c = 0;
  const off = s.subscribe(() => c++);
  s.set({ x: 1 });
  off();
  s.set({ x: 2 });
  return c;
}, 1);
```

## Solution

```javascript
function createMiniStore(initial) {
  let state = { ...initial };
  const listeners = new Set();
  return {
    get: () => state,
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    set: (patch) => {
      if (!patch || typeof patch !== "object") return;
      const changed = Object.keys(patch).some((k) => !Object.is(state[k], patch[k]));
      if (!changed) return;
      state = { ...state, ...patch };
      for (const fn of [...listeners]) fn(state);
    },
  };
}
```

## Restored

Store updates now preserve immutable snapshots and silence redundant no-op notifications.
