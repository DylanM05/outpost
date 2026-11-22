---
id: let-const-templates
language: javascript
title: Format telemetry alerts with const, template literals, and defaults
system: Console bench
symbol: instrument
scene: tests
skills: js-fundamentals
---

## Briefing

Modern JavaScript avoids `var` completely in favor of block-scoped `const` (default choice) and `let` (only when reassigning), pairs them with backtick **template literals** (`` `${expr}` ``), and uses `??` for safe numeric defaults where `0` is a valid reading!

## Concept

Write two functions in JavaScript:
1. `formatAlert(site, reading, unit = "C")`:
   - If `reading` is `null` or `undefined`, substitute `"N/A"` using `??` (IMPORTANT: `0` MUST format as `"0C"`, NOT `"N/A"`!).
   - Otherwise format as `` `${reading}${unit}` ``.
   - Return `` `[${site.toUpperCase()}] ${value}` ``.
2. `clampReading(value, min = 0, max = 100)`:
   - If `typeof value !== "number" || Number.isNaN(value)`, throw `new TypeError("value must be a number")`.
   - Return `Math.min(max, Math.max(min, value))`.

## Objective

Implement `formatAlert(site, reading, unit = "C")` and `clampReading(value, min = 0, max = 100)` in JavaScript.

## Hints

1. Use `const value = reading == null ? "N/A" : `${reading}${unit}`;` (note `reading == null` matches both `null` and `undefined` without catching `0`!).
2. Use `Number.isNaN(value)` rather than global `isNaN(value)` so non-numbers don't silently coerce.

## Starter: guided

```javascript
function formatAlert(site, reading, unit = "C") {
  const tag = site.toUpperCase();
  // Use nullish check so 0 is preserved, while null/undefined become "N/A".
}

function clampReading(value, min = 0, max = 100) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new TypeError("value must be a number");
  }
  // Clamp value between min and max.
}
```

## Starter: standard

```javascript
function formatAlert(site, reading, unit = "C") {
}

function clampReading(value, min = 0, max = 100) {
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("formats numeric reading with default unit", () => get("formatAlert")("ridge", 18), "[RIDGE] 18C");
expect("preserves zero reading instead of falling back", () => get("formatAlert")("ridge", 0, "kW"), "[RIDGE] 0kW");
expect("uses N/A for null or undefined", () => get("formatAlert")("north", null), "[NORTH] N/A");
expect("clamps readings within bounds", () => [
  get("clampReading")(-5),
  get("clampReading")(42),
  get("clampReading")(150, 0, 120),
], [0, 42, 120]);
```

## Hidden checks

```javascript
expect("handles undefined reading", () => get("formatAlert")("bay", undefined, "V"), "[BAY] N/A");
expectThrows("rejects NaN with TypeError", () => get("clampReading")(NaN), "TypeError");
expectThrows("rejects string with TypeError", () => get("clampReading")("10"), "TypeError");
```

## Solution

```javascript
function formatAlert(site, reading, unit = "C") {
  const value = reading === null || reading === undefined ? "N/A" : `${reading}${unit}`;
  return `[${site.toUpperCase()}] ${value}`;
}

function clampReading(value, min = 0, max = 100) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new TypeError("value must be a number");
  }
  return Math.min(max, Math.max(min, value));
}
```

## Restored

The console bench now formats JavaScript telemetry alerts cleanly without falsy-zero bugs.
