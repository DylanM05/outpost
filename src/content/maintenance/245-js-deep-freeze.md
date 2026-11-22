---
id: maintenance-js-deep-freeze
language: javascript
title: Implement a recursive read-only Proxy wrapper that blocks nested writes and deletes
system: Worker pool
symbol: equipment
scene: tests
skills: js-patterns-perf
reviewSkill: js-patterns-perf
prerequisite: priority-task-scheduler
---

## Briefing

`Object.freeze(obj)` is shallow — nested objects inside `obj` remain mutable. A recursive read-only `Proxy` blocks writes and deletes at any nesting depth on demand without mutating the underlying object in place.

## Objective

Implement `createReadOnlyProxy(target)` returning a `Proxy` that recursively wraps nested non-null objects on `get` and throws a `TypeError` on any `set` or `deleteProperty` attempt at any depth.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. In `get(obj, prop, receiver)`, read `const val = Reflect.get(obj, prop, receiver)` and if `val !== null && typeof val === "object"`, return `createReadOnlyProxy(val)`.
2. In both `set` and `deleteProperty`, throw `new TypeError("Read-only proxy")`.

## Starter

```javascript
function createReadOnlyProxy(target) {
  // Return a Proxy that wraps nested objects on get and throws TypeError on set/deleteProperty
}
```

## Checks

```javascript
expect("reads nested properties and throws TypeError on top-level or nested mutation", () => {
  const createReadOnlyProxy = get("createReadOnlyProxy");
  const ro = createReadOnlyProxy({ a: 1, nested: { b: 2 } });

  expectThrows("top-level set", () => { ro.a = 10; }, "TypeError");
  expectThrows("nested set", () => { ro.nested.b = 20; }, "TypeError");
  expectThrows("nested delete", () => { delete ro.nested.b; }, "TypeError");

  return { a: ro.a, b: ro.nested.b };
}, { a: 1, b: 2 });
```

## Hidden checks

```javascript
expect("protects arrays inside the read-only tree from element assignment", () => {
  const createReadOnlyProxy = get("createReadOnlyProxy");
  const ro = createReadOnlyProxy({ items: ["x", "y"] });
  expectThrows("array index set", () => { ro.items[0] = "z"; }, "TypeError");
  return ro.items[0];
}, "x");
```

## Solution

```javascript
function createReadOnlyProxy(target) {
  return new Proxy(target, {
    get(obj, prop, receiver) {
      const val = Reflect.get(obj, prop, receiver);
      if (val !== null && typeof val === "object") {
        return createReadOnlyProxy(val);
      }
      return val;
    },
    set() {
      throw new TypeError("Cannot assign to read-only proxy");
    },
    deleteProperty() {
      throw new TypeError("Cannot delete property on read-only proxy");
    },
  });
}
```

## Restored

Nested state trees are now protected at every depth by the recursive read-only `Proxy`.
