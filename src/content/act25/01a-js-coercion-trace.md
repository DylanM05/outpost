---
id: js-coercion-trace
kind: predict
language: javascript
title: Trace JavaScript strict vs. loose equality and nullish coalescing
system: Console bench
symbol: instrument
scene: console
skills: js-fundamentals, reading-code
---

## Briefing

Welcome to **JavaScript**! Coming from Python, two things surprise engineers first: loose equality (`==`) silently coerces types (so always prefer `===`), and logical OR (`||`) treats `0` and `""` as falsy whereas nullish coalescing (`??`) only falls back on `null` or `undefined`.

## Objective

Trace the JavaScript snippet below and predict **every line it prints**.

## Concept

- `0 == "0"` is `true` (string coerced to number), whereas `0 === "0"` is `false` (strict equality checks type AND value!).
- `0 || 42` returns `42` because `0` is falsy in JavaScript.
- `0 ?? 42` returns `0` because `??` ONLY falls back when the left side is `null` or `undefined`!
- `null ?? "default"` returns `"default"`.

## Hints

1. Check line 1: `"5" + 1` concatenates into `"51"`, while `"5" - 1` coerces to number `4`.
2. Check line 2: `0 === "0"` is `false`.
3. Check lines 3–4: `0 || 10` is `10`, while `0 ?? 10` is `0`.

## Program

```javascript
console.log("5" + 1, "5" - 1);
console.log(0 == "0", 0 === "0");
console.log(0 || 10, 0 ?? 10);
console.log(undefined ?? "fallback");
```

## Output

```text
51 4
true false
10 0
fallback
```

## Restored

You traced JavaScript's coercion pitfalls and know why modern JS relies on `===` and `??`.
