---
id: commonjs-loader
kind: code
language: javascript
title: Implement a CommonJS module loader with relative path resolution and cycle caching
system: Module loader
symbol: controller
scene: tests
skills: js-testing-tooling
---

## Briefing

How do bundlers and Node.js load modules, resolve relative imports like `"./math"` or `"../shared/util"`, and avoid infinite recursion when Module A and Module B `require()` each other? By normalizing virtual paths and placing each `module` record into the cache **before** executing its factory function!

## Concept

Implement `createModuleLoader(files)` where `files` is an object mapping normalized absolute paths (like `"/index.js"`, `"/lib/math.js"`) to factory functions `(module, exports, require) => void`:
- Returns a top-level `require(specifier)` function (resolving relative to `"/"`).
- **Path resolution (`resolvePath(fromDir, specifier)`):**
  - If `specifier` starts with `"/"`, resolve segments starting from root; if it starts with `"./"` or `"../"`, join with `fromDir` and collapse `"."` and `".."` segments.
  - Append `".js"` if the resulting path does not already end with `".js"`.
  - If the resolved path is not in `files`, throw `new Error(\`Module not found: \${resolved}\`)`.
- **Module caching & circular dependency safety:**
  - If `cache.has(resolved)`, immediately return `cache.get(resolved).exports`.
  - Otherwise create `const mod = { id: resolved, exports: {}, loaded: false }` and **store `cache.set(resolved, mod)` before calling the factory**.
  - Invoke `files[resolved](mod, mod.exports, childRequire)` where `childRequire` resolves relative to `dirname(resolved)`.
  - Mark `mod.loaded = true` and return `mod.exports` (note: a module may either mutate `exports.foo = ...` or reassign `module.exports = ...`!).

## Objective

Implement `createModuleLoader(files)` returning a `require(id)` function with relative path resolution, caching, and circular require support.

## Hints

1. To compute the directory of `"/lib/sub/math.js"`, take `resolved.slice(0, resolved.lastIndexOf("/") + 1)` (which yields `"/lib/sub/"`).
2. Always return `mod.exports` (not the original `exports` variable), because a factory can reassign `module.exports = function () {}`!

## Starter: guided

```javascript
function resolveModulePath(fromDir, specifier) {
  const raw = specifier.startsWith("/") ? specifier : `${fromDir}/${specifier}`;
  const parts = [];
  for (const seg of raw.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  const normalized = "/" + parts.join("/");
  return normalized.endsWith(".js") ? normalized : `${normalized}.js`;
}

function createModuleLoader(files) {
  const cache = new Map();

  function load(fromDir, specifier) {
    const id = resolveModulePath(fromDir, specifier);
    if (!Object.prototype.hasOwnProperty.call(files, id)) {
      throw new Error(`Module not found: ${id}`);
    }
    // Return cached exports if present; otherwise create mod, cache BEFORE factory, run factory, and return mod.exports
  }

  return (specifier) => load("/", specifier);
}
```

## Starter: standard

```javascript
function createModuleLoader(files) {}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("resolves relative paths, caches singleton modules, and survives circular require()", () => {
  const createModuleLoader = get("createModuleLoader");
  let mathEvalCount = 0;

  const requireRoot = createModuleLoader({
    "/index.js": (module, exports, require) => {
      const add = require("./lib/math");
      const a = require("./cycle/a");
      module.exports = { sum: add(4, 6), cycleA: a.fromA() };
    },
    "/lib/math.js": (module, exports, require) => {
      mathEvalCount++;
      const offset = require("../config").offset;
      module.exports = (x, y) => x + y + offset;
    },
    "/config.js": (module, exports) => {
      exports.offset = 5;
    },
    "/cycle/a.js": (module, exports, require) => {
      exports.name = "A";
      const b = require("./b");
      exports.fromA = () => `${exports.name}->${b.bSawA}`;
    },
    "/cycle/b.js": (module, exports, require) => {
      const a = require("./a");
      exports.bSawA = a.name;
    },
  });

  const first = requireRoot("/index");
  const second = requireRoot("./lib/math")(1, 2);
  return { first, second, mathEvalCount };
}, {
  first: { sum: 15, cycleA: "A->A" },
  second: 8,
  mathEvalCount: 1,
});
```

## Hidden checks

```javascript
expect("throws Error when requiring a missing module", () => {
  const requireRoot = get("createModuleLoader")({
    "/index.js": (m, e, req) => req("./missing"),
  });
  expectThrows("missing module", () => requireRoot("/index"));
  return true;
}, true);
```

## Solution

```javascript
function _resolveModulePath(fromDir, specifier) {
  const raw = specifier.startsWith("/") ? specifier : `${fromDir}/${specifier}`;
  const parts = [];
  for (const seg of raw.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  const normalized = "/" + parts.join("/");
  return normalized.endsWith(".js") ? normalized : `${normalized}.js`;
}

function createModuleLoader(files) {
  const cache = new Map();

  function load(fromDir, specifier) {
    const id = _resolveModulePath(fromDir, specifier);
    if (cache.has(id)) {
      return cache.get(id).exports;
    }
    if (!Object.prototype.hasOwnProperty.call(files, id)) {
      throw new Error(`Module not found: ${id}`);
    }
    const mod = { id, exports: {}, loaded: false };
    cache.set(id, mod);
    const dir = id.slice(0, id.lastIndexOf("/") + 1) || "/";
    const localRequire = (childSpec) => load(dir, childSpec);
    files[id](mod, mod.exports, localRequire);
    mod.loaded = true;
    return mod.exports;
  }

  return (specifier) => load("/", specifier);
}
```

## Restored

The CommonJS module loader now resolves relative virtual paths, caches singleton exports, and breaks circular `require` loops cleanly.
