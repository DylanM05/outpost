---
id: event-loop-trace
kind: predict
language: javascript
title: Trace the JavaScript event loop: sync, microtasks, and macrotasks
system: Async bay
symbol: equipment
scene: console
skills: js-async, reading-code
---

## Briefing

JavaScript runs on a single thread driven by the **event loop**:
1. All **synchronous** call-stack code runs to completion first.
2. Then **all microtasks** (`Promise.then` callbacks and `await` continuations) drain completely — including new microtasks queued by earlier microtasks!
3. Only after the microtask queue is empty does the next **macrotask** (`setTimeout`) run!

## Objective

Trace the event-loop scheduling below and predict **every line it prints**.

## Concept

Even `setTimeout(fn, 0)` schedules a **macrotask**, so every `Promise.resolve().then(...)` microtask ALWAYS runs before `setTimeout(..., 0)`!

## Hints

1. Synchronous lines run first: `"1: start"`, then `"2: sync end"`.
2. Next, the microtask queue drains: `"3: micro 1"`, which queues `"4: micro 2"` — and `"4: micro 2"` STILL runs before `"5: macro timeout"`!

## Program

```javascript
console.log("1: start");

setTimeout(() => {
  console.log("5: macro timeout");
}, 0);

Promise.resolve()
  .then(() => {
    console.log("3: micro 1");
  })
  .then(() => {
    console.log("4: micro 2");
  });

console.log("2: sync end");
```

## Output

```text
1: start
2: sync end
3: micro 1
4: micro 2
5: macro timeout
```

## Restored

You traced JavaScript's exact call-stack -> microtask -> macrotask event-loop execution order.
