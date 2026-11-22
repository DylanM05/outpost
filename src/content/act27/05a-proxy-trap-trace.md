---
id: proxy-trap-trace
kind: predict
language: javascript
title: Trace ES6 Proxy get, set, and has traps with Reflect forwarding
system: Worker pool
symbol: equipment
scene: console
skills: js-patterns-perf, reading-code
---

## Briefing

ES6 `Proxy` wraps a target object with custom handler traps (`get`, `set`, `has`, `deleteProperty`) that intercept fundamental object operations before or instead of delegating to `Reflect`.

## Objective

Trace the `Proxy` handler traps below and predict **every line the program prints**.

## Concept

- **`get(target, prop, receiver)`:** intercepts property reads (`proxy.foo`, `proxy["bar"]`).
- **`set(target, prop, value, receiver)`:** intercepts property writes (`proxy.foo = val`). Returning `true` indicates success (`Reflect.set(...)`).
- **`has(target, prop)`:** intercepts the `prop in proxy` operator. Often used to hide internal properties prefixed with `"_"` from `in` checks!

## Hints

1. Reading `cfg.workers` finds `"workers"` on `target`, so `get` returns `4`. Reading `cfg.timeout` misses `target`, so `get` falls back to `defaults["timeout"]` (`3000`).
2. Writing `cfg.retries = 2.9` triggers `set`, which floors finite numbers (`Math.floor(2.9) -> 2`) and logs `"set:retries=2"`.
3. Checking `"_secret" in cfg` triggers `has`, which returns `false` for any property starting with `"_"`, whereas `"workers" in cfg` returns `true`.

## Program

```javascript
const defaults = { timeout: 3000, retries: 1 };
const raw = { workers: 4, _secret: "k9" };

const cfg = new Proxy(raw, {
  get(target, prop, receiver) {
    if (prop in target) return Reflect.get(target, prop, receiver);
    return prop in defaults ? defaults[prop] : "N/A";
  },
  set(target, prop, value, receiver) {
    const clean = typeof value === "number" ? Math.floor(value) : value;
    console.log(`set:${String(prop)}=${clean}`);
    return Reflect.set(target, prop, clean, receiver);
  },
  has(target, prop) {
    if (String(prop).startsWith("_")) return false;
    return prop in target || prop in defaults;
  },
});

console.log(cfg.workers, cfg.timeout, cfg.missing);
cfg.retries = 2.9;
console.log(cfg.retries);
console.log("_secret" in cfg, "timeout" in cfg);
```

## Output

```text
4 3000 N/A
set:retries=2
2
false true
```

## Restored

You traced how ES6 `Proxy` traps intercept property lookups, normalize mutations, and customize the `in` operator.
