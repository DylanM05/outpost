---
id: ts-strict-interfaces-readonly
kind: code
language: typescript
title: Define strict interfaces, readonly tuples, and null-safe optional formatting
system: Type bench
symbol: instrument
scene: tests
skills: ts-fundamentals
---

## Briefing

The outpost beacon registry just migrated to strict TypeScript. Define immutable hardware types so accidental ID mutations or missing fields fail at **compile time** rather than crashing in the field.

## Objective

Define and implement:
1. `interface Beacon` with:
   - `readonly id: string`
   - `sector: string`
   - `kw: number`
   - `note?: string` (optional)
2. `type Coord = readonly [number, number]`
3. `function formatBeacon(beacon: Beacon, pos: Coord): string`:
   - Returns `"[<id>@<sector> (<x>,<y>)] <kw>kW"` when `beacon.note` is `undefined` or empty (`""`).
   - Returns `"[<id>@<sector> (<x>,<y>)] <kw>kW - <note>"` when `beacon.note` is a non-empty string.

## Concept

- Prefixing an interface property with `readonly` makes TypeScript reject reassignment (`beacon.id = "x"`) with error `TS2540`.
- `type Coord = readonly [number, number]` prevents pushing/mutating tuple elements and enforces exact length 2 (`[x, y]`).
- Under `strictNullChecks`, `beacon.note` has type `string | undefined`, so narrow it with `if (beacon.note)` before appending it.

## Hints

1. Declare `interface Beacon { readonly id: string; sector: string; kw: number; note?: string; }` and `type Coord = readonly [number, number];`.
2. Destructure `const [x, y] = pos;` and build `const base = \`[\${beacon.id}@\${beacon.sector} (\${x},\${y})] \${beacon.kw}kW\`;`.
3. Return `beacon.note ? \`\${base} - \${beacon.note}\` : base;`.

## Starter: guided

```typescript
interface Beacon {
  readonly id: string;
  sector: string;
  kw: number;
  note?: string;
}

type Coord = readonly [number, number];

function formatBeacon(beacon: Beacon, pos: Coord): string {
  // Format "[id@sector (x,y)] kwkW" plus " - note" when note is non-empty
  return "";
}
```

## Starter: standard

```typescript
// Define interface Beacon, type Coord = readonly [number, number], and formatBeacon(beacon, pos)
function formatBeacon(beacon: any, pos: any): string {
  return "";
}
```

## Starter: challenge

```typescript
```

## Checks

```javascript
expectType(
  "Beacon and Coord accept valid immutable shapes",
  "const _b: Beacon = { id: 'B-1', sector: 'north', kw: 120 }; const _c: Coord = [3, 4]; const _s: string = formatBeacon(_b, _c);",
);

expectTypeError(
  "rejects mutating readonly Beacon.id at compile time",
  "const _b: Beacon = { id: 'B-1', sector: 'north', kw: 120 }; _b.id = 'B-2';",
  2540,
);

expectTypeError(
  "rejects mutating readonly Coord tuple at compile time",
  "const _c: Coord = [1, 2]; _c[0] = 9;",
  2540,
);

expect("formats beacon without note", () => get("formatBeacon")({ id: "B-1", sector: "north", kw: 120 }, [3, 4]), "[B-1@north (3,4)] 120kW");
expect("formats beacon with note", () => get("formatBeacon")({ id: "B-2", sector: "east", kw: 85, note: "backup" }, [0, 9]), "[B-2@east (0,9)] 85kW - backup");
```

## Hidden checks

```javascript
expectTypeError(
  "rejects 3-element tuple for Coord",
  "const _bad: Coord = [1, 2, 3];",
  2322,
);

expect("treats empty string note as omitted", () => get("formatBeacon")({ id: "B-3", sector: "west", kw: 50, note: "" }, [-1, 2]), "[B-3@west (-1,2)] 50kW");
```

## Solution

```typescript
interface Beacon {
  readonly id: string;
  sector: string;
  kw: number;
  note?: string;
}

type Coord = readonly [number, number];

function formatBeacon(beacon: Beacon, pos: Coord): string {
  const [x, y] = pos;
  const base = `[${beacon.id}@${beacon.sector} (${x},${y})] ${beacon.kw}kW`;
  return beacon.note ? `${base} - ${beacon.note}` : base;
}
```

## Restored

Type bench immutable interfaces online — invalid ID writes and malformed coordinates are now caught before code ever runs.
