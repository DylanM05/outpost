---
id: ts-literal-unions-narrowing
kind: code
language: typescript
title: Narrow literal unions and nullable inputs with typeof and null checks
system: Union rack
symbol: equipment
scene: tests
skills: ts-narrowing-unions
---

## Briefing

Sensors send readings as numbers, numeric strings, `null`, or `undefined`, and alert levels must be restricted to three exact string literals. Model both with union types and narrow them cleanly.

## Objective

Define and implement:
1. `type Severity = "info" | "warn" | "critical";`
2. `type RawReading = number | string | null | undefined;`
3. `function severityRank(level: Severity): number`:
   - Returns `1` for `"info"`, `2` for `"warn"`, and `3` for `"critical"`.
4. `function normalizeReading(raw: RawReading, fallback: number): number`:
   - If `raw === null || raw === undefined`, return `fallback`.
   - If `typeof raw === "number"`, return `Number.isFinite(raw) ? raw : fallback`.
   - If `typeof raw === "string"`, parse with `Number(raw.trim())`: if the trimmed string is empty or the parsed result is not finite (`!Number.isFinite(n)`), return `fallback`; otherwise return `n`.

## Concept

- String literal unions (`"info" | "warn" | "critical"`) prevent typos like `"critcal"` at compile time (`TS2345`).
- TypeScript's control-flow analysis automatically narrows `RawReading` inside `if (raw == null)` and `if (typeof raw === "number")` branches.

## Hints

1. Use a `switch (level)` or lookup `Record<Severity, number>` in `severityRank`.
2. In `normalizeReading`, handle `raw === null || raw === undefined` first, then `typeof raw === "number"`, leaving `raw` narrowed to `string`!

## Starter: guided

```typescript
type Severity = "info" | "warn" | "critical";
type RawReading = number | string | null | undefined;

function severityRank(level: Severity): number {
  return 0;
}

function normalizeReading(raw: RawReading, fallback: number): number {
  return fallback;
}
```

## Starter: standard

```typescript
// Define Severity, RawReading, severityRank, and normalizeReading
```

## Starter: challenge

```typescript
```

## Checks

```javascript
expectType(
  "accepts valid Severity literals and RawReading union inputs",
  "const _r1: number = severityRank('warn'); const _r2: number = normalizeReading('42.5', 0); const _r3: number = normalizeReading(null, 10);",
);

expectTypeError(
  "rejects invalid Severity literal at compile time",
  "severityRank('fatal');",
  2345,
);

expect("maps severity ranks", () => [get("severityRank")("info"), get("severityRank")("warn"), get("severityRank")("critical")], [1, 2, 3]);
expect("normalizes numeric, string, null, and undefined inputs", () => [
  get("normalizeReading")(15, -1),
  get("normalizeReading")(" 27.5 ", -1),
  get("normalizeReading")(null, -1),
  get("normalizeReading")(undefined, -1),
  get("normalizeReading")("abc", -1),
], [15, 27.5, -1, -1, -1]);
```

## Hidden checks

```javascript
expectTypeError(
  "rejects boolean in RawReading",
  "normalizeReading(true, 0);",
  2345,
);

expect("treats blank string and NaN/Infinity as fallback", () => [
  get("normalizeReading")("   ", 99),
  get("normalizeReading")(NaN, 99),
  get("normalizeReading")(Infinity, 99),
  get("normalizeReading")(0, 99),
], [99, 99, 99, 0]);
```

## Solution

```typescript
type Severity = "info" | "warn" | "critical";
type RawReading = number | string | null | undefined;

function severityRank(level: Severity): number {
  switch (level) {
    case "info":
      return 1;
    case "warn":
      return 2;
    case "critical":
      return 3;
  }
}

function normalizeReading(raw: RawReading, fallback: number): number {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : fallback;
  const trimmed = raw.trim();
  if (trimmed === "") return fallback;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : fallback;
}
```

## Restored

Union rack narrowing online — invalid severity labels are blocked at compile time and nullable readings normalize cleanly.
