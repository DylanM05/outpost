---
id: maintenance-ts-fix-implicit-any
language: typescript
title: Fix implicit any parameters and nullable property access under strict TypeScript
system: Type bench
symbol: instrument
scene: tests
skills: ts-fundamentals
reviewSkill: ts-fundamentals
prerequisite: ts-strict-interfaces-readonly
---

## Briefing

This legacy helper was ported from JavaScript to strict TypeScript and now fails compilation with `TS7006` (implicit `any`) and `TS18048` (possibly `undefined` property access).

## Objective

Add strict TypeScript types (`interface SensorSpec { id: string; watts?: number }`) and safely default missing `watts` to `0` so `totalWatts(specs)` compiles under strict mode and returns the total wattage.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Annotate `function totalWatts(specs: readonly SensorSpec[]): number` and accumulate `sum + (s.watts ?? 0)`.

## Starter

```typescript
interface SensorSpec {
  id: string;
  watts?: number;
}

function totalWatts(specs) {
  let sum = 0;
  for (const s of specs) {
    sum += s.watts;
  }
  return sum;
}
```

## Checks

```javascript
expectType("totalWatts accepts readonly SensorSpec[] and returns number", "const _n: number = totalWatts([{ id: 'A' }, { id: 'B', watts: 25 }]);");
expect("sums watts while defaulting missing watts to 0", () =>
  get("totalWatts")([{ id: "A", watts: 10 }, { id: "B" }, { id: "C", watts: 35 }]),
  45,
);
```

## Hidden checks

```javascript
expectTypeError("rejects wrong item type", "totalWatts([123]);", 2322);
expect("returns 0 for empty list", () => get("totalWatts")([]), 0);
```

## Solution

```typescript
interface SensorSpec {
  id: string;
  watts?: number;
}

function totalWatts(specs: readonly SensorSpec[]): number {
  let sum = 0;
  for (const s of specs) {
    sum += s.watts ?? 0;
  }
  return sum;
}
```

## Restored

Type bench legacy helper repaired — strict parameter annotations and nullish defaults are clean.
