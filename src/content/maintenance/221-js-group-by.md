---
id: maintenance-js-group-by
language: javascript
title: Group an array of JavaScript objects by a key function
system: Array rack
symbol: equipment
scene: tests
skills: js-fundamentals
reviewSkill: js-fundamentals
prerequisite: objects-destructuring
---

## Briefing

Partitioning records by category or status is one of the most common array `reduce` jobs in JavaScript.

## Objective

Write `groupBy(items, keyFn)` returning a plain object mapping each `keyFn(item)` string to an array of matching items in their original order.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Inside `reduce` or a `for (const item of items)` loop, initialize `(groups[key] ??= []).push(item)`.

## Starter

```javascript
```

## Checks

```javascript
expect("groups objects preserving order", () => get("groupBy")(
  [{ id: 1, env: "prod" }, { id: 2, env: "dev" }, { id: 3, env: "prod" }],
  (x) => x.env,
), {
  prod: [{ id: 1, env: "prod" }, { id: 3, env: "prod" }],
  dev: [{ id: 2, env: "dev" }],
});
```

## Hidden checks

```javascript
expect("empty array returns empty object", () => get("groupBy")([], (x) => x), {});
```

## Solution

```javascript
function groupBy(items, keyFn) {
  const groups = {};
  for (const item of items) {
    const key = String(keyFn(item));
    if (!Object.prototype.hasOwnProperty.call(groups, key)) {
      groups[key] = [];
    }
    groups[key].push(item);
  }
  return groups;
}
```

## Restored

JavaScript grouping helpers now bucket records cleanly in one linear pass.
