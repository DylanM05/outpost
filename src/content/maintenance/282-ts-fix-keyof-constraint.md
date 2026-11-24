---
id: maintenance-ts-fix-keyof-constraint
language: typescript
title: Fix a generic property getter missing the K extends keyof T constraint
system: Generic bay
symbol: equipment
scene: tests
skills: ts-generics-utilities
reviewSkill: ts-generics-utilities
prerequisite: ts-typed-event-bus
---

## Briefing

`getProp(obj, key)` fails strict compilation (`TS7053`) because `key: string` is too wide to index an arbitrary generic `T` and returns `any` instead of `T[K]`.

## Objective

Constrain `K extends keyof T` and return `T[K]` so `getProp` compiles cleanly under strict mode and preserves exact property types!

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Change the signature to `function getProp<T, K extends keyof T>(obj: T, key: K): T[K]`.

## Starter

```typescript
function getProp<T>(obj: T, key: string) {
  return obj[key];
}
```

## Checks

```javascript
expectType("infers exact property type T[K]", "const _n: number = getProp({ id: 'A', kw: 55 }, 'kw');");
expectTypeError("rejects non-existent key", "getProp({ id: 'A', kw: 55 }, 'missing');", 2345);
expect("reads property value at runtime", () => get("getProp")({ id: "A", kw: 55 }, "kw"), 55);
```

## Hidden checks

```javascript
expectTypeError("rejects assigning string result into number", "const _bad: number = getProp({ id: 'A', kw: 55 }, 'id');", 2322);
```

## Solution

```typescript
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

## Restored

Generic bay `getProp` constraint repaired — index access is now strictly checked at compile time.
