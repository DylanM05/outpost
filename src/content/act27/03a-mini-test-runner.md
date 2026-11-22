---
id: js-mini-test-runner
kind: code
language: javascript
title: Implement a hierarchical async test runner with hooks and assertions
system: Test harness
symbol: instrument
scene: tests
skills: js-testing-tooling
---

## Briefing

Before running diagnostics across the runtime deck, you need a clean, zero-dependency test runner (in the spirit of Vitest or Jest) that supports nested `describe` suites, inherited `beforeEach`/`afterEach` lifecycle hooks, async `it` tests, and an `expect` assertion API.

## Concept

Implement `createTestRunner()` returning `{ describe, it, beforeEach, afterEach, expect, run }`:
- **`describe(name, fn)`:** pushes a nested suite scope onto the suite stack, runs `fn()` synchronously to collect child `describe`, `it`, `beforeEach`, and `afterEach` definitions, and pops the suite scope.
- **`it(name, fn)`:** registers a test whose full `name` joins enclosing suite names and the test name with `" > "` (e.g. `"Math > add > sums numbers"`).
- **`beforeEach(fn)` / `afterEach(fn)`:** registers lifecycle hooks on the current suite scope. When a test runs:
  - All ancestor-to-current `beforeEach` hooks run in **outer-to-inner** order before the test function.
  - All `afterEach` hooks in the suite chain run after the test function — **even if the test function threw or rejected**.
- **`expect(actual)`:** returns an assertion object with:
  - `.toBe(expected)`: passes if `Object.is(actual, expected)`, otherwise throws `Error`.
  - `.not.toBe(expected)`: passes if `!Object.is(actual, expected)`, otherwise throws `Error`.
  - `.toEqual(expected)`: passes if `actual` and `expected` are deeply structurally equal (primitives via `Object.is`, arrays element-by-element, plain objects key-by-key), otherwise throws `Error`.
  - `.toThrow(substr?)`: calls `actual()` and passes if it synchronously throws (and if `substr` is given, `err.message.includes(substr)`), otherwise throws `Error`.
- **`async run()`:** executes all registered tests sequentially in registration order (`await`ing hooks and async test functions) and returns:
  - `{ passed, failed, results: [{ name, passed, error }] }` where `error` is `null` on pass or `err.message` (string) on failure.

## Objective

Implement `createTestRunner()` returning `{ describe, it, beforeEach, afterEach, expect, run }`.

## Hints

1. Represent each suite node as `{ name, beforeEach: [], afterEach: [], parent }`. When `it(name, fn)` is called, snapshot the chain of ancestor suites from root to current suite so `run()` already knows the full path name and the exact `beforeEach`/`afterEach` hooks to execute!
2. Use a `try { ... } finally { ... }` block around the test execution so `afterEach` hooks still run when a test fails an assertion.

## Starter: guided

```javascript
function createTestRunner() {
  const root = { name: null, beforeEach: [], afterEach: [], parent: null };
  let current = root;
  const tests = [];

  function describe(name, fn) {
    const suite = { name, beforeEach: [], afterEach: [], parent: current };
    const prev = current;
    current = suite;
    try {
      fn();
    } finally {
      current = prev;
    }
  }

  function beforeEach(fn) {
    current.beforeEach.push(fn);
  }

  function afterEach(fn) {
    current.afterEach.push(fn);
  }

  function it(name, fn) {
    // Capture ancestor suite chain and push to tests
  }

  function expect(actual) {
    // Return { toBe, toEqual, toThrow, not: { toBe } }
  }

  async function run() {
    // Execute tests sequentially with beforeEach/afterEach hooks and return summary
  }

  return { describe, it, beforeEach, afterEach, expect, run };
}
```

## Starter: standard

