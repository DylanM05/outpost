---
id: this-and-classes
language: javascript
title: Build ES6 classes with private fields, getters, and bound callbacks
system: Closure deck
symbol: instrument
scene: tests
skills: js-closures-classes
---

## Briefing

One of JavaScript's sharpest edges is dynamic `this` binding: if you pass `station.record` directly as a callback (`events.forEach(station.record)`), `this` becomes `undefined` in strict mode! Modern ES6 classes combine **private `#fields`**, **getters**, and **arrow methods** (or `.bind(this)`) to keep methods safe when detached.

## Concept

Implement `class BatteryBank`:
- Constructor `constructor(capacity)` (throw `new RangeError("capacity must be > 0")` if `capacity <= 0`).
- Private fields `#capacity` and `#charge` (starting at `0`).
- Getter `get level()` -> returns `#charge`.
- Getter `get percent()` -> returns `Math.round((#charge / #capacity) * 100)`.
- `charge = (amount) => { ... }` (arrow class field OR bound in constructor so passing `bank.charge` as a detached callback STILL works!):
  - If `amount < 0`, throw `new RangeError("amount must be >= 0")`.
  - Adds `amount` clamped to `#capacity` and returns `#charge`.
- `drain = (amount) => { ... }` (safe when detached!):
  - If `amount < 0`, throw `new RangeError("amount must be >= 0")`.
  - Subtracts `amount` clamped at `0` and returns `#charge`.

## Objective

Implement `class BatteryBank` with private fields, `level` and `percent` getters, and callback-safe `charge` and `drain` methods.

## Hints

1. Defining `charge = (amount) => { ... }` as an arrow class field automatically binds `this` to the instance even when passed as `[10, 20].forEach(bank.charge)`!

## Starter: guided

```javascript
class BatteryBank {
  #capacity;
  #charge = 0;

  constructor(capacity) {
    if (capacity <= 0) throw new RangeError("capacity must be positive");
    this.#capacity = capacity;
  }

  get level() {
    return this.#charge;
  }

  get percent() {
    // Return Math.round((this.#charge / this.#capacity) * 100).
  }

  charge = (amount) => {
    // Validate amount >= 0, add clamped to #capacity, return #charge.
  };

  drain = (amount) => {
    // Validate amount >= 0, subtract clamped at 0, return #charge.
  };
}
```

## Starter: standard

```javascript
class BatteryBank {
  constructor(capacity) {
  }
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("charges, drains, clamps, and survives detached callback invocation", () => {
  const Bank = get("BatteryBank");
  const b = new Bank(100);
  const chargeFn = b.charge;
  const drainFn = b.drain;
  [30, 45, 50].forEach((n) => chargeFn(n)); // clamps at 100
  const peak = b.level;
  drainFn(25);
  return { peak, level: b.level, percent: b.percent };
}, { peak: 100, level: 75, percent: 75 });
```

## Hidden checks

```javascript
expect("clamps drain at 0", () => {
  const b = new (get("BatteryBank"))(50);
  b.charge(10);
  return b.drain(99);
}, 0);
expectThrows("rejects non-positive capacity", () => new (get("BatteryBank"))(0), "RangeError");
expectThrows("rejects negative charge amount", () => new (get("BatteryBank"))(50).charge(-5), "RangeError");
```

## Solution

```javascript
class BatteryBank {
  #capacity;
  #charge = 0;

  constructor(capacity) {
    if (typeof capacity !== "number" || capacity <= 0) {
      throw new RangeError("capacity must be positive");
    }
    this.#capacity = capacity;
  }

  get level() {
    return this.#charge;
  }

  get percent() {
    return Math.round((this.#charge / this.#capacity) * 100);
  }

  charge = (amount) => {
    if (typeof amount !== "number" || amount < 0) {
      throw new RangeError("amount must be non-negative");
    }
    this.#charge = Math.min(this.#capacity, this.#charge + amount);
    return this.#charge;
  };

  drain = (amount) => {
    if (typeof amount !== "number" || amount < 0) {
      throw new RangeError("amount must be non-negative");
    }
    this.#charge = Math.max(0, this.#charge - amount);
    return this.#charge;
  };
}
```

## Restored

The closure deck now builds encapsulated ES6 classes whose methods stay safely bound even when passed as callbacks.
