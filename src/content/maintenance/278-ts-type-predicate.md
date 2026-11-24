---
id: maintenance-ts-type-predicate
language: typescript
title: Write a user-defined type guard isAlertRecord(val: unknown): val is AlertRecord
system: Guard gate
symbol: instrument
scene: tests
skills: ts-narrowing-unions
reviewSkill: ts-narrowing-unions
prerequisite: ts-assertion-functions
---

## Briefing

Validate untrusted `unknown` objects against `interface AlertRecord { code: number; msg: string }`.

## Objective

Define `interface AlertRecord { code: number; msg: string }` and implement `isAlertRecord(val: unknown): val is AlertRecord` returning `true` only when `val` is a non-null, non-array object with an integer `code` and non-empty string `msg`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `Number.isInteger(rec.code)` and `typeof rec.msg === "string" && rec.msg.length > 0`.

## Starter

```typescript
// Define interface AlertRecord and isAlertRecord(val: unknown): val is AlertRecord
```

## Checks

```javascript
expectType("narrows unknown to AlertRecord", "function _f(x: unknown): number { return isAlertRecord(x) ? x.code : -1; }");
expect("validates AlertRecord instances accurately", () => {
  const g = get("isAlertRecord");
  return [
    g({ code: 500, msg: "fault" }),
    g({ code: 5.5, msg: "fault" }),
    g({ code: 500, msg: "" }),
    g(null),
  ];
}, [true, false, false, false]);
```

## Hidden checks

```javascript
expect("rejects arrays and strings", () => [get("isAlertRecord")([]), get("isAlertRecord")("hi")], [false, false]);
```

## Solution

```typescript
interface AlertRecord {
  code: number;
  msg: string;
}

function isAlertRecord(val: unknown): val is AlertRecord {
  if (typeof val !== "object" || val === null || Array.isArray(val)) return false;
  const rec = val as Record<string, unknown>;
  return Number.isInteger(rec.code) && typeof rec.msg === "string" && rec.msg.length > 0;
}
```

## Restored

Guard gate `AlertRecord` predicate restored.
