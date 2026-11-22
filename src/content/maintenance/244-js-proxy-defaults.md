---
id: maintenance-js-proxy-defaults
language: javascript
title: Wrap an object in a Proxy that falls back to a defaults map for missing properties
system: Worker pool
symbol: equipment
scene: tests
skills: js-patterns-perf
reviewSkill: js-patterns-perf
prerequisite: priority-task-scheduler
---

## Briefing

Worker pool configs often omit optional settings. Wrap `target` in an ES6 `Proxy` whose `get` and `has` traps fall back to `defaults` whenever a property is not present on `target`.

## Objective

Implement `withDefaults(target, defaults)` returning a `Proxy` where reading `proxy[prop]` returns `target[prop]` if `prop in target`, else `defaults[prop]`, and `prop in proxy` returns `true` if `prop` exists in either `target` or `defaults`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. In `get(obj, prop, receiver)`, check `if (prop in obj) return Reflect.get(obj, prop, receiver); return defaults[prop];`.
2. In `has(obj, prop)`, return `prop in obj || prop in defaults`.

## Starter

```javascript
function withDefaults(target, defaults) {
  // Return a Proxy over target with get and has traps falling back to defaults
}
```

## Checks

```javascript
expect("falls back to defaults on get and has while respecting explicit falsy values on target", () => {
  const withDefaults = get("withDefaults");
  const cfg = withDefaults(
    { retries: 0, host: "edge.local" },
    { retries: 3, timeout: 5000 }
  );
  return {
    retries: cfg.retries,
    host: cfg.host,
    timeout: cfg.timeout,
    hasTimeout: "timeout" in cfg,
    hasUnknown: "unknown" in cfg,
  };
}, {
  retries: 0,
  host: "edge.local",
  timeout: 5000,
  hasTimeout: true,
  hasUnknown: false,
});
```

## Hidden checks

```javascript
expect("writes go to target without mutating defaults", () => {
  const withDefaults = get("withDefaults");
  const defaults = { timeout: 5000 };
  const cfg = withDefaults({}, defaults);
  cfg.timeout = 1000;
  return { cfgTimeout: cfg.timeout, defaultTimeout: defaults.timeout };
}, { cfgTimeout: 1000, defaultTimeout: 5000 });
```

## Solution

```javascript
function withDefaults(target, defaults) {
  return new Proxy(target, {
    get(obj, prop, receiver) {
      if (prop in obj) return Reflect.get(obj, prop, receiver);
      return defaults[prop];
    },
    has(obj, prop) {
      return prop in obj || prop in defaults;
    },
  });
}
```

## Restored

The configuration `Proxy` now resolves fallback defaults transparently while keeping explicit falsy values intact.
