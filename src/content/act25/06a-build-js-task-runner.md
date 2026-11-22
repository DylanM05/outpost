---
id: build-js-task-runner
language: javascript
title: Build an end-to-end async JavaScript job runner with retries and caching
system: Annex audit
symbol: controller
scene: tests
assessment: true
skills: js-fundamentals, js-closures-classes, js-async
---

## Briefing

Tie your entire JavaScript toolkit together in `class AsyncJobRunner`: ES6 private fields, immutable default-config merging, concurrency-limited async worker pools, per-job retry loops, deduplicated result caching, and structured summary reports!

## Concept

Implement `class AsyncJobRunner`:
- `constructor(options = {})`:
  - Merges defaults `{ concurrency: 2, maxAttempts: 1 }` with `options` (validate `concurrency >= 1` and `maxAttempts >= 1`, else throw `new RangeError(...)`).
  - Uses private `#cache = new Map()` and `#stats = { runs: 0, cacheHits: 0, failures: 0 }`.
- **`async runAll(jobs)`:**
  - `jobs` is an array of `{ id, cacheKey?, task }` where `task(attempt)` is an async (or sync) function returning a result.
  - Executes jobs with at most `concurrency` active at once, preserving **exact input order** in the returned array!
  - For each job:
    - If `job.cacheKey != null` and `#cache.has(job.cacheKey)`: increment `#stats.cacheHits`, return `{ id: job.id, status: "fulfilled", value: #cache.get(job.cacheKey), cached: true, attempts: 0 }`!
    - Otherwise retry `await job.task(attempt)` up to `maxAttempts` times (incrementing `#stats.runs` once per actual invocation of `job.task`!):
      - On success: if `job.cacheKey != null`, store `value` in `#cache`; return `{ id: job.id, status: "fulfilled", value, cached: false, attempts }`.
      - If all `maxAttempts` fail: increment `#stats.failures`, return `{ id: job.id, status: "rejected", error: lastErr instanceof Error ? lastErr.message : String(lastErr), cached: false, attempts: maxAttempts }`.
