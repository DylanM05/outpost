---
id: maintenance-js-fix-cache-ttl
language: javascript
title: Fix a JS TTL cache returning expired entries instead of fresh ones
system: Render rail
symbol: controller
scene: tests
skills: js-validation-auth
reviewSkill: js-validation-auth
prerequisite: json-jwt-guard
---

## Briefing

A frontend response cache has its TTL comparison inverted — returning `undefined` for fresh entries and serving stale expired ones!

## Objective

Fix `getFresh(cacheMap, key, now, ttlMs)` where each entry in `cacheMap` is `{ value, ts }` so it returns `entry.value` iff `now - entry.ts < ttlMs`, and deletes expired entries returning `undefined`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. An entry is fresh while `now - entry.ts < ttlMs`, and expired when `now - entry.ts >= ttlMs`!

## Starter

```javascript
function getFresh(cacheMap, key, now, ttlMs) {
  const entry = cacheMap.get(key);
  if (!entry) return undefined;
  if (now - entry.ts < ttlMs) {
    cacheMap.delete(key);
    return undefined;
  }
  return entry.value;
}
```

## Checks

```javascript
expect("returns fresh entry and evicts expired entry", () => {
  const m = new Map([["a", { value: 1, ts: 100 }], ["b", { value: 2, ts: 100 }]]);
  const hit = get("getFresh")(m, "a", 140, 50);
  const miss = get("getFresh")(m, "b", 150, 50);
  return { hit, miss, hasB: m.has("b") };
}, { hit: 1, miss: undefined, hasB: false });
```

## Hidden checks

```javascript
expect("returns undefined for unknown key", () => get("getFresh")(new Map(), "missing", 0, 100), undefined);
```

## Solution

```javascript
function getFresh(cacheMap, key, now, ttlMs) {
  const entry = cacheMap.get(key);
  if (!entry) return undefined;
  if (now - entry.ts >= ttlMs) {
    cacheMap.delete(key);
    return undefined;
  }
  return entry.value;
}
```

## Restored

The TTL cache now serves fresh entries and cleanly evicts expired ones.
