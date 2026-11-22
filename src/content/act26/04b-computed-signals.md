---
id: computed-signals
language: javascript
title: Implement fine-grained reactive signals with automatic dependency tracking
system: Store bay
symbol: equipment
scene: tests
skills: js-reactive-ui
---

## Briefing

Modern reactive frameworks (SolidJS, Preact Signals, Vue, Angular Signals) eliminate manual dependency arrays by tracking which signals are **read** while an `effect` or `computed` executes — automatically re-running only when those exact signals change!

## Concept

Implement three primitives sharing a module-level `activeSubscriber = null` stack:
1. **`signal(initialValue)`:** returns `[get, set]`:
   - `get()`: if `activeSubscriber` is set, adds `activeSubscriber` to this signal's subscriber set, then returns `value`.
   - `set(next)`: if `!Object.is(value, next)`, updates `value = next` and runs every current subscriber!
2. **`effect(fn)`:**
   - Creates a runner that sets `activeSubscriber = run`, executes `fn()` inside `try ... finally` restoring the previous `activeSubscriber`, and runs immediately once!
   - Returns a `dispose()` function that stops future re-runs.
3. **`computed(fn)`:**
   - Creates a read-only derived getter `() => value` backed by a signal + effect that recomputes automatically whenever any signal read inside `fn()` changes (and itself tracks downstream effects when read!).

## Objective

Implement `signal(initialValue)`, `effect(fn)`, and `computed(fn)`.

## Hints

1. Use a stack (or save `const prev = activeSubscriber;` before assigning `activeSubscriber = run;` and restore `activeSubscriber = prev;` in `finally`) so nested `computed` reads inside an `effect` track dependencies cleanly!
2. Have `effect(fn)` track a boolean `disposed = false` so calling `dispose()` prevents any future notifications from executing `fn`.

## Starter: guided

```javascript
let activeSubscriber = null;

function signal(initialValue) {
  let value = initialValue;
  const subs = new Set();

  function get() {
    if (activeSubscriber) subs.add(activeSubscriber);
    return value;
  }

  function set(next) {
    // Skip if Object.is(value, next), else update and invoke [...subs].
  }

  return [get, set];
}

function effect(fn) {
  // Wrap fn so activeSubscriber tracks reads, execute immediately, return dispose().
}

function computed(fn) {
  // Derive a read-only getter using signal + effect.
}
```

## Starter: standard

```javascript
function signal(initialValue) {}
function effect(fn) {}
function computed(fn) {}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("tracks signal reads automatically through computed into effect", () => {
  const [price, setPrice] = get("signal")(10);
  const [qty, setQty] = get("signal")(2);
  const total = get("computed")(() => price() * qty());
  const log = [];
  const stop = get("effect")(() => log.push(total()));

  setPrice(15);      // total -> 30
  setPrice(15);      // unchanged -> no rerun
  setQty(3);         // total -> 45
  stop();
  setQty(4);         // disposed -> no rerun
  return { log, latest: total() };
}, { log: [20, 30, 45], latest: 60 });
```

## Hidden checks

```javascript
expect("ignores unrelated signals not read inside the effect", () => {
  const [a, setA] = get("signal")(1);
  const [b, setB] = get("signal")(100);
  let runs = 0;
  get("effect")(() => { a(); runs++; });
  setB(200);
  setB(300);
  setA(2);
  return { runs, b: b() };
}, { runs: 2, b: 300 });
```

## Solution

```javascript
let activeSubscriber = null;

function signal(initialValue) {
  let value = initialValue;
  const subs = new Set();

  function get() {
    if (activeSubscriber) subs.add(activeSubscriber);
    return value;
  }

  function set(next) {
    if (Object.is(value, next)) return;
    value = next;
    for (const sub of [...subs]) sub();
  }

  return [get, set];
}

function effect(fn) {
  let disposed = false;
  const run = () => {
    if (disposed) return;
    const prev = activeSubscriber;
    activeSubscriber = run;
    try {
      fn();
    } finally {
      activeSubscriber = prev;
    }
  };
  run();
  return () => {
    disposed = true;
  };
}

function computed(fn) {
  const [get, set] = signal(undefined);
  effect(() => {
    set(fn());
  });
  return get;
}
```

## Restored

The store bay now runs fine-grained reactive signals with automatic dependency tracking.