- **`stats()`:** returns a fresh copy `{ ...this.#stats }` (so callers can't mutate internal stats!).
- **`clearCache()`:** clears `#cache`.

## Objective

Implement `class AsyncJobRunner` with `runAll(jobs)`, `stats()`, and `clearCache()`.

## Hints

1. Use the shared-index `worker()` loop pattern from `mapWithLimit` so active promises never exceed `concurrency`, while each worker writes directly into `results[idx]` to preserve order!
2. Wrap each `job.task(attempt)` call in `try { const value = await job.task(attempt); ... } catch (err) { ... }` so both sync throws and rejected Promises are caught cleanly.

## Starter: guided

```javascript
class AsyncJobRunner {
  #concurrency;
  #maxAttempts;
  #cache = new Map();
  #stats = { runs: 0, cacheHits: 0, failures: 0 };

  constructor(options = {}) {
    const concurrency = options?.concurrency ?? 2;
    const maxAttempts = options?.maxAttempts ?? 1;
    if (concurrency < 1 || maxAttempts < 1) {
      throw new RangeError("concurrency and maxAttempts must be >= 1");
    }
    this.#concurrency = concurrency;
    this.#maxAttempts = maxAttempts;
  }

  async runAll(jobs) {
    // Run jobs with bounded concurrency, per-job retries, and optional cacheKey lookup.
    return [];
  }

  stats() {
    return { ...this.#stats };
  }

  clearCache() {
    this.#cache.clear();
  }
}
```

## Starter: standard

```javascript
class AsyncJobRunner {
  constructor(options = {}) {
  }

  async runAll(jobs) {
  }

  stats() {
  }

  clearCache() {
  }
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
await expect("bounds concurrency, retries flaky jobs, caches keys, and isolates failures", async () => {
  const Runner = get("AsyncJobRunner");
  const runner = new Runner({ concurrency: 2, maxAttempts: 3 });
  let active = 0;
  let peak = 0;
  const wrap = (fn) => async (attempt) => {
    active++;
    peak = Math.max(peak, active);
    await Promise.resolve();
    try {
      return await fn(attempt);
    } finally {
      active--;
    }
  };

  const batch1 = await runner.runAll([
    { id: "j1", cacheKey: "k1", task: wrap(async () => "alpha") },
    { id: "j2", task: wrap(async (a) => { if (a < 2) throw new Error("flaky"); return "beta"; }) },
    { id: "j3", task: wrap(async () => { throw new Error("dead"); }) },
  ]);
  const batch2 = await runner.runAll([
    { id: "j4", cacheKey: "k1", task: wrap(async () => "should-not-run") },
  ]);
  return { batch1, batch2, peak, stats: runner.stats() };
}, {
  batch1: [
    { id: "j1", status: "fulfilled", value: "alpha", cached: false, attempts: 1 },
    { id: "j2", status: "fulfilled", value: "beta", cached: false, attempts: 2 },
    { id: "j3", status: "rejected", error: "dead", cached: false, attempts: 3 },
  ],
  batch2: [
    { id: "j4", status: "fulfilled", value: "alpha", cached: true, attempts: 0 },
  ],
  peak: 2,
  stats: { runs: 6, cacheHits: 1, failures: 1 },
});
```

## Hidden checks

```javascript
await expect("clearCache forces fresh execution and stats() returns a defensive copy", async () => {
  const runner = new (get("AsyncJobRunner"))({ concurrency: 1, maxAttempts: 1 });
  let count = 0;
  const job = { id: "a", cacheKey: "x", task: async () => ++count };
  await runner.runAll([job]);
  runner.clearCache();
  const [res] = await runner.runAll([job]);
  const s = runner.stats();
  s.runs = 999;
  return { val: res.value, cached: res.cached, realRuns: runner.stats().runs };
}, { val: 2, cached: false, realRuns: 2 });

expectThrows("rejects invalid concurrency", () => new (get("AsyncJobRunner"))({ concurrency: 0 }), "RangeError");
```

## Solution

```javascript
class AsyncJobRunner {
  #concurrency;
  #maxAttempts;
  #cache = new Map();
  #stats = { runs: 0, cacheHits: 0, failures: 0 };

  constructor(options = {}) {
    const concurrency = options?.concurrency ?? 2;
    const maxAttempts = options?.maxAttempts ?? 1;
    if (concurrency < 1 || maxAttempts < 1) {
      throw new RangeError("concurrency and maxAttempts must be >= 1");
    }
    this.#concurrency = concurrency;
    this.#maxAttempts = maxAttempts;
  }

  async #runOne(job) {
    if (job.cacheKey !== null && job.cacheKey !== undefined && this.#cache.has(job.cacheKey)) {
      this.#stats.cacheHits += 1;
      return {
        id: job.id,
        status: "fulfilled",
        value: this.#cache.get(job.cacheKey),
        cached: true,
        attempts: 0,
      };
    }

    let lastErr;
    for (let attempt = 1; attempt <= this.#maxAttempts; attempt++) {
      this.#stats.runs += 1;
      try {
        const value = await job.task(attempt);
        if (job.cacheKey !== null && job.cacheKey !== undefined) {
          this.#cache.set(job.cacheKey, value);
        }
        return {
          id: job.id,
          status: "fulfilled",
          value,
          cached: false,
          attempts: attempt,
        };
      } catch (err) {
        lastErr = err;
      }
    }

    this.#stats.failures += 1;
    return {
      id: job.id,
      status: "rejected",
      error: lastErr instanceof Error ? lastErr.message : String(lastErr),
      cached: false,
      attempts: this.#maxAttempts,
    };
  }

  async runAll(jobs) {
    const results = new Array(jobs.length);
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < jobs.length) {
        const idx = nextIndex++;
        results[idx] = await this.#runOne(jobs[idx]);
      }
    };

    const count = Math.min(this.#concurrency, jobs.length);
    await Promise.all(Array.from({ length: count }, () => worker()));
    return results;
  }

  stats() {
    return { ...this.#stats };
  }

  clearCache() {
    this.#cache.clear();
  }
}
```

## Restored

The script annex is online — your JavaScript async job runner handles bounded concurrency, retries, caching, and defensive state end to end.
