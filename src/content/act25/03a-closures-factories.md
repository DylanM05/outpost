---
id: closures-factories
language: javascript
title: Encapsulate private state with JavaScript closures and memoizers
system: Closure deck
symbol: instrument
scene: tests
skills: js-closures-classes
---

## Briefing

Because JavaScript functions capture their enclosing lexical scope, **closures** give you true private state (unreachable from outside the returned object!) and power higher-order wrappers like `once` and `memoize`.

## Concept

Implement two closure factories:
1. `createCounter(start = 0, step = 1)`:
   - Keeps `count` private inside the closure.
   - Returns `{ next(), reset(), value() }`:
     - `next()`: increments `count` by `step` and returns the new `count`.
     - `reset()`: resets `count` back to `start` and returns `count`.
     - `value()`: returns current `count`.
2. `memoize(fn)`:
   - Wraps a unary or multi-argument function `fn` using a `Map` keyed by `JSON.stringify(args)`.
   - On a cache hit, returns the cached value WITHOUT calling `fn` again (even if the cached value is `undefined`, `false`, or `0` — check `cache.has(key)`!).
   - Attach a `.size()` method on the returned wrapper function returning `cache.size`.

## Objective

Implement `createCounter(start = 0, step = 1)` and `memoize(fn)`.

## Hints

1. Always check `cache.has(key)` instead of `if (cache.get(key))` so cached falsy values like `0` or `false` still hit the cache!
2. In JavaScript, functions are objects — you can attach `wrapped.size = () => cache.size;` right before returning `wrapped`!

## Starter: guided

```javascript
function createCounter(start = 0, step = 1) {
  let count = start;
  return {
    next() {
      // Increment count by step and return it.
    },
    reset() {
      // Reset count to start and return it.
    },
    value() {
      return count;
    },
  };
}

function memoize(fn) {
  const cache = new Map();
  function wrapped(...args) {
    // Key by JSON.stringify(args), check cache.has(key), compute & store on miss.
  }
  wrapped.size = () => cache.size;
  return wrapped;
}
```

## Starter: standard

```javascript
function createCounter(start = 0, step = 1) {
}

function memoize(fn) {
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("counter isolates state per instance and supports reset", () => {
  const c1 = get("createCounter")(10, 5);
  const c2 = get("createCounter")(0, 1);
  return [c1.next(), c1.next(), c2.next(), c1.reset(), c1.value()];
}, [15, 20, 1, 10, 10]);

expect("memoize caches results including falsy 0 and exposes size()", () => {
  let calls = 0;
  const mul = get("memoize")((a, b) => {
    calls++;
    return a * b;
  });
  const results = [mul(0, 5), mul(0, 5), mul(3, 4), mul(3, 4)];
  return { results, calls, cached: mul.size() };
}, { results: [0, 0, 12, 12], calls: 2, cached: 2 });
```

## Hidden checks

```javascript
expect("counter hides internal state from direct property access", () => {
  const c = get("createCounter")(1, 2);
  return c.count === undefined;
}, true);
```

## Solution

```javascript
function createCounter(start = 0, step = 1) {
  let count = start;
  return {
    next() {
      count += step;
      return count;
    },
    reset() {
      count = start;
      return count;
    },
    value() {
      return count;
    },
  };
}

function memoize(fn) {
  const cache = new Map();
  function wrapped(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const val = fn(...args);
    cache.set(key, val);
    return val;
  }
  wrapped.size = () => cache.size;
  return wrapped;
}
```

## Restored

The closure deck now encapsulates private state and caches repeated computations via `Map`-backed closures.
