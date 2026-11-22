---
id: maintenance-js-fix-bound-method
language: javascript
title: Fix a JavaScript class method that loses `this` when passed as a callback
system: Closure deck
symbol: instrument
scene: tests
skills: js-closures-classes
reviewSkill: js-closures-classes
prerequisite: deep-clone-merge
---

## Briefing

Passing `tally.add` into `items.forEach(tally.add)` throws `TypeError: Cannot read properties of undefined` because prototype methods lose `this` when detached!

## Objective

Fix `class Tally` so passing `t.add` directly to `Array.prototype.forEach` increments `this.total` reliably without losing `this`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Convert `add(n) { ... }` into an arrow class field `add = (n) => { this.total += n; };` (or bind `this.add = this.add.bind(this)` in the constructor)!

## Starter

```javascript
class Tally {
  constructor() {
    this.total = 0;
  }

  add(n) {
    this.total += n;
  }
}
```

## Checks

```javascript
expect("survives detached callback invocation in forEach", () => {
  const t = new (get("Tally"))();
  [3, 7, 10].forEach(t.add);
  return t.total;
}, 20);
```

## Hidden checks

```javascript
expect("works with direct method call too", () => {
  const t = new (get("Tally"))();
  t.add(5);
  return t.total;
}, 5);
```

## Solution

```javascript
class Tally {
  constructor() {
    this.total = 0;
  }

  add = (n) => {
    this.total += n;
  };
}
```

## Restored

Class callbacks now stay bound to their instance even when detached.
