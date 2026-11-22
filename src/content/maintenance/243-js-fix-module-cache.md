---
id: maintenance-js-fix-module-cache
language: javascript
title: Fix a CommonJS loader that overflows the call stack on circular require()
system: Module loader
symbol: controller
scene: tests
skills: js-testing-tooling
reviewSkill: js-testing-tooling
prerequisite: dependency-graph-bundler
---

## Briefing

`createSimpleLoader(files)` caches `mod` *after* calling `files[id](mod, mod.exports, require)`. When two modules require each other in a cycle, the loader recurses infinitely instead of returning the in-progress `mod.exports` object!

## Objective

Fix `createSimpleLoader(files)` so `cache.set(id, mod)` happens **before** invoking `files[id](mod, mod.exports, require)`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Move `cache.set(id, mod);` to the line immediately before `files[id](mod, mod.exports, require);`.

## Starter

```javascript
function createSimpleLoader(files) {
  const cache = new Map();
  return function require(id) {
    if (cache.has(id)) return cache.get(id).exports;
    if (!files[id]) throw new Error(`Missing module: ${id}`);
    const mod = { id, exports: {} };
    files[id](mod, mod.exports, require);
    cache.set(id, mod);
    return mod.exports;
  };
}
```

## Checks

```javascript
expect("resolves circular require() without infinite recursion by pre-caching mod", () => {
  const require = get("createSimpleLoader")({
    "a.js": (module, exports, req) => {
      exports.aVal = "fromA";
      exports.bFromA = req("b.js").bVal;
    },
    "b.js": (module, exports, req) => {
      const a = req("a.js");
      exports.bVal = `saw:${a.aVal}`;
    },
  });
  return require("a.js");
}, { aVal: "fromA", bFromA: "saw:fromA" });
```

## Hidden checks

```javascript
expect("evaluates each module factory only once across repeated require calls", () => {
  let runs = 0;
  const require = get("createSimpleLoader")({
    "x.js": (m) => {
      runs++;
      m.exports = { ok: true };
    },
  });
  require("x.js");
  require("x.js");
  return runs;
}, 1);
```

## Solution

```javascript
function createSimpleLoader(files) {
  const cache = new Map();
  return function require(id) {
    if (cache.has(id)) return cache.get(id).exports;
    if (!files[id]) throw new Error(`Missing module: ${id}`);
    const mod = { id, exports: {} };
    cache.set(id, mod);
    files[id](mod, mod.exports, require);
    return mod.exports;
  };
}
```

## Restored

Circular `require()` calls now receive the cached in-progress `exports` reference instead of overflowing the stack.
