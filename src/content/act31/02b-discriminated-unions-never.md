---
id: ts-discriminated-unions-never
kind: code
language: typescript
title: Model events with discriminated unions and exhaustiveness checking via never
system: Union rack
symbol: equipment
scene: tests
skills: ts-narrowing-unions
---

## Briefing

Instead of one bloated `Event` interface full of optional fields, TypeScript shines with **discriminated unions** — where every variant carries a literal `kind` tag and the compiler proves you handled every single case via `never`.

## Objective

Define and implement:
1. `type GridEvent`:
   - `{ kind: "spike"; kw: number }`
   - `{ kind: "outage"; sector: string }`
   - `{ kind: "restored"; sector: string; minutes: number }`
2. `function assertNever(value: never): never` — throws `new Error("Unexpected variant: " + JSON.stringify(value))`.
3. `function describeEvent(ev: GridEvent): string`:
   - `"spike"` -> `"SPIKE: <kw>kW"`
   - `"outage"` -> `"OUTAGE: <sector>"`
   - `"restored"` -> `"RESTORED: <sector> after <minutes>m"`
   - `default:` calls `return assertNever(ev);` so adding a new variant in the future fails to compile until handled!

## Concept

- Switching on `ev.kind` narrows `ev` to the exact branch interface, so `ev.kw` is only valid in `"spike"` and `ev.minutes` is only valid in `"restored"`.
- Passing the remaining `ev` in `default:` to `assertNever(ev: never)` guarantees compile-time exhaustiveness: if every case is handled, `ev` narrows to `never`.

## Hints

1. Write `type GridEvent = { kind: "spike"; kw: number } | { kind: "outage"; sector: string } | { kind: "restored"; sector: string; minutes: number };`.
2. In `describeEvent`, use `switch (ev.kind)` with a `default: return assertNever(ev);`.

## Starter: guided

```typescript
type GridEvent =
  | { kind: "spike"; kw: number }
  | { kind: "outage"; sector: string }
  | { kind: "restored"; sector: string; minutes: number };

function assertNever(value: never): never {
  throw new Error(`Unexpected variant: ${JSON.stringify(value)}`);
}

function describeEvent(ev: GridEvent): string {
  // Handle every GridEvent variant exhaustively
  return "";
}
```

## Starter: standard

```typescript
// Define GridEvent discriminated union, assertNever(value: never): never, and describeEvent(ev)
```

## Starter: challenge

```typescript
```

## Checks

```javascript
expectType(
  "GridEvent accepts all three valid variants",
  "const _e1: GridEvent = { kind: 'spike', kw: 90 }; const _e2: GridEvent = { kind: 'outage', sector: 'north' }; const _e3: GridEvent = { kind: 'restored', sector: 'north', minutes: 12 };",
);

expectTypeError(
  "rejects mismatched payload on discriminated union variant",
  "const _bad: GridEvent = { kind: 'spike', sector: 'north' };",
  2353,
);

expectTypeError(
  "assertNever rejects non-never argument at compile time",
  "assertNever('oops');",
  2345,
);

expect("formats all three GridEvent variants", () => [
  get("describeEvent")({ kind: "spike", kw: 240 }),
  get("describeEvent")({ kind: "outage", sector: "east" }),
  get("describeEvent")({ kind: "restored", sector: "east", minutes: 15 }),
], [
  "SPIKE: 240kW",
  "OUTAGE: east",
  "RESTORED: east after 15m",
]);
```

## Hidden checks

```javascript
expectThrows(
  "assertNever throws Error at runtime if called with an unexpected value",
  () => get("assertNever")({ kind: "unknown" }),
  "Error",
);
```

## Solution

```typescript
type GridEvent =
  | { kind: "spike"; kw: number }
  | { kind: "outage"; sector: string }
  | { kind: "restored"; sector: string; minutes: number };

function assertNever(value: never): never {
  throw new Error(`Unexpected variant: ${JSON.stringify(value)}`);
}

function describeEvent(ev: GridEvent): string {
  switch (ev.kind) {
    case "spike":
      return `SPIKE: ${ev.kw}kW`;
    case "outage":
      return `OUTAGE: ${ev.sector}`;
    case "restored":
      return `RESTORED: ${ev.sector} after ${ev.minutes}m`;
    default:
      return assertNever(ev);
  }
}
```

## Restored

Union rack exhaustiveness verified — discriminated unions and `never` guards now make unhandled event states impossible to compile.
