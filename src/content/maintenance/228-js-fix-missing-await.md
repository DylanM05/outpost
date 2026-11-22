---
id: maintenance-js-fix-missing-await
language: javascript
title: Fix an async map helper that forgets Promise.all and returns Promises
system: Async bay
symbol: equipment
scene: tests
skills: js-async
reviewSkill: js-async
prerequisite: promise-all-concurrency
---

## Briefing

Calling `items.map(async (x) => ...)` returns an array of **pending Promises**, NOT an array of resolved values — a classic JavaScript `async`/`await` trap!

## Objective

Fix `async function fetchDoubled(nums, loader)` so it awaits all mapped Promises with `Promise.all` and returns the resolved array of doubled values!

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Wrap `nums.map(async (n) => (await loader(n)) * 2)` in `return await Promise.all(...)`!

## Starter

```javascript
async function fetchDoubled(nums, loader) {
  return nums.map(async (n) => (await loader(n)) * 2);
}
```

## Checks

```javascript
await expect("resolves all mapped Promises into plain numbers", async () => {
  return await get("fetchDoubled")([1, 2, 3], async (n) => n + 10);
}, [22, 24, 26]);
```

## Hidden checks

```javascript
await expect("handles empty input", async () => await get("fetchDoubled")([], async (n) => n), []);
```

## Solution

```javascript
async function fetchDoubled(nums, loader) {
  return Promise.all(nums.map(async (n) => (await loader(n)) * 2));
}
```

## Restored

Async array mappings now await every Promise cleanly via `Promise.all`.
