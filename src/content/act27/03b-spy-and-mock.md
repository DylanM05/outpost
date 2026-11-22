---
id: js-spy-and-mock
kind: code
language: javascript
title: Build function spies and object method mocks with call/result tracking
system: Test harness
symbol: instrument
scene: tests
skills: js-testing-tooling
---

## Briefing

Isolating a component in tests often requires verifying how a collaborator was called — or temporarily overriding a method on an existing object and restoring it when the test finishes.

## Concept

1. **`createSpy(defaultImpl = () => undefined)`:**
   - Returns a callable function `spy(...args)` with:
     - `spy.calls`: array of argument arrays (`[[arg1, arg2], ...]`) for each invocation.
     - `spy.results`: array of `{ type: "return", value }` or `{ type: "throw", value }` outcomes for each invocation.
     - `spy.mockReturnValue(val)`: overrides the spy to always return `val` (returns `spy`).
     - `spy.mockReturnValueOnce(val)`: queues `val` to be returned on the next call before falling back to the sticky return value or implementation (returns `spy`).
     - `spy.mockImplementation(fn)`: sets the active implementation to `fn` and clears any sticky `mockReturnValue` override (returns `spy`).
     - `spy.mockClear()`: empties `spy.calls` and `spy.results` without removing configured implementations or return values (returns `spy`).
2. **`spyOn(target, methodName)`:**
   - Throws a `TypeError` if `!target || typeof target[methodName] !== "function"`.
   - Saves `const original = target[methodName]`.
   - Replaces `target[methodName]` with a `createSpy` whose default implementation invokes `original.apply(this === undefined ? target : this, args)`.
   - Adds `spy.mockRestore()`, which restores `target[methodName] = original`.
   - Returns `spy`.

## Objective

Implement `createSpy(defaultImpl)` and `spyOn(target, methodName)`.

## Hints

1. Use a boolean flag `hasFixedReturn = false` alongside `fixedReturn = undefined` so `mockReturnValue(undefined)` is distinguished from having no fixed return value!
2. Use a FIFO array `onceQueue = []` for `mockReturnValueOnce(val)`. On each call, check `if (onceQueue.length > 0)` first, then `else if (hasFixedReturn)`, and finally `else impl.apply(this, args)`.

## Starter: guided

```javascript
function createSpy(defaultImpl = () => undefined) {
  let impl = defaultImpl;
  let hasFixedReturn = false;
  let fixedReturn = undefined;
  const onceQueue = [];

  function spy(...args) {
    spy.calls.push(args);
    // Determine return value from onceQueue, fixedReturn, or impl.apply(this, args)
    // Record { type: "return" | "throw", value } in spy.results
  }

  spy.calls = [];
  spy.results = [];
  spy.mockReturnValue = (val) => {
    hasFixedReturn = true;
    fixedReturn = val;
    return spy;
  };
  spy.mockReturnValueOnce = (val) => {
    onceQueue.push(val);
    return spy;
  };
  spy.mockImplementation = (fn) => {
    impl = fn;
    hasFixedReturn = false;
    return spy;
  };
  spy.mockClear = () => {
    spy.calls = [];
    spy.results = [];
    return spy;
  };

  return spy;
}

function spyOn(target, methodName) {
  // Validate target[methodName] is a function, wrap with createSpy, and attach mockRestore()
}
```

## Starter: standard

```javascript
function createSpy(defaultImpl = () => undefined) {}

function spyOn(target, methodName) {}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("createSpy tracks calls, return/throw results, one-shot returns, and mockClear", () => {
  const createSpy = get("createSpy");
  const spy = createSpy((a, b) => a + b);

  const r1 = spy(2, 3);
  spy.mockReturnValue(100).mockReturnValueOnce(10).mockReturnValueOnce(20);
  const r2 = spy("a");
  const r3 = spy("b");
  const r4 = spy("c");

  spy.mockImplementation((x) => {
    if (x < 0) throw new Error("neg");
    return x * 2;
  });
  const r5 = spy(4);
  expectThrows("propagates thrown error", () => spy(-1));

  const snapshot = {
    returns: [r1, r2, r3, r4, r5],
    calls: [...spy.calls],
    resultTypes: spy.results.map((r) => r.type),
    lastThrowMsg: spy.results.at(-1).value.message,
  };
  spy.mockClear();
  return { ...snapshot, clearedCalls: spy.calls.length, clearedResults: spy.results.length };
}, {
  returns: [5, 10, 20, 100, 8],
  calls: [[2, 3], ["a"], ["b"], ["c"], [4], [-1]],
  resultTypes: ["return", "return", "return", "return", "return", "throw"],
  lastThrowMsg: "neg",
  clearedCalls: 0,
  clearedResults: 0,
});

expect("spyOn delegates to original method by default and restores on mockRestore", () => {
  const spyOn = get("spyOn");
  const sensor = {
    factor: 3,
    read(v) {
      return v * this.factor;
    },
  };

  const spy = spyOn(sensor, "read");
  const live1 = sensor.read(4);
  spy.mockReturnValue(999);
  const mocked = sensor.read(4);
  spy.mockRestore();
  const restored = sensor.read(5);

  return {
    live1,
    mocked,
    restored,
    spyCalls: spy.calls,
  };
}, {
  live1: 12,
  mocked: 999,
  restored: 15,
  spyCalls: [[4], [4]],
});
```

## Hidden checks

```javascript
expect("spyOn throws TypeError when target property is not a function", () => {
  const spyOn = get("spyOn");
  expectThrows("non-function property", () => spyOn({ x: 1 }, "x"), "TypeError");
  return true;
}, true);
```

## Solution

```javascript
function createSpy(defaultImpl = () => undefined) {
  let impl = defaultImpl;
  let hasFixedReturn = false;
  let fixedReturn = undefined;
  const onceQueue = [];

  function spy(...args) {
    spy.calls.push(args);
    try {
      let value;
      if (onceQueue.length > 0) {
        value = onceQueue.shift();
      } else if (hasFixedReturn) {
        value = fixedReturn;
      } else {
        value = impl.apply(this, args);
      }
      spy.results.push({ type: "return", value });
      return value;
    } catch (err) {
      spy.results.push({ type: "throw", value: err });
      throw err;
    }
  }

  spy.calls = [];
  spy.results = [];

  spy.mockReturnValue = (val) => {
    hasFixedReturn = true;
    fixedReturn = val;
    return spy;
  };

  spy.mockReturnValueOnce = (val) => {
    onceQueue.push(val);
    return spy;
  };

  spy.mockImplementation = (fn) => {
    impl = fn;
    hasFixedReturn = false;
    return spy;
  };

  spy.mockClear = () => {
    spy.calls = [];
    spy.results = [];
    return spy;
  };

  return spy;
}

function spyOn(target, methodName) {
  if (!target || typeof target[methodName] !== "function") {
    throw new TypeError(`Cannot spyOn non-function property "${String(methodName)}"`);
  }
  const original = target[methodName];
  const spy = createSpy(function (...args) {
    return original.apply(this === undefined ? target : this, args);
  });
  spy.mockRestore = () => {
    target[methodName] = original;
  };
  target[methodName] = spy;
  return spy;
}
```

## Restored

Your test harness now provides full call/result spies, one-shot and sticky return overrides, and reversible method mocks.
