---
id: proxy-schema-guard
kind: code
language: javascript
title: Build a schema-validated, history-tracking deep Proxy state guard
system: Worker pool
symbol: equipment
scene: tests
skills: js-patterns-perf
---

## Briefing

Runtime worker configuration must never silently accept invalid types or unauthorized writes. By wrapping a configuration tree in a recursive ES6 `Proxy`, you can enforce per-property validation predicates, block writes in `readOnly` views, and record an audit trail of every mutation path.

## Concept

Implement `createGuardedState(initial, validators, { readOnly = false } = {})` and `getHistory(proxy)`:
- **Deep wrapping on `get(target, prop, receiver)`:**
  - If `value = Reflect.get(target, prop, receiver)` is a non-null plain object (`typeof value === "object" && !Array.isArray(value)`), return a child `Proxy` wrapped with the dotted path prefix (`prefix ? \`\${prefix}.\${String(prop)}\` : String(prop)`), sharing the same `validators`, `readOnly` flag, and mutation `history` array!
- **Validation & audit logging on `set(target, prop, value, receiver)`:**
  - If `readOnly` is `true`, throw a `TypeError("State is read-only")`.
  - Compute the full dotted path `fullPath = prefix ? \`\${prefix}.\${String(prop)}\` : String(prop)`.
  - Look up the validator predicate `const validate = validators[fullPath] ?? validators[prop]`.
  - If `typeof validate !== "function"` or `!validate(value)`, throw a `TypeError(\`Invalid value for \${fullPath}\`)`.
  - Capture `const oldValue = target[prop]`, apply `Reflect.set(target, prop, value, receiver)`, and push `{ path: fullPath, oldValue, newValue: value }` onto the shared `history` array.
- **Delete protection on `deleteProperty(target, prop)`:**
  - If `readOnly` is `true`, throw a `TypeError("State is read-only")`.
- **`getHistory(proxy)`:**
  - Returns the array of recorded `{ path, oldValue, newValue }` mutation entries for that guarded state (using a `WeakMap` or hidden symbol).

## Objective

Implement `createGuardedState(initial, validators, options)` and `getHistory(proxy)`.

## Hints

1. Store `history` in a module-scoped `const HISTORY = new WeakMap()` keyed by every proxy created for that root state, so `getHistory(proxy)` can retrieve it without polluting `Object.keys(proxy)`.
2. Check `validators[fullPath] ?? validators[prop]` so callers can supply either flat property validators (`{ port: (v) => ... }`) or dotted path validators (`{ "pool.max": (v) => ... }`).

## Starter: guided

```javascript
const HISTORY = new WeakMap();

function createGuardedState(initial, validators = {}, { readOnly = false } = {}) {
  const history = [];

  function wrap(target, prefix = "") {
    const proxy = new Proxy(target, {
      get(obj, prop, receiver) {
        const val = Reflect.get(obj, prop, receiver);
        if (val !== null && typeof val === "object" && !Array.isArray(val)) {
          const nextPath = prefix ? `${prefix}.${String(prop)}` : String(prop);
          return wrap(val, nextPath);
        }
        return val;
      },
      set(obj, prop, value, receiver) {
        // Check readOnly, validate with validators[fullPath] ?? validators[prop], record history, and set
      },
      deleteProperty(obj, prop) {
        if (readOnly) throw new TypeError("State is read-only");
        return Reflect.deleteProperty(obj, prop);
      },
    });
    HISTORY.set(proxy, history);
    return proxy;
  }

  return wrap(structuredClone(initial), "");
}

function getHistory(proxy) {
  return HISTORY.get(proxy) ?? [];
}
```

## Starter: standard

```javascript
function createGuardedState(initial, validators = {}, { readOnly = false } = {}) {}

function getHistory(proxy) {}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("validates top-level and nested mutations, tracks dotted history, and rejects invalid writes", () => {
  const createGuardedState = get("createGuardedState");
  const getHistory = get("getHistory");

  const state = createGuardedState(
    { host: "localhost", pool: { max: 4 } },
    {
      host: (v) => typeof v === "string" && v.length > 0,
      max: (v) => Number.isInteger(v) && v >= 1 && v <= 64,
    }
  );

  state.host = "ridge.internal";
  state.pool.max = 16;

  expectThrows("invalid max value", () => {
    state.pool.max = 0;
  }, "TypeError");

  expectThrows("unknown property without validator", () => {
    state.unknownProp = 123;
  }, "TypeError");

  return {
    host: state.host,
    max: state.pool.max,
    history: getHistory(state),
  };
}, {
  host: "ridge.internal",
  max: 16,
  history: [
    { path: "host", oldValue: "localhost", newValue: "ridge.internal" },
    { path: "pool.max", oldValue: 4, newValue: 16 },
  ],
});
```

## Hidden checks

```javascript
expect("readOnly mode blocks both top-level and nested writes and deletes with TypeError", () => {
  const createGuardedState = get("createGuardedState");
  const ro = createGuardedState(
    { mode: "prod", nested: { flag: true } },
    { mode: () => true, flag: () => true },
    { readOnly: true }
  );

  expectThrows("write top-level", () => { ro.mode = "dev"; }, "TypeError");
  expectThrows("write nested", () => { ro.nested.flag = false; }, "TypeError");
  expectThrows("delete property", () => { delete ro.mode; }, "TypeError");
  return { mode: ro.mode, flag: ro.nested.flag };
}, { mode: "prod", flag: true });
```

## Solution

```javascript
const _HISTORY = new WeakMap();

function createGuardedState(initial, validators = {}, { readOnly = false } = {}) {
  const history = [];

  function wrap(target, prefix = "") {
    const proxy = new Proxy(target, {
      get(obj, prop, receiver) {
        const val = Reflect.get(obj, prop, receiver);
        if (val !== null && typeof val === "object" && !Array.isArray(val) && typeof prop !== "symbol") {
          const nextPath = prefix ? `${prefix}.${String(prop)}` : String(prop);
          return wrap(val, nextPath);
        }
        return val;
      },
      set(obj, prop, value, receiver) {
        if (readOnly) {
          throw new TypeError("Cannot mutate read-only guarded state");
        }
        const fullPath = prefix ? `${prefix}.${String(prop)}` : String(prop);
        const validator = validators[fullPath] ?? validators[prop];
        if (typeof validator !== "function" || validator(value) !== true) {
          throw new TypeError(`Validation failed for "${fullPath}"`);
        }
        const oldValue = obj[prop];
        const ok = Reflect.set(obj, prop, value, receiver);
        history.push({ path: fullPath, oldValue, newValue: value });
        return ok;
      },
      deleteProperty(obj, prop) {
        if (readOnly) {
          throw new TypeError("Cannot delete from read-only guarded state");
        }
        return Reflect.deleteProperty(obj, prop);
      },
    });
    _HISTORY.set(proxy, history);
    return proxy;
  }

  return wrap(structuredClone(initial), "");
}

function getHistory(proxy) {
  return _HISTORY.get(proxy) ?? [];
}
```

## Restored

Worker pool state is now protected by recursive `Proxy` traps with schema validation, read-only locking, and dotted mutation audit logs.