```javascript
function createTestRunner() {
  // Return { describe, it, beforeEach, afterEach, expect, run }
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
await expect("runs nested suites, inherited hooks, async tests, and expect matchers", async () => {
  const createTestRunner = get("createTestRunner");
  const t = createTestRunner();
  const log = [];

  t.beforeEach(() => log.push("root:before"));
  t.afterEach(() => log.push("root:after"));

  t.describe("Array", () => {
    let items = [];
    t.beforeEach(async () => {
      await Promise.resolve();
      items = [1, 2];
      log.push("sub:before");
    });

    t.it("pushes items and matches toEqual", async () => {
      items.push(3);
      t.expect(items).toEqual([1, 2, 3]);
      t.expect(items.length).toBe(3);
      t.expect(items.length).not.toBe(2);
    });

    t.it("captures failing assertions", () => {
      t.expect(items[0]).toBe(99);
    });
  });

  t.it("checks toThrow", () => {
    t.expect(() => {
      throw new Error("boom");
    }).toThrow();
  });

  const report = await t.run();
  return {
    passed: report.passed,
    failed: report.failed,
    names: report.results.map((r) => r.name),
    passes: report.results.map((r) => r.passed),
    secondHasError: typeof report.results[1].error === "string" && report.results[1].error.length > 0,
    firstError: report.results[0].error,
    log,
  };
}, {
  passed: 2,
  failed: 1,
  names: [
    "Array > pushes items and matches toEqual",
    "Array > captures failing assertions",
    "checks toThrow",
  ],
  passes: [true, false, true],
  secondHasError: true,
  firstError: null,
  log: [
    "root:before", "sub:before", "root:after",
    "root:before", "sub:before", "root:after",
    "root:before", "root:after",
  ],
});
```

## Hidden checks

```javascript
await expect("toThrow fails when callback does not throw, and toEqual rejects mismatched objects", async () => {
  const t = get("createTestRunner")();
  t.it("no throw", () => {
    t.expect(() => 42).toThrow();
  });
  t.it("bad object", () => {
    t.expect({ a: 1, b: [2] }).toEqual({ a: 1, b: [3] });
  });
  const res = await t.run();
  return { passed: res.passed, failed: res.failed };
}, { passed: 0, failed: 2 });
```

## Solution

```javascript
function _isDeepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!_isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k) || !_isDeepEqual(a[k], b[k])) return false;
  }
  return true;
}

function createTestRunner() {
  const root = { name: null, beforeEach: [], afterEach: [], parent: null };
  let current = root;
  const tests = [];

  function describe(name, fn) {
    const suite = { name, beforeEach: [], afterEach: [], parent: current };
    const prev = current;
    current = suite;
    try {
      fn();
    } finally {
      current = prev;
    }
  }

  function beforeEach(fn) {
    current.beforeEach.push(fn);
  }

  function afterEach(fn) {
    current.afterEach.push(fn);
  }

  function it(name, fn) {
    const chain = [];
    for (let s = current; s !== null; s = s.parent) {
      chain.unshift(s);
    }
    const prefix = chain.filter((s) => s.name !== null).map((s) => s.name);
    const fullName = [...prefix, name].join(" > ");
    tests.push({ name: fullName, fn, chain });
  }

  function expect(actual) {
    return {
      toBe(expected) {
        if (!Object.is(actual, expected)) {
          throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
        }
      },
      toEqual(expected) {
        if (!_isDeepEqual(actual, expected)) {
          throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
        }
      },
      toThrow(expectedSubstr) {
        if (typeof actual !== "function") {
          throw new Error("expect(fn).toThrow() requires a function");
        }
        let threw = false;
        let caught = null;
        try {
          actual();
        } catch (err) {
          threw = true;
          caught = err;
        }
        if (!threw) {
          throw new Error("Expected function to throw, but it did not");
        }
        if (expectedSubstr !== undefined) {
          const msg = caught?.message ?? String(caught);
          if (!msg.includes(expectedSubstr)) {
            throw new Error(`Expected error "${msg}" to include "${expectedSubstr}"`);
          }
        }
      },
      not: {
        toBe(expected) {
          if (Object.is(actual, expected)) {
            throw new Error(`Expected ${JSON.stringify(actual)} not to be ${JSON.stringify(expected)}`);
          }
        },
      },
    };
  }

  async function run() {
    let passed = 0;
    let failed = 0;
    const results = [];

    for (const test of tests) {
      const befores = test.chain.flatMap((s) => s.beforeEach);
      const afters = [...test.chain].reverse().flatMap((s) => s.afterEach);
      let errOut = null;
      try {
        for (const hook of befores) {
          await hook();
        }
        await test.fn();
      } catch (err) {
        errOut = err?.message ?? String(err);
      } finally {
        for (const hook of afters) {
          try {
            await hook();
          } catch (afterErr) {
            if (errOut === null) errOut = afterErr?.message ?? String(afterErr);
          }
        }
      }

      if (errOut === null) {
        passed++;
        results.push({ name: test.name, passed: true, error: null });
      } else {
        failed++;
        results.push({ name: test.name, passed: false, error: errOut });
      }
    }

    return { passed, failed, results };
  }

  return { describe, it, beforeEach, afterEach, expect, run };
}
```

## Restored

The test harness runner now executes nested suites, async lifecycle hooks, and assertion matchers with clean failure capture.
