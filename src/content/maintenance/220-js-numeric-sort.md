---
id: maintenance-js-numeric-sort
language: javascript
title: Fix a JavaScript sort that sorts numbers alphabetically and mutates input
system: Array rack
symbol: equipment
scene: tests
skills: js-fundamentals
reviewSkill: js-fundamentals
prerequisite: objects-destructuring
---

## Briefing

Calling `nums.sort()` in JavaScript converts numbers to strings (`10` before `2`) AND mutates the caller's array in place!

## Objective

Fix `sortedNumbers(nums)` so it returns a **new** array of numbers sorted in ascending numerical order without mutating `nums`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Copy with `[...nums]` and pass `(a, b) => a - b` to `.sort()`.

## Starter

```javascript
function sortedNumbers(nums) {
  return nums.sort();
}
```

## Checks

```javascript
expect("sorts numbers numerically without mutating caller array", () => {
  const input = [10, 2, 100, 3, -5];
  const out = get("sortedNumbers")(input);
  return { out, input };
}, { out: [-5, 2, 3, 10, 100], input: [10, 2, 100, 3, -5] });
```

## Hidden checks

```javascript
expect("handles empty array", () => get("sortedNumbers")([]), []);
```

## Solution

```javascript
function sortedNumbers(nums) {
  return [...nums].sort((a, b) => a - b);
}
```

## Restored

Numeric sorting in JavaScript now preserves caller arrays and compares values numerically.
