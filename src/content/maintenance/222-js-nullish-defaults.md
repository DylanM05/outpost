---
id: maintenance-js-nullish-defaults
language: javascript
title: Apply safe nullish defaults without clobbering 0 or false
system: Console bench
symbol: instrument
scene: tests
skills: js-fundamentals
reviewSkill: js-fundamentals
prerequisite: objects-destructuring
---

## Briefing

Using `||` for JavaScript config defaults silently overwrites `timeout: 0` or `retries: 0` or `enabled: false` with the default value!

## Objective

Write `normalizeConfig(cfg)` accepting an object (or `null`/`undefined`) and returning `{ host: cfg?.host ?? "127.0.0.1", port: cfg?.port ?? 3000, retries: cfg?.retries ?? 3, debug: cfg?.debug ?? false }`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use optional chaining `?.` paired with nullish coalescing `??` on every field.

## Starter

```javascript
```

## Checks

```javascript
expect("preserves explicit 0, empty string, and false while filling missing values", () => get("normalizeConfig")({ port: 0, retries: 0, debug: false }), {
  host: "127.0.0.1",
  port: 0,
  retries: 0,
  debug: false,
});
expect("handles null input safely", () => get("normalizeConfig")(null), {
  host: "127.0.0.1",
  port: 3000,
  retries: 3,
  debug: false,
});
```

## Hidden checks

```javascript
expect("replaces null fields with defaults", () => get("normalizeConfig")({ host: null, port: undefined, debug: true }), {
  host: "127.0.0.1",
  port: 3000,
  retries: 3,
  debug: true,
});
```

## Solution

```javascript
function normalizeConfig(cfg) {
  return {
    host: cfg?.host ?? "127.0.0.1",
    port: cfg?.port ?? 3000,
    retries: cfg?.retries ?? 3,
    debug: cfg?.debug ?? false,
  };
}
```

## Restored

Config defaults now honor explicit falsy values like `0` and `false`.
