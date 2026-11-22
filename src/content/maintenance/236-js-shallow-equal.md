---
id: maintenance-js-shallow-equal
language: javascript
title: Shallow-compare plain JavaScript state objects to skip re-renders
system: Store bay
symbol: equipment
scene: tests
skills: js-reactive-ui
reviewSkill: js-reactive-ui
prerequisite: lru-fetch-cache
---

## Briefing

React `memo` and Zustand selectors avoid unnecessary re-renders by checking whether two state objects have identical own keys and `Object.is`-equal values.

## Objective

Write `shallowEqual(a, b)` returning `true` if `Object.is(a, b)`, OR if both are non-null objects with the exact same own enumerable key count and `Object.is(a[k], b[k])` for every own key `k` of `a` (present as an own property of `b`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `Object.prototype.hasOwnProperty.call(b, k)` alongside `Object.is(a[k], b[k])` so `{ a: undefined }` and `{ b: undefined }` don't falsely compare equal!

## Starter

```javascript
```

## Checks

```javascript
expect("compares flat objects with Object.is semantics including NaN", () => [
  get("shallowEqual")({ a: 1, b: NaN }, { a: 1, b: NaN }),
  get("shallowEqual")({ a: 1 }, { a: 2 }),
  get("shallowEqual")({ a: undefined }, { b: undefined }),
], [true, false, false]);
```

## Hidden checks

```javascript
expect("handles primitives, null, and same-reference objects", () => [
  get("shallowEqual")(null, null),
  get("shallowEqual")(null, {}),
  get("shallowEqual")({ a: 1 }, { a: 1, b: 2 }),
], [true, false, false]);
```

## Solution

```javascript
function shallowEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, k) || !Object.is(a[k], b[k])) return false;
  }
  return true;
}
```

## Restored

Shallow state comparison now skips redundant renders accurately without key-existence bugs.
