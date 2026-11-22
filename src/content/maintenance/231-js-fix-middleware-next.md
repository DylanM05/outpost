---
id: maintenance-js-fix-middleware-next
language: javascript
title: Fix a middleware runner that forgets to invoke next()
system: Router rack
symbol: equipment
scene: tests
skills: js-web-apis
reviewSkill: js-web-apis
prerequisite: middleware-chain
---

## Briefing

Our logging middleware records `"start"` and `"end"` — and accidentally stalls every route behind it because it forgot `await next()`!

## Objective

Fix `createLoggerMiddleware(log)` so it pushes `"before"`, awaits `next()`, and pushes `"after"` (even if `next()` is async!).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Call `await next();` between `log.push("before")` and `log.push("after")`!

## Starter

```javascript
function createLoggerMiddleware(log) {
  return async (ctx, next) => {
    log.push("before");
    log.push("after");
  };
}
```

## Checks

```javascript
await expect("wraps downstream async handler with before/after logs", async () => {
  const log = [];
  const mw = get("createLoggerMiddleware")(log);
  await mw({}, async () => {
    await Promise.resolve();
    log.push("handler");
  });
  return log;
}, ["before", "handler", "after"]);
```

## Hidden checks

```javascript
await expect("propagates handler mutations through ctx", async () => {
  const log = [];
  const ctx = { count: 0 };
  await get("createLoggerMiddleware")(log)(ctx, async () => { ctx.count = 42; });
  return { count: ctx.count, log };
}, { count: 42, log: ["before", "after"] });
```

## Solution

```javascript
function createLoggerMiddleware(log) {
  return async (_ctx, next) => {
    log.push("before");
    await next();
    log.push("after");
  };
}
```

## Restored

Logging middleware now awaits downstream handlers cleanly before recording completion.
