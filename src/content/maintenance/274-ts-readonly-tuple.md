---
id: maintenance-ts-readonly-tuple
language: typescript
title: Define a readonly GridPoint tuple and distance helper in strict TypeScript
system: Type bench
symbol: instrument
scene: tests
skills: ts-fundamentals
reviewSkill: ts-fundamentals
prerequisite: ts-strict-interfaces-readonly
---

## Briefing

Define an immutable 2D point tuple `type GridPoint = readonly [number, number]` and a Manhattan distance helper `manhattan(a: GridPoint, b: GridPoint): number`.

## Objective

Define `type GridPoint = readonly [number, number]` and implement `manhattan(a: GridPoint, b: GridPoint): number` returning `Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `type GridPoint = readonly [number, number];` so tuple element mutation fails with `TS2540`.

## Starter

```typescript
// Define type GridPoint = readonly [number, number] and manhattan(a, b)
```

## Checks

```javascript
expectType("GridPoint accepts 2-number tuple", "const _p: GridPoint = [2, 5]; const _d: number = manhattan(_p, [0, 1]);");
expectTypeError("forbids mutating readonly GridPoint", "const _p: GridPoint = [2, 5]; _p[0] = 9;", 2540);
expect("computes Manhattan distance", () => get("manhattan")([2, 5], [-1, 1]), 7);
```

## Hidden checks

```javascript
expectTypeError("rejects 3-element tuple", "const _p: GridPoint = [1, 2, 3];", 2322);
expect("returns 0 for identical points", () => get("manhattan")([4, 4], [4, 4]), 0);
```

## Solution

```typescript
type GridPoint = readonly [number, number];

function manhattan(a: GridPoint, b: GridPoint): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}
```

## Restored

Type bench coordinate tuple restored.
