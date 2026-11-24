---
id: maintenance-ts-generic-pick
language: typescript
title: Implement a generic pickKeys<T, K extends keyof T> runtime helper returning Pick<T, K>
system: Generic bay
symbol: equipment
scene: tests
skills: ts-generics-utilities
reviewSkill: ts-generics-utilities
prerequisite: ts-typed-event-bus
---

## Briefing

Implement a strongly typed `pickKeys<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K>` helper that returns a new object containing only the selected keys.

## Objective

Write `pickKeys<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K>` so TypeScript rejects unknown key names at compile time and returns the exact `Pick<T, K>` subset at runtime.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Initialize `const out = {} as Pick<T, K>;`, loop `for (const k of keys) out[k] = obj[k];`, and return `out`.

## Starter

```typescript
// Implement pickKeys<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K>
```

## Checks

```javascript
expectType(
  "returns exact Pick<T, K> type",
  "const _sub: { id: string; kw: number } = pickKeys({ id: 'A', kw: 10, secret: 'x' }, ['id', 'kw']);",
);
expectTypeError(
  "rejects unknown key in keys array",
  "pickKeys({ id: 'A', kw: 10 }, ['nope']);",
  2322,
);
expect("copies only requested keys", () => get("pickKeys")({ a: 1, b: 2, c: 3 }, ["a", "c"]), { a: 1, c: 3 });
```

## Hidden checks

```javascript
expect("returns empty object when keys array is empty", () => get("pickKeys")({ a: 1 }, []), {});
```

## Solution

```typescript
function pickKeys<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of keys) {
    out[key] = obj[key];
  }
  return out;
}
```

## Restored

Generic bay `pickKeys` helper restored.
