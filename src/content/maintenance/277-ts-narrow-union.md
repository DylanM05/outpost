---
id: maintenance-ts-narrow-union
language: typescript
title: Narrow a string | number | boolean union into a canonical telemetry tag
system: Union rack
symbol: equipment
scene: tests
skills: ts-narrowing-unions
reviewSkill: ts-narrowing-unions
prerequisite: ts-assertion-functions
---

## Briefing

Format a `TagValue = string | number | boolean` into `"str:<trimmed>"`, `"num:<fixed-1>"` (`value.toFixed(1)`), or `"bool:on"` / `"bool:off"`.

## Objective

Define `type TagValue = string | number | boolean` and implement `encodeTag(val: TagValue): string` using `typeof` narrowing.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Branch on `typeof val === "string"`, `typeof val === "number"`, and handle the remaining `boolean`.

## Starter

```typescript
// Define type TagValue = string | number | boolean and encodeTag(val)
```

## Checks

```javascript
expectType("accepts string, number, and boolean", "const _a: string = encodeTag('ok'); const _b: string = encodeTag(3.5); const _c: string = encodeTag(true);");
expectTypeError("rejects null", "encodeTag(null);", 2345);
expect("encodes all three primitive union branches", () => [
  get("encodeTag")(" north "),
  get("encodeTag")(12.34),
  get("encodeTag")(true),
  get("encodeTag")(false),
], ["str:north", "num:12.3", "bool:on", "bool:off"]);
```

## Hidden checks

```javascript
expect("formats integer numbers with 1 decimal place", () => get("encodeTag")(7), "num:7.0");
```

## Solution

```typescript
type TagValue = string | number | boolean;

function encodeTag(val: TagValue): string {
  if (typeof val === "string") return `str:${val.trim()}`;
  if (typeof val === "number") return `num:${val.toFixed(1)}`;
  return val ? "bool:on" : "bool:off";
}
```

## Restored

Union rack primitive tag encoder restored.
