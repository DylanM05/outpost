---
id: maintenance-js-promise-race-fallback
language: javascript
title: Return the first resolved Promise value or a fallback if all reject
system: Async bay
symbol: equipment
scene: tests
skills: js-async
reviewSkill: js-async
prerequisite: promise-all-concurrency
---

## Briefing

When querying redundant mirror servers, you want the first **successful** response (`Promise.any`) rather than letting one dead mirror abort everything — and a clean fallback value if every mirror fails.

## Objective

Write `async function firstOkOrFallback(tasks, fallback)` where `tasks` is an array of zero-arg async functions. Run them concurrently with `Promise.any`, returning the first fulfilled value, or `fallback` if `tasks` is empty or every task rejects!

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. `try { return await Promise.any(tasks.map((t) => Promise.resolve().then(t))); } catch { return fallback; }`.

## Starter

```javascript
```

## Checks

```javascript
await expect("returns first fulfilled mirror even when another rejects", async () => {
  return await get("firstOkOrFallback")([
    async () => { throw new Error("down"); },
    async () => "mirror-2",
  ], "offline");
}, "mirror-2");

await expect("returns fallback when all tasks reject", async () => {
  return await get("firstOkOrFallback")([
    async () => { throw new Error("a"); },
    async () => { throw new Error("b"); },
  ], "offline");
}, "offline");
```

## Hidden checks

```javascript
await expect("empty task list returns fallback", async () => await get("firstOkOrFallback")([], "default"), "default");
```

## Solution

```javascript
async function firstOkOrFallback(tasks, fallback) {
  if (!tasks.length) return fallback;
  try {
    return await Promise.any(tasks.map((t) => Promise.resolve().then(t)));
  } catch {
    return fallback;
  }
}
```

## Restored

Mirror failover now picks the first healthy Promise and degrades gracefully when all mirrors fail.
