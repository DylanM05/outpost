---
id: ts-keyof-typeof-trace
kind: predict
language: typescript
title: Trace as const objects, keyof typeof lookups, and Record tables
system: Utility deck
symbol: controller
scene: console
skills: ts-generics-utilities, reading-code
---

## Briefing

Rather than duplicating a list of keys in both a TypeScript `type` and a runtime object, idiomatic TypeScript declares a single `as const` lookup object and derives the union type with **`keyof typeof`**.

## Objective

Trace the TypeScript program below and predict **every line it prints**.

## Concept

- `const MODES = { eco: 0.5, normal: 1, boost: 1.5 } as const;` locks every property as `readonly` with exact literal value types (`0.5 | 1 | 1.5`).
- `type Mode = keyof typeof MODES;` derives `"eco" | "normal" | "boost"` automatically — zero drift between types and runtime data!
- `as const` is compile-time only (unlike `Object.freeze`), so it emits a plain JavaScript object at runtime.

## Hints

1. `MODES.boost` is `1.5`, so `scalePower(100, "boost")` prints `150`.
2. `Object.keys(MODES).join(",")` prints `"eco,normal,boost"`.
3. `labels.eco` is `"Low"`, and `scalePower(40, "eco")` is `20`.

## Program

```typescript
const MODES = {
  eco: 0.5,
  normal: 1,
  boost: 1.5,
} as const;

type Mode = keyof typeof MODES;

const LABELS: Record<Mode, string> = {
  eco: "Low",
  normal: "Std",
  boost: "Max",
};

function scalePower(kw: number, mode: Mode): number {
  return kw * MODES[mode];
}

console.log(Object.keys(MODES).join(","));
console.log(scalePower(100, "boost"));
console.log(`${LABELS.eco}:${scalePower(40, "eco")}`);
```

## Output

```text
eco,normal,boost
150
Low:20
```

## Restored

Utility deck trace verified — `as const` and `keyof typeof` keep runtime lookup tables and compile-time key unions in lockstep.
