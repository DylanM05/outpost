---
id: middleware-chain
language: javascript
title: Compose an onion-style async middleware pipeline
system: Router rack
symbol: equipment
scene: tests
skills: js-web-apis
---

## Briefing

Frameworks like Koa and Hono compose cross-cutting concerns (logging, auth, timing, error catching) as an **onion pipeline**: each middleware `async (ctx, next) => { ... await next(); ... }` runs code *before* downstream handlers, yields control via `await next()`, and runs cleanup *after* the response returns — or short-circuits by NOT calling `next()`!

## Concept

Write `composeMiddleware(middlewares)`:
- `middlewares` is an array of `async (ctx, next) => { ... }` functions.
- Returns `async function run(ctx)` that executes middleware `0`, passing `next` which invokes middleware `1`, and so on.
- **Safety guard:** if a single middleware invokes `next()` more than once, reject with `new Error("next() called multiple times")`!
- If a middleware skips `next()`, downstream middlewares do not run.
- Propagate thrown/rejected errors cleanly back up the onion so an outer error-handling middleware can `try { await next(); } catch (err) { ... }`!

## Objective

Implement `composeMiddleware(middlewares)`.

## Hints

1. Keep `let lastIndex = -1;` inside `run(ctx)` and define `async function dispatch(i)`:
   - If `i <= lastIndex`, throw `new Error("next() called multiple times")`!
   - Set `lastIndex = i;`.
   - If `i >= middlewares.length`, return.
   - Return `await middlewares[i](ctx, () => dispatch(i + 1))`.

## Starter: guided

```javascript
function composeMiddleware(middlewares) {
  return async function run(ctx) {
    let lastIndex = -1;
    async function dispatch(i) {
      // Guard double next(), stop when i >= middlewares.length, invoke middlewares[i](ctx, () => dispatch(i + 1)).
    }
    return dispatch(0);
  };
}
```

## Starter: standard

```javascript
function composeMiddleware(middlewares) {
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
await expect("executes onion before/after order and catches downstream errors", async () => {
  const trace = [];
  const app = get("composeMiddleware")([
    async (ctx, next) => {
      trace.push("err:in");
      try {
        await next();
      } catch (e) {
        ctx.error = e.message;
        trace.push("err:caught");
      }
    },
    async (ctx, next) => {
      trace.push("auth:in");
      await next();
      trace.push("auth:out");
    },
    async (ctx) => {
      trace.push("handler");
      if (ctx.boom) throw new Error("kaboom");
      ctx.ok = true;
    },
  ]);

  const c1 = { boom: false };
  await app(c1);
  const t1 = [...trace];
  trace.length = 0;

  const c2 = { boom: true };
  await app(c2);
  return { t1, ok1: c1.ok, t2: trace, err2: c2.error };
}, {
  t1: ["err:in", "auth:in", "handler", "auth:out"],
  ok1: true,
  t2: ["err:in", "auth:in", "handler", "err:caught"],
  err2: "kaboom",
});
```

## Hidden checks

```javascript
await expect("short-circuiting skips downstream middlewares", async () => {
  const log = [];
  const app = get("composeMiddleware")([
    async (ctx) => { log.push("blocked"); ctx.status = 401; },
    async () => { log.push("never"); },
  ]);
  const ctx = {};
  await app(ctx);
  return { log, status: ctx.status };
}, { log: ["blocked"], status: 401 });

await expectThrows("rejects calling next() twice in the same middleware", async () => {
  const app = get("composeMiddleware")([
    async (_ctx, next) => { await next(); await next(); },
    async () => {},
  ]);
  await app({});
}, /multiple times/i);
```

## Solution

```javascript
function composeMiddleware(middlewares) {
  return async function run(ctx) {
    let lastIndex = -1;
    async function dispatch(i) {
      if (i <= lastIndex) {
        throw new Error("next() called multiple times");
      }
      lastIndex = i;
      if (i >= middlewares.length) return;
      await middlewares[i](ctx, () => dispatch(i + 1));
    }
    await dispatch(0);
  };
}
```

## Restored

The router rack now composes full Koa-style async middleware pipelines with double-`next()` protection.
