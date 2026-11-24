---
id: ts-unknown-type-guards
kind: code
language: typescript
title: Validate untrusted unknown JSON payloads with user-defined type guards
system: Guard gate
symbol: instrument
scene: tests
skills: ts-narrowing-unions
---

## Briefing

Data parsed from `JSON.parse(...)` or network sockets should enter your TypeScript codebase as `unknown`, never `any`. Write a **user-defined type predicate** (`val is TelemetryPacket`) that proves an `unknown` value has the exact runtime shape your code expects.

## Objective

Define and implement:
1. `interface TelemetryPacket`:
   - `sensor: string`
   - `value: number`
   - `ok: boolean`
2. `function isTelemetryPacket(val: unknown): val is TelemetryPacket`:
   - Returns `true` iff `val` is a non-null, non-array object where:
     - `typeof sensor === "string"` and `sensor.length > 0`
     - `typeof value === "number"` and `Number.isFinite(value)`
     - `typeof ok === "boolean"`
3. `function parsePackets(items: readonly unknown[]): TelemetryPacket[]`:
   - Filters `items` using `isTelemetryPacket` so only valid `TelemetryPacket` entries are returned (with return type `TelemetryPacket[]` inferred or annotated without `any`!).

## Concept

- Unlike `any`, TypeScript forbids accessing properties on `unknown` until you narrow it.
- A function returning `val is TelemetryPacket` teaches the TypeScript compiler that whenever it returns `true`, `val` has type `TelemetryPacket` — and even works seamlessly inside `items.filter(isTelemetryPacket)`!

## Hints

1. Check `if (typeof val !== "object" || val === null || Array.isArray(val)) return false;`.
2. Narrow to `const rec = val as Record<string, unknown>;` to inspect `rec.sensor`, `rec.value`, and `rec.ok` safely without `any`.
3. In `parsePackets`, `return items.filter(isTelemetryPacket);` returns `TelemetryPacket[]` automatically!

## Starter: guided

```typescript
interface TelemetryPacket {
  sensor: string;
  value: number;
  ok: boolean;
}

function isTelemetryPacket(val: unknown): val is TelemetryPacket {
  if (typeof val !== "object" || val === null || Array.isArray(val)) return false;
  // Validate sensor, value, and ok fields
  return false;
}

function parsePackets(items: readonly unknown[]): TelemetryPacket[] {
  return items.filter(isTelemetryPacket);
}
```

## Starter: standard

```typescript
// Define TelemetryPacket, user-defined type guard isTelemetryPacket(val: unknown): val is TelemetryPacket, and parsePackets
```

## Starter: challenge

```typescript
```

## Checks

```javascript
expectType(
  "isTelemetryPacket narrows unknown to TelemetryPacket inside if blocks",
  "function _use(x: unknown): number { if (isTelemetryPacket(x)) { return x.value; } return 0; }",
);

expectType(
  "parsePackets returns TelemetryPacket[]",
  "const _pkts: TelemetryPacket[] = parsePackets([1, 'x', { sensor: 'S-1', value: 12, ok: true }]);",
);

expect("validates valid packets and rejects malformed inputs", () => {
  const isPkt = get("isTelemetryPacket");
  return [
    isPkt({ sensor: "S-1", value: 42, ok: true }),
    isPkt({ sensor: "", value: 42, ok: true }),
    isPkt({ sensor: "S-1", value: NaN, ok: true }),
    isPkt({ sensor: "S-1", value: 42, ok: "yes" }),
    isPkt(null),
    isPkt(["S-1", 42, true]),
  ];
}, [true, false, false, false, false, false]);

expect("parsePackets filters mixed unknown array cleanly", () =>
  get("parsePackets")([
    null,
    { sensor: "S-1", value: 10, ok: true },
    { sensor: "S-2", value: Infinity, ok: false },
    { sensor: "S-3", value: -5.5, ok: false },
  ]),
  [
    { sensor: "S-1", value: 10, ok: true },
    { sensor: "S-3", value: -5.5, ok: false },
  ],
);
```

## Hidden checks

```javascript
expectTypeError(
  "cannot read sensor on unnarrowed unknown",
  "function _bad(x: unknown) { return x.sensor; }",
  18046,
);
```

## Solution

```typescript
interface TelemetryPacket {
  sensor: string;
  value: number;
  ok: boolean;
}

function isTelemetryPacket(val: unknown): val is TelemetryPacket {
  if (typeof val !== "object" || val === null || Array.isArray(val)) return false;
  const rec = val as Record<string, unknown>;
  return (
    typeof rec.sensor === "string" &&
    rec.sensor.length > 0 &&
    typeof rec.value === "number" &&
    Number.isFinite(rec.value) &&
    typeof rec.ok === "boolean"
  );
}

function parsePackets(items: readonly unknown[]): TelemetryPacket[] {
  return items.filter(isTelemetryPacket);
}
```

## Restored

Guard gate type predicates online — untrusted `unknown` payloads are now narrowed safely at runtime and compile time.
