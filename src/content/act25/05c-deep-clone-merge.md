---
id: deep-clone-merge
language: javascript
title: Deep-merge nested plain objects safely without prototype pollution
system: Stream rail
symbol: controller
scene: tests
skills: js-closures-classes
---

## Briefing

Shallow spread `{ ...a, ...b }` clobbers nested objects completely — AND naive recursive `deepMerge` functions in JavaScript are famous for **prototype pollution** vulnerabilities if an untrusted payload contains `"__proto__"`, `"constructor"`, or `"prototype"` keys!

## Concept

Write `deepMerge(target, source)`:
- Helper `isPlainObject(v)`: `v !== null && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype`.
- Returns a **brand-new** object without mutating `target` or `source`!
- First deep-clone plain objects/arrays from `target`.
- For each own key `k` of `source`:
  - **Security guard:** skip `"__proto__"`, `"constructor"`, and `"prototype"` completely!
  - If BOTH `result[k]` and `source[k]` are plain objects: recursively set `result[k] = deepMerge(result[k], source[k])`.
  - Else if `Array.isArray(source[k])`: replace with a shallow-cloned/deep-cloned array copy (arrays replace, they don't merge element-by-element).
  - Else if `isPlainObject(source[k])`: deep-clone `source[k]` (`deepMerge({}, source[k])`).
  - Else: assign primitive `source[k]`.

## Objective

Implement `deepMerge(target, source)` with full immutability and prototype-pollution protection.

## Hints

1. Use `Object.keys(obj)` so you only iterate own enumerable keys, and explicitly skip `const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);`.

## Starter: guided

```javascript
const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);

function isPlainObject(val) {
  return val !== null && typeof val === "object" && !Array.isArray(val) && Object.getPrototypeOf(val) === Object.prototype;
}

function deepMerge(target, source) {
  // Deeply merge target and source into a fresh object, skipping FORBIDDEN keys.
}
```

## Starter: standard

```javascript
function deepMerge(target, source) {
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("deep-merges nested objects without mutating inputs", () => {
  const base = { net: { host: "a", port: 80 }, tags: ["v1"] };
  const patch = { net: { port: 443, tls: true }, tags: ["v2"] };
  const merged = get("deepMerge")(base, patch);
  merged.net.host = "mutated";
  merged.tags.push("extra");
  return { baseHost: base.net.host, basePort: base.net.port, patchTags: patch.tags, merged };
}, {
  baseHost: "a",
  basePort: 80,
  patchTags: ["v2"],
  merged: { net: { host: "mutated", port: 443, tls: true }, tags: ["v2", "extra"] },
});

expect("blocks prototype pollution keys cleanly", () => {
  const malicious = JSON.parse('{"__proto__":{"polluted":true},"safe":1}');
  const out = get("deepMerge")({}, malicious);
  return { safe: out.safe, polluted: ({}).polluted === true };
}, { safe: 1, polluted: false });
```

## Hidden checks

```javascript
expect("replaces primitive with nested object cleanly", () => get("deepMerge")({ a: 1 }, { a: { x: 2 } }), { a: { x: 2 } });
expect("skips constructor and prototype keys", () => Object.keys(get("deepMerge")({}, { constructor: "bad", prototype: "bad", ok: 1 })), ["ok"]);
```

## Solution

```javascript
const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);

function isPlainObject(val) {
  return (
    val !== null &&
    typeof val === "object" &&
    !Array.isArray(val) &&
    Object.getPrototypeOf(val) === Object.prototype
  );
}

function cloneValue(val) {
  if (Array.isArray(val)) return val.map(cloneValue);
  if (isPlainObject(val)) return deepMerge({}, val);
  return val;
}

function deepMerge(target, source) {
  const result = {};
  if (isPlainObject(target)) {
    for (const key of Object.keys(target)) {
      if (FORBIDDEN.has(key)) continue;
      result[key] = cloneValue(target[key]);
    }
  }
  if (isPlainObject(source)) {
    for (const key of Object.keys(source)) {
      if (FORBIDDEN.has(key)) continue;
      const incoming = source[key];
      if (isPlainObject(result[key]) && isPlainObject(incoming)) {
        result[key] = deepMerge(result[key], incoming);
      } else {
        result[key] = cloneValue(incoming);
      }
    }
  }
  return result;
}
```

## Restored

The stream rail now merges nested JavaScript configs immutably with built-in prototype-pollution defense.
