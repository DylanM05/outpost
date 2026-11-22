---
id: promise-all-concurrency
language: javascript
title: Bound async fan-out with a concurrency-limited Promise worker pool
system: Stream rail
symbol: controller
scene: tests
skills: js-async
---

## Briefing

Calling `Promise.all(urls.map(fetch))` on 1,000 URLs opens 1,000 simultaneous connections and trips every rate limiter! A **concurrency-limited `mapWithLimit(items, limit, workerFn)`** runs at most `limit` promises at once while returning results in the **exact original input order**.

## Concept

Implement `async function mapWithLimit(items, limit, workerFn)`:
- Validate `limit >= 1` (else throw `new RangeError("limit must be >= 1")`).
- If `items.length === 0`, return `[]`.
- Launch `Math.min(limit, items.length)` concurrent worker loops pulling the next index `i = nextIndex++`:
  - `results[i] = await workerFn(items[i], i)`.
- Wait for all workers with `Promise.all(workers)` and return `results`!
- Because `nextIndex++` executes synchronously before the `await`, no two workers ever pick the same index, and active concurrency NEVER exceeds `limit`!

## Objective

Implement `async function mapWithLimit(items, limit, workerFn)`.

## Hints

1. Keep `let nextIndex = 0;` shared across all worker loops and `const results = new Array(items.length);`.
2. Inside each worker loop: `while (nextIndex < items.length) { const idx = nextIndex++; results[idx] = await workerFn(items[idx], idx); }`.

## Starter: guided

```javascript
async function mapWithLimit(items, limit, workerFn) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("limit must be a positive integer");
  }
  const results = new Array(items.length);
  let nextIndex = 0;
  // Spawn Math.min(limit, items.length) async workers that pull nextIndex and fill results[idx].
  return results;
}
```

## Starter: standard

```javascript
async function mapWithLimit(items, limit, workerFn) {
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
await expect("preserves input order while never exceeding concurrency limit", async () => {
  let active = 0;
  let peak = 0;
  const out = await get("mapWithLimit")([4, 1, 3, 2, 5], 2, async (x) => {
    active++;
    peak = Math.max(peak, active);
    await Promise.resolve();
    await Promise.resolve();
    active--;
    return x * 10;
  });
  return { out, peak };
}, { out: [40, 10, 30, 20, 50], peak: 2 });
```

## Hidden checks

```javascript
await expect("handles empty items array", async () => await get("mapWithLimit")([], 3, async (x) => x), []);
await expectThrows("rejects limit < 1", async () => await get("mapWithLimit")([1], 0, async (x) => x), "RangeError");
```

## Solution

```javascript
async function mapWithLimit(items, limit, workerFn) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("limit must be a positive integer");
  }
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      results[idx] = await workerFn(items[idx], idx);
    }
  }

  const count = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: count }, () => worker()));
  return results;
}
```

## Restored

The stream rail now bounds concurrent Promise fan-out while preserving exact result order.
