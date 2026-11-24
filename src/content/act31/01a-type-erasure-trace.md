---
id: ts-type-erasure-trace
kind: predict
language: typescript
title: Trace TypeScript annotations, tuples, and compile-time type erasure
system: Type bench
symbol: instrument
scene: console
skills: ts-fundamentals, reading-code
---

## Briefing

TypeScript adds a static type system on top of JavaScript. Before your program runs, the TypeScript compiler checks every type annotation, interface, and tuple — then **erases** the type annotations to emit plain JavaScript.

## Objective

Trace the TypeScript program below and predict **every line it prints**.

## Concept

- `interface` and `type` declarations exist only at compile time — they produce zero runtime overhead.
- `readonly [string, number]` declares a fixed-length tuple where index `0` is a `string` and index `1` is a `number`.
- Optional parameters (`scale: number = 1`) and strict return types (`: string`) catch mismatches at compile time before the code ever runs.

## Hints

1. `pair` is `["north", 42]`, so `pair[0].toUpperCase()` is `"NORTH"`.
2. `formatPower(pair[1])` uses the default `scale = 1` (`42 kW`); `formatPower(pair[1], 2)` computes `84 kW`.
3. `typeof pair` at runtime is `"object"` (tuples are plain JavaScript arrays after type erasure!).

## Program

```typescript
type SectorPower = readonly [string, number];

function formatPower(kw: number, scale: number = 1): string {
  return `${kw * scale} kW`;
}

const pair: SectorPower = ["north", 42];
console.log(pair[0].toUpperCase());
console.log(formatPower(pair[1]));
console.log(formatPower(pair[1], 2));
console.log(typeof pair, Array.isArray(pair));
```

## Output

```text
NORTH
42 kW
84 kW
object true
```

## Restored

Type bench trace verified — TypeScript enforces static types before execution and erases them cleanly into standard JavaScript.
