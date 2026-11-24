---
id: ts-generic-keyof-constraints
kind: code
language: typescript
title: Write generic collection helpers constrained with extends keyof T
system: Generic bay
symbol: equipment
scene: tests
skills: ts-generics-utilities
---

## Briefing

Generic functions let you write reusable data helpers once while preserving the **exact** property types of whatever interface callers pass in — catching misspelled field names at compile time with `K extends keyof T`.

## Objective

Implement two strictly typed generic functions:
1. `function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][]`
   - Returns an array containing `item[key]` for every `item` in `items`, typed precisely as `T[K][]`.
2. `function indexBy<T, K extends keyof T>(items: readonly T[], key: K): Map<T[K], T>`
   - Returns a `Map` keyed by `item[key]` mapping to the corresponding `item` (later items overwrite earlier ones on duplicate keys), typed precisely as `Map<T[K], T>`.

## Concept

- `K extends keyof T` restricts `key` to be one of the actual property names of `T` (so passing `"nonexistent"` triggers `TS2345`!).
- The indexed access type `T[K]` evaluates to the exact type of property `K` on `T` (for example, `number[]` when plucking `"kw"`, or `string[]` when plucking `"id"`).

## Hints

1. `pluck`: `return items.map((item) => item[key]);` — TypeScript automatically infers `T[K][]`!
2. `indexBy`: `const out = new Map<T[K], T>(); for (const item of items) out.set(item[key], item); return out;`.

## Starter: guided

```typescript
function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return [];
}

function indexBy<T, K extends keyof T>(items: readonly T[], key: K): Map<T[K], T> {
  return new Map();
}
```

## Starter: standard

```typescript
// Implement generic pluck<T, K extends keyof T> and indexBy<T, K extends keyof T>
```

## Starter: challenge

```typescript
```

## Checks

```javascript
expectType(
  "pluck infers exact T[K][] return type for string and number keys",
  "interface Node { id: string; kw: number; } const _nodes: Node[] = [{ id: 'A', kw: 10 }]; const _ids: string[] = pluck(_nodes, 'id'); const _kws: number[] = pluck(_nodes, 'kw');",
);

expectType(
  "indexBy infers exact Map<T[K], T> return type",
  "interface Node { id: string; kw: number; } const _m: Map<string, Node> = indexBy([{ id: 'A', kw: 10 }], 'id');",
);

expectTypeError(
  "rejects unknown property key at compile time",
  "pluck([{ id: 'A', kw: 10 }], 'missing');",
  2345,
);

expect("plucks field values at runtime", () =>
  get("pluck")([{ id: "R-1", kw: 50 }, { id: "R-2", kw: 80 }], "kw"),
  [50, 80],
);

expect("indexes items into a Map by key", () => {
  const m = get("indexBy")([{ id: "R-1", kw: 50 }, { id: "R-2", kw: 80 }], "id");
  return [m instanceof Map, m.get("R-2")];
}, [true, { id: "R-2", kw: 80 }]);
```

## Hidden checks

```javascript
expectTypeError(
  "rejects assigning plucked string[] into number[]",
  "const _bad: number[] = pluck([{ id: 'A', kw: 10 }], 'id');",
  2322,
);

expect("later duplicate keys overwrite earlier entries in indexBy", () => {
  const m = get("indexBy")([{ id: "X", v: 1 }, { id: "X", v: 2 }], "id");
  return [m.size, m.get("X").v];
}, [1, 2]);
```

## Solution

```typescript
function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

function indexBy<T, K extends keyof T>(items: readonly T[], key: K): Map<T[K], T> {
  const map = new Map<T[K], T>();
  for (const item of items) {
    map.set(item[key], item);
  }
  return map;
}
```

## Restored

Generic bay collection helpers online — property names and extracted value types are now verified at compile time.
