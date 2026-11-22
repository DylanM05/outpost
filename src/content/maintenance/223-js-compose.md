---
id: maintenance-js-compose
language: javascript
title: Compose left-to-right function pipelines in JavaScript
system: Closure deck
symbol: instrument
scene: tests
skills: js-closures-classes
reviewSkill: js-closures-classes
prerequisite: deep-clone-merge
---

## Briefing

Small reusable transforms shine when combined via a `pipe(...fns)` helper that threads a value cleanly through each function left to right.

## Objective

Write `pipe(...fns)` returning a function `(initial) => ...` that applies each function in `fns` from left to right (returning `initial` unchanged if `fns` is empty).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. `return (initial) => fns.reduce((val, fn) => fn(val), initial);`.

## Starter

```javascript
```

## Checks

```javascript
expect("threads value left to right", () => {
  const run = get("pipe")((x) => x + 2, (x) => x * 3, (x) => `${x}!`);
  return run(4);
}, "18!");
expect("empty pipe acts as identity", () => get("pipe")()(42), 42);
```

## Hidden checks

```javascript
expect("single function pipe works", () => get("pipe")((s) => s.trim())("  ok  "), "ok");
```

## Solution

```javascript
function pipe(...fns) {
  return (initial) => fns.reduce((val, fn) => fn(val), initial);
}
```

## Restored

Function composition pipelines now chain cleanly left to right.
