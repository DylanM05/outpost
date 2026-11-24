---
id: ts-utility-type-transforms
kind: code
language: typescript
title: Transform domain types with Partial, Pick, Omit, Readonly, and Record
system: Utility deck
symbol: controller
scene: tests
skills: ts-generics-utilities
---

## Briefing

Instead of hand-copying interfaces for create forms, update patches, and list summaries (which inevitably fall out of sync), derive them directly from your core `Station` model using TypeScript's built-in **utility types**.

## Objective

Define and implement:
1. `interface Station`:
   - `readonly id: string`
   - `name: string`
   - `sector: string`
   - `kw: number`
   - `online: boolean`
2. Derived types:
   - `type StationSummary = Pick<Station, "id" | "sector" | "online">;`
   - `type StationDraft = Omit<Station, "id">;`
   - `type StationPatch = Partial<StationDraft>;`
3. Functions:
   - `function toSummary(s: Station): StationSummary` — returns `{ id: s.id, sector: s.sector, online: s.online }`.
   - `function applyPatch(s: Readonly<Station>, patch: StationPatch): Readonly<Station>` — returns a new object `{ ...s, ...patch }` (without mutating `s` and without allowing `id` to be patched!).
   - `function countBySector(stations: readonly Station[]): Record<string, number>` — returns a plain object mapping each `sector` to its station count.

## Concept

- `Pick<T, K>` keeps only the selected keys from `T`.
- `Omit<T, K>` removes specified keys (great for creation payloads where `id` is generated later).
- `Partial<Omit<Station, "id">>` makes every mutable field optional while still preventing callers from passing `{ id: "hacked" }`!

## Hints

1. Define the 3 type aliases (`StationSummary`, `StationDraft`, `StationPatch`) using `Pick`, `Omit`, and `Partial`.
2. In `applyPatch`, return `{ ...s, ...patch }`.
3. In `countBySector`, accumulate `counts[s.sector] = (counts[s.sector] ?? 0) + 1`.

## Starter: guided

```typescript
interface Station {
  readonly id: string;
  name: string;
  sector: string;
  kw: number;
  online: boolean;
}

type StationSummary = Pick<Station, "id" | "sector" | "online">;
type StationDraft = Omit<Station, "id">;
type StationPatch = Partial<StationDraft>;

function toSummary(s: Station): StationSummary {
  return { id: "", sector: "", online: false };
}

function applyPatch(s: Readonly<Station>, patch: StationPatch): Readonly<Station> {
  return s;
}

function countBySector(stations: readonly Station[]): Record<string, number> {
  return {};
}
```

## Starter: standard

```typescript
// Define Station, StationSummary (Pick), StationDraft (Omit), StationPatch (Partial), toSummary, applyPatch, and countBySector
```

## Starter: challenge

```typescript
```

## Checks

```javascript
expectType(
  "utility types allow valid summaries, drafts, and partial patches",
  `const _st: Station = { id: 'S-1', name: 'Alpha', sector: 'north', kw: 100, online: true };
   const _sum: StationSummary = toSummary(_st);
   const _dr: StationDraft = { name: 'Beta', sector: 'east', kw: 50, online: false };
   const _next: Readonly<Station> = applyPatch(_st, { kw: 150 });
   const _cnt: Record<string, number> = countBySector([_st]);`,
);

expectTypeError(
  "StationPatch forbids patching id at compile time",
  "const _p: StationPatch = { id: 'HACK' };",
  2353,
);

expectTypeError(
  "StationSummary excludes kw at compile time",
  "function _bad(s: StationSummary) { return s.kw; }",
  2339,
);

expect("toSummary, applyPatch, and countBySector work immutably at runtime", () => {
  const s1 = { id: "S-1", name: "Alpha", sector: "north", kw: 100, online: true };
  const s2 = { id: "S-2", name: "Beta", sector: "north", kw: 80, online: false };
  const s3 = { id: "S-3", name: "Gamma", sector: "east", kw: 60, online: true };
  const patched = get("applyPatch")(s1, { kw: 140, online: false });
  return {
    summary: get("toSummary")(s1),
    patched,
    origKw: s1.kw,
    counts: get("countBySector")([s1, s2, s3]),
  };
}, {
  summary: { id: "S-1", sector: "north", online: true },
  patched: { id: "S-1", name: "Alpha", sector: "north", kw: 140, online: false },
  origKw: 100,
  counts: { north: 2, east: 1 },
});
```

## Hidden checks

```javascript
expectTypeError(
  "StationDraft requires all non-id fields",
  "const _bad: StationDraft = { name: 'OnlyName' };",
  2739,
);
```

## Solution

```typescript
interface Station {
  readonly id: string;
  name: string;
  sector: string;
  kw: number;
  online: boolean;
}

type StationSummary = Pick<Station, "id" | "sector" | "online">;
type StationDraft = Omit<Station, "id">;
type StationPatch = Partial<StationDraft>;

function toSummary(s: Station): StationSummary {
  return { id: s.id, sector: s.sector, online: s.online };
}

function applyPatch(s: Readonly<Station>, patch: StationPatch): Readonly<Station> {
  return { ...s, ...patch };
}

function countBySector(stations: readonly Station[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of stations) {
    counts[s.sector] = (counts[s.sector] ?? 0) + 1;
  }
  return counts;
}
```

## Restored

Utility deck transforms online — summaries, creation drafts, and immutable patches now derive automatically from `Station`.
