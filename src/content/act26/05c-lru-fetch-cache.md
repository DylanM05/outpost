---
id: lru-fetch-cache
language: javascript
title: Build an async LRU + TTL response cache with in-flight deduplication
system: Render rail
symbol: controller
scene: tests
skills: js-validation-auth
---

## Briefing

Frontend data libraries like TanStack Query and SWR shine because JavaScript's built-in `Map` preserves insertion order — giving you an $O(1)$ **LRU cache** with **TTL expiry** AND **in-flight Promise deduplication** (so two widgets mounting simultaneously only fire one fetch)!

## Concept

Implement `class QueryCache`:
- `constructor({ maxEntries = 50, ttlMs = 5000, getNow = () => Date.now() } = {})` (validate `maxEntries >= 1` and `ttlMs >= 0`, else throw `new RangeError(...)`).
- **`async fetch(key, loader)`:**
  1. Check cache for `key`: if present and `getNow() - entry.ts < ttlMs`:
     - Refresh recency in `Map` (`delete` + `set`) and return `entry.value` without calling `loader`!
     - If expired, delete it.
  2. Check `#inFlight.get(key)`: if a Promise is already running for `key`, return that exact Promise!
  3. Otherwise launch `loader()`, store its Promise in `#inFlight`, and in `try / finally`:
     - Always remove `key` from `#inFlight` when settled (even if `loader()` rejects!).
     - On fulfillment, store `{ value, ts: getNow() }` into `#cache` (evicting the oldest `Map` key if `size > maxEntries`!) and return `value`.
- **`invalidate(key)`:** deletes `key` from `#cache` (or clears all if `key === undefined`).

## Objective

Implement `class QueryCache` with `async fetch(key, loader)` and `invalidate(key)`.

## Hints

1. In JavaScript, `map.keys().next().value` gives the **least-recently-used** key in $O(1)$ time as long as every hit does `map.delete(key); map.set(key, entry);`!

## Starter: guided

```javascript
class QueryCache {
  #maxEntries;
  #ttlMs;
  #getNow;
  #cache = new Map();
  #inFlight = new Map();

  constructor({ maxEntries = 50, ttlMs = 5000, getNow = () => Date.now() } = {}) {
    if (maxEntries < 1 || ttlMs < 0) throw new RangeError("invalid cache config");
    this.#maxEntries = maxEntries;
    this.#ttlMs = ttlMs;
    this.#getNow = getNow;
  }

  async fetch(key, loader) {
    // 1. Return fresh cached entry (refreshing LRU order).
    // 2. Deduplicate concurrent in-flight Promise for the same key.
    // 3. Store result with timestamp and evict LRU when exceeding #maxEntries.
  }

  invalidate(key) {
    if (key === undefined) this.#cache.clear();
    else this.#cache.delete(key);
  }
}
```

## Starter: standard

```javascript
class QueryCache {
  constructor(options = {}) {}
  async fetch(key, loader) {}
  invalidate(key) {}
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
await expect("deduplicates concurrent loads, respects TTL, and evicts LRU", async () => {
  let now = 100;
  let calls = 0;
  const qc = new (get("QueryCache"))({ maxEntries: 2, ttlMs: 50, getNow: () => now });
  const load = (tag) => async () => {
    calls++;
    await Promise.resolve();
    return `${tag}#${calls}`;
  };

  // Concurrent requests for "a" share ONE loader call!
  const [a1, a2] = await Promise.all([qc.fetch("a", load("A")), qc.fetch("a", load("A"))]);
  const b1 = await qc.fetch("b", load("B"));
  // Touch "a" so "b" becomes LRU, then insert "c" -> evicts "b"!
  await qc.fetch("a", load("A"));
  await qc.fetch("c", load("C"));
  const b2 = await qc.fetch("b", load("B")); // cache miss -> reloaded!
  // Advance clock past TTL -> "c" expires!
  now = 200;
  const c2 = await qc.fetch("c", load("C"));
  return { a1, a2, b1, b2, c2, calls };
}, {
  a1: "A#1",
  a2: "A#1",
  b1: "B#2",
  b2: "B#4",
  c2: "C#5",
  calls: 5,
});
```

## Hidden checks

```javascript
await expect("cleans up inFlight on rejection so later retry runs cleanly", async () => {
  const qc = new (get("QueryCache"))({ maxEntries: 5, ttlMs: 100, getNow: () => 0 });
  let attempts = 0;
  let failedOnce = false;
  try {
    await qc.fetch("k", async () => { attempts++; throw new Error("boom"); });
  } catch {
    failedOnce = true;
  }
  const ok = await qc.fetch("k", async () => { attempts++; return "ok"; });
  return { failedOnce, ok, attempts };
}, { failedOnce: true, ok: "ok", attempts: 2 });
```

## Solution

```javascript
class QueryCache {
  #maxEntries;
  #ttlMs;
  #getNow;
  #cache = new Map();
  #inFlight = new Map();

  constructor({ maxEntries = 50, ttlMs = 5000, getNow = () => Date.now() } = {}) {
    if (maxEntries < 1 || ttlMs < 0) throw new RangeError("invalid cache config");
    this.#maxEntries = maxEntries;
    this.#ttlMs = ttlMs;
    this.#getNow = getNow;
  }

  async fetch(key, loader) {
    const now = this.#getNow();
    const cached = this.#cache.get(key);
    if (cached !== undefined) {
      if (now - cached.ts < this.#ttlMs) {
        this.#cache.delete(key);
        this.#cache.set(key, cached);
        return cached.value;
      }
      this.#cache.delete(key);
    }

    if (this.#inFlight.has(key)) {
      return this.#inFlight.get(key);
    }

    const promise = (async () => {
      try {
        const value = await loader();
        if (this.#ttlMs > 0) {
          this.#cache.delete(key);
          this.#cache.set(key, { value, ts: this.#getNow() });
          while (this.#cache.size > this.#maxEntries) {
            const oldestKey = this.#cache.keys().next().value;
            this.#cache.delete(oldestKey);
          }
        }
        return value;
      } finally {
        this.#inFlight.delete(key);
      }
    })();

    this.#inFlight.set(key, promise);
    return promise;
  }

  invalidate(key) {
    if (key === undefined) this.#cache.clear();
    else this.#cache.delete(key);
  }
}
```

## Restored

The render rail's query cache now deduplicates concurrent requests and evicts stale entries in $O(1)$ time.
