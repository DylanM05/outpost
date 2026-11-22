---
id: promises-async-await
language: javascript
title: Retry flaky async calls with async/await and settled summaries
system: Async bay
symbol: equipment
scene: tests
skills: js-async
---

## Briefing

Real JavaScript services live on Promises: wrapping flaky network calls in `async`/`await` retry loops and collecting partial failures cleanly with `Promise.allSettled` instead of letting one rejected call crash the whole batch.

## Concept

Implement two `async` functions:
1. `retryAsync(fn, maxAttempts = 3)`:
   - Validate `maxAttempts >= 1` (else throw `new RangeError("maxAttempts must be >= 1")`).
   - Calls `await fn(attempt)` for `attempt = 1, 2, ..., maxAttempts`.
   - Returns the first resolved value; if all `maxAttempts` reject/throw, re-throws the **last** error!
2. `fetchAllSettled(tasks)`:
   - `tasks` is an array of zero-arg async functions `() => Promise<value>`.
   - Runs all tasks concurrently with `Promise.allSettled(tasks.map((t) => Promise.resolve().then(t)))`.
   - Returns `{ ok: [...fulfilledValues], errors: [...rejectionMessages] }` (where each rejection message is `err instanceof Error ? err.message : String(err)`).

## Objective

Implement `async function retryAsync(fn, maxAttempts = 3)` and `async function fetchAllSettled(tasks)`.

## Hints

1. Wrapping `tasks.map((t) => Promise.resolve().then(t))` catches BOTH asynchronous rejections AND synchronous throws inside a task function!

## Starter: guided

```javascript
async function retryAsync(fn, maxAttempts = 3) {
  if (maxAttempts < 1) throw new RangeError("maxAttempts must be >= 1");
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Try awaiting fn(attempt); catch and save lastError.
  }
  throw lastError;
}

async function fetchAllSettled(tasks) {
  // Run with Promise.allSettled and partition into { ok, errors }.
}
```

## Starter: standard

```javascript
async function retryAsync(fn, maxAttempts = 3) {
}

async function fetchAllSettled(tasks) {
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
await expect("retries until success and passes 1-based attempt number", async () => {
  const seen = [];
  const val = await get("retryAsync")(async (attempt) => {
    seen.push(attempt);
    if (attempt < 3) throw new Error(`fail ${attempt}`);
    return "recovered";
  }, 4);
  return { val, seen };
}, { val: "recovered", seen: [1, 2, 3] });

await expect("partitions settled results into ok and errors", async () => {
  return await get("fetchAllSettled")([
    async () => "a",
    async () => { throw new Error("timeout"); },
    async () => "b",
  ]);
}, { ok: ["a", "b"], errors: ["timeout"] });
```

## Hidden checks

```javascript
await expectThrows("rethrows last error when retries exhausted", async () => {
  await get("retryAsync")(async (n) => { throw new Error(`err-${n}`); }, 2);
}, /err-2/);

await expectThrows("rejects maxAttempts < 1 with RangeError", async () => {
  await get("retryAsync")(async () => 1, 0);
}, "RangeError");
```

## Solution

```javascript
async function retryAsync(fn, maxAttempts = 3) {
  if (maxAttempts < 1) throw new RangeError("maxAttempts must be >= 1");
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

async function fetchAllSettled(tasks) {
  const settled = await Promise.allSettled(tasks.map((t) => Promise.resolve().then(t)));
  const ok = [];
  const errors = [];
  for (const item of settled) {
    if (item.status === "fulfilled") {
      ok.push(item.value);
    } else {
      errors.push(item.reason instanceof Error ? item.reason.message : String(item.reason));
    }
  }
  return { ok, errors };
}
```

## Restored

The async bay now retries transient failures cleanly and summarizes partial batch errors with `Promise.allSettled`.
