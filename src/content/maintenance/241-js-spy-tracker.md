---
id: maintenance-js-spy-tracker
language: javascript
title: Implement a lightweight function spy with call history and reset
system: Test harness
symbol: instrument
scene: tests
skills: js-testing-tooling
reviewSkill: js-testing-tooling
prerequisite: dependency-graph-bundler
---

## Briefing

Diagnostic tests need a lightweight `trackCalls(fn)` spy wrapper that records every invocation's arguments in `.calls`, forwards the return value of `fn`, and resets `.calls` when `.reset()` is called.

## Objective

Implement `trackCalls(fn = () => undefined)` returning a callable spy function with `.calls` (an array of argument arrays) and `.reset()` (which clears `.calls` back to `[]`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Inside `function spy(...args)`, push `args` into `spy.calls` and return `fn.apply(this, args)`.

## Starter

```javascript
function trackCalls(fn = () => undefined) {
  // Return a callable spy function with spy.calls = [] and spy.reset()
}
```

## Checks

```javascript
expect("records argument arrays for each call and clears on reset()", () => {
  const trackCalls = get("trackCalls");
  const spy = trackCalls((a, b) => a * b);
  const r1 = spy(3, 4);
  const r2 = spy(5, 6);
  const beforeReset = [...spy.calls];
  spy.reset();
  return { r1, r2, beforeReset, afterReset: spy.calls };
}, {
  r1: 12,
  r2: 30,
  beforeReset: [[3, 4], [5, 6]],
  afterReset: [],
});
```

## Hidden checks

```javascript
expect("defaults to returning undefined when no implementation is passed", () => {
  const spy = get("trackCalls")();
  const out = spy("ping");
  return { out, calls: spy.calls };
}, { out: undefined, calls: [["ping"]] });
```

## Solution

```javascript
function trackCalls(fn = () => undefined) {
  function spy(...args) {
    spy.calls.push(args);
    return fn.apply(this, args);
  }
  spy.calls = [];
  spy.reset = () => {
    spy.calls = [];
    return spy;
  };
  return spy;
}
```

## Restored

The test harness spy wrapper is recording call arguments and resetting cleanly between assertions.
