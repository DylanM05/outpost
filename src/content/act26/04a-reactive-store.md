---
id: reactive-store
language: javascript
title: Build an immutable Redux/Zustand-style reactive state store
system: Store bay
symbol: equipment
scene: tests
skills: js-reactive-ui
---

## Briefing

Modern JavaScript UIs keep state predictable with a tiny **reactive store**: `getState()`, `setState(partialOrUpdater)` creating immutable next snapshots, and `subscribe(listener)` notifying subscribers **only** when state actually changes (with an unsubscribe handle!).

## Concept

Implement `createStore(initialState)`:
- Holds internal `state = { ...initialState }` and a `Set` of listener callbacks.
- **`getState()`:** returns current `state`.
- **`setState(updater)`:**
  - If `typeof updater === "function"`, compute `patch = updater(state)`, else `patch = updater`.
  - If `patch == null`, do nothing.
  - Check whether any own key in `patch` has `!Object.is(state[k], patch[k])` — if **nothing changed**, do NOT replace `state` and do NOT notify listeners!
  - Otherwise set `state = { ...state, ...patch }` and call every subscribed `listener(state, prevState)`!
- **`subscribe(listener)`:** registers `listener` and returns an `unsubscribe()` function.
- **`select(selector, onChange)`:** subscribes to a derived slice `selector(state)` and ONLY invokes `onChange(nextSlice, prevSlice)` when `!Object.is(nextSlice, prevSlice)` — returning an `unsubscribe()` function!

## Objective

Implement `createStore(initialState)` with `getState`, `setState`, `subscribe`, and `select`.

## Hints

1. In `select(selector, onChange)`, initialize `let prevSlice = selector(state);` and subscribe a wrapper that computes `nextSlice = selector(nextState)` and only calls `onChange(nextSlice, prevSlice)` when `!Object.is(nextSlice, prevSlice)`!

## Starter: guided

```javascript
function createStore(initialState) {
  let state = { ...initialState };
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(updater) {
    // Support partial object or updater fn; skip notify if no key changed; create fresh { ...state, ...patch }.
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function select(selector, onChange) {
    // Only call onChange when selector(state) changes by Object.is.
  }

  return { getState, setState, subscribe, select };
}
```

## Starter: standard

```javascript
function createStore(initialState) {
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("updates immutably, skips no-op notifications, and filters selector callbacks", () => {
  const store = get("createStore")({ count: 0, theme: "dark" });
  const allEvents = [];
  const themeEvents = [];
  const unsubAll = store.subscribe((next, prev) => allEvents.push(`${prev.count}->${next.count}`));
  store.select((s) => s.theme, (next) => themeEvents.push(next));

  store.setState((s) => ({ count: s.count + 1 }));
  store.setState({ count: 1 });          // no-op -> must NOT notify!
  store.setState({ theme: "light" });    // theme changed -> notifies both!
  unsubAll();
  store.setState({ count: 2 });          // unsubscribed -> only state changes
  return { final: store.getState(), allEvents, themeEvents };
}, {
  final: { count: 2, theme: "light" },
  allEvents: ["0->1", "1->1"],
  themeEvents: ["light"],
});
```

## Hidden checks

```javascript
expect("does not mutate previous state snapshot", () => {
  const store = get("createStore")({ a: 1, b: 2 });
  const snap1 = store.getState();
  store.setState({ a: 99 });
  return { snap1, snap2: store.getState(), differentRef: snap1 !== store.getState() };
}, { snap1: { a: 1, b: 2 }, snap2: { a: 99, b: 2 }, differentRef: true });
```

## Solution

```javascript
function createStore(initialState) {
  let state = { ...initialState };
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(updater) {
    const patch = typeof updater === "function" ? updater(state) : updater;
    if (!patch || typeof patch !== "object") return;
    let changed = false;
    for (const k of Object.keys(patch)) {
      if (!Object.is(state[k], patch[k])) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    const prev = state;
    state = { ...state, ...patch };
    for (const fn of [...listeners]) fn(state, prev);
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function select(selector, onChange) {
    let prevSlice = selector(state);
    return subscribe((nextState) => {
      const nextSlice = selector(nextState);
      if (!Object.is(nextSlice, prevSlice)) {
        const old = prevSlice;
        prevSlice = nextSlice;
        onChange(nextSlice, old);
      }
    });
  }

  return { getState, setState, subscribe, select };
}
```

## Restored

The store bay now manages immutable application state with surgical selector subscriptions.
