---
id: maintenance-js-async-reduce
language: javascript
title: Run dependent async pipeline steps sequentially
system: Async bay
symbol: equipment
scene: tests
skills: js-async
reviewSkill: js-async
prerequisite: promise-all-concurrency
---

## Briefing

Sometimes async steps depend on the previous step's output and MUST execute sequentially rather than in parallel.

## Objective

Write `async function runPipeline(initialValue, asyncSteps)` that awaits each step `acc = await step(acc)` in order and returns the final accumulated value.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. A clean `for (const step of asyncSteps) { acc = await step(acc); }` loop is clearer and easier to debug than `reduce` with Promises!

## Starter

```javascript
```

## Checks

```javascript
await expect("executes async transforms strictly in sequence", async () => {
  const order = [];
  const val = await get("runPipeline")(2, [
    async (x) => { order.push("add"); return x + 3; },
    async (x) => { order.push("mul"); return x * 4; },
  ]);
  return { val, order };
}, { val: 20, order: ["add", "mul"] });
```

## Hidden checks

```javascript
await expect("empty steps returns initialValue", async () => await get("runPipeline")("ok", []), "ok");
```

## Solution

```javascript
async function runPipeline(initialValue, asyncSteps) {
  let acc = initialValue;
  for (const step of asyncSteps) {
    acc = await step(acc);
  }
  return acc;
}
```

## Restored

Sequential async pipelines now thread awaited results cleanly step by step.
