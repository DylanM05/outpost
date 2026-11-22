---
id: debounce-throttle
language: javascript
title: Build leading-edge throttle and single-run once wrappers
system: Stream rail
symbol: controller
scene: tests
skills: js-closures-classes
---

## Briefing

Frontend events (scroll, resize, telemetry bursts) fire dozens of times per second. Higher-order closure wrappers like **`once(fn)`** (run initialization strictly once, caching its result) and **`throttle(fn, intervalMs, getNow)`** (admit at most one invocation per time window) keep applications snappy and predictable.

## Concept

1. **`once(fn)`:**
   - Returns a wrapper that invokes `fn(...args)` **at most once**, caches its return value (even if `undefined` or `0`), and returns that cached result on all later calls!
2. **`throttle(fn, intervalMs, getNow = () => Date.now())`:**
   - Validate `intervalMs >= 0` (else throw `new RangeError("intervalMs must be >= 0")`).
   - Leading-edge throttle:
     - First call ALWAYS executes `fn(...args)`, records `lastRun = getNow()`, and returns `{ ran: true, value }`.
     - Subsequent calls execute iff `getNow() - lastRun >= intervalMs`:
       - If allowed: updates `lastRun = now`, calls `fn(...args)`, returns `{ ran: true, value }`.
       - If suppressed: does NOT call `fn`, returns `{ ran: false, value: lastValue }`!

## Objective

Implement `once(fn)` and `throttle(fn, intervalMs, getNow = () => Date.now())`.

## Hints

1. Track a separate boolean `let hasRun = false;` inside BOTH `once` and `throttle` so a first call returning `undefined` or starting at timestamp `0` (`now === 0`) is handled cleanly!

## Starter: guided

```javascript
function once(fn) {
  let hasRun = false;
  let cached;
  return (...args) => {
    // Call fn once, cache its return value, return cached on repeat calls.
  };
}

function throttle(fn, intervalMs, getNow = () => Date.now()) {
  if (intervalMs < 0) throw new RangeError("intervalMs must be >= 0");
  let hasRun = false;
  let lastRun = 0;
  let lastValue;
  return (...args) => {
    // Allow first call or calls with getNow() - lastRun >= intervalMs.
  };
}
```

## Starter: standard

```javascript
function once(fn) {
}

function throttle(fn, intervalMs, getNow = () => Date.now()) {
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("once runs underlying function strictly once and caches result", () => {
  let calls = 0;
  const init = get("once")((x) => {
    calls++;
    return x * 2;
  });
  return { results: [init(5), init(99), init(100)], calls };
}, { results: [10, 10, 10], calls: 1 });

expect("throttle admits leading call, suppresses burst, and reopens after intervalMs", () => {
  let now = 0;
  let calls = 0;
  const send = get("throttle")((msg) => {
    calls++;
    return `${msg}#${calls}`;
  }, 100, () => now);
  const r1 = send("a"); // t=0 -> runs
  now = 50;
  const r2 = send("b"); // t=50 -> suppressed
  now = 100;
  const r3 = send("c"); // t=100 -> runs
  return { r1, r2, r3, calls };
}, {
  r1: { ran: true, value: "a#1" },
  r2: { ran: false, value: "a#1" },
  r3: { ran: true, value: "c#2" },
  calls: 2,
});
```

## Hidden checks

```javascript
expect("once caches falsy 0 without re-invoking", () => {
  let n = 0;
  const f = get("once")(() => { n++; return 0; });
  return [f(), f(), n];
}, [0, 0, 1]);
expectThrows("throttle rejects negative intervalMs", () => get("throttle")(() => 1, -1), "RangeError");
```

## Solution

```javascript
function once(fn) {
  let hasRun = false;
  let cached;
  return (...args) => {
    if (!hasRun) {
      cached = fn(...args);
      hasRun = true;
    }
    return cached;
  };
}

function throttle(fn, intervalMs, getNow = () => Date.now()) {
  if (intervalMs < 0) throw new RangeError("intervalMs must be >= 0");
  let hasRun = false;
  let lastRun = 0;
  let lastValue;
  return (...args) => {
    const now = getNow();
    if (!hasRun || now - lastRun >= intervalMs) {
      hasRun = true;
      lastRun = now;
      lastValue = fn(...args);
      return { ran: true, value: lastValue };
    }
    return { ran: false, value: lastValue };
  };
}
```

## Restored

The stream rail now tames high-frequency event bursts with deterministic closure throttlers and single-init guards.
