---
id: url-hash-router
language: javascript
title: Build a client-side SPA history router with wildcard fallback
system: Render rail
symbol: controller
scene: tests
skills: js-reactive-ui
---

## Briefing

Single-Page Applications (SPAs) navigate between views without full-page reloads by maintaining an in-memory history stack (`push`, `replace`, `back`, `forward`) and matching the active path against parameterized routes and a `"*"` not-found fallback.

## Concept

Implement `class SpaRouter`:
- `constructor(routes, initialPath = "/")`:
  - `routes` is an array of `{ path, view }` where `path` may contain `:param` segments or `"*"` (fallback wildcard).
  - Maintains `history = [initialPath]` and `cursor = 0`.
- **`current()`:** resolves `history[cursor]` (splitting optional `?query` string) against `routes` in order, returning `{ path, view, params, query }` (or `{ path, view: null, params: {}, query }` if no route or `"*"` matched).
- **`push(path)`:** truncates any forward history (`history.slice(0, cursor + 1)`), appends `path`, advances `cursor`, and returns `current()`.
- **`replace(path)`:** replaces `history[cursor] = path` without changing stack length, and returns `current()`.
- **`back()` / `forward()`:** moves `cursor` by `-1` / `+1` clamped to `[0, history.length - 1]` and returns `current()`.

## Objective

Implement `class SpaRouter` with `current`, `push`, `replace`, `back`, and `forward`.

## Hints

1. When `push(path)` is called after `back()`, always slice off the stale forward entries (`this.#history = this.#history.slice(0, this.#cursor + 1)`) just like a real browser!

## Starter: guided

```javascript
class SpaRouter {
  #routes;
  #history;
  #cursor = 0;

  constructor(routes, initialPath = "/") {
    this.#routes = [...routes];
    this.#history = [initialPath];
  }

  current() {
    // Match this.#history[this.#cursor] against #routes (supporting :params and "*" fallback).
  }

  push(path) {}
  replace(path) {}
  back() {}
  forward() {}
}
```

## Starter: standard

```javascript
class SpaRouter {
  constructor(routes, initialPath = "/") {}
  current() {}
  push(path) {}
  replace(path) {}
  back() {}
  forward() {}
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("navigates history stack, matches params, and truncates forward stack on push", () => {
  const router = new (get("SpaRouter"))([
    { path: "/", view: "Home" },
    { path: "/acts/:id", view: "ActView" },
    { path: "*", view: "NotFound" },
  ]);
  const s0 = router.current().view;
  const s1 = router.push("/acts/js1?tab=code");
  const s2 = router.push("/missing");
  const back1 = router.back();
  const s3 = router.push("/acts/js2"); // drops "/missing" from forward history!
  const fwd = router.forward();        // stays at "/acts/js2"
  return { s0, s1, s2View: s2.view, back1Params: back1.params, s3Params: s3.params, fwdPath: fwd.path };
}, {
  s0: "Home",
  s1: { path: "/acts/js1?tab=code", view: "ActView", params: { id: "js1" }, query: { tab: "code" } },
  s2View: "NotFound",
  back1Params: { id: "js1" },
  s3Params: { id: "js2" },
  fwdPath: "/acts/js2",
});
```

## Hidden checks

```javascript
expect("replace updates current entry in place without growing history", () => {
  const r = new (get("SpaRouter"))([{ path: "/a", view: "A" }, { path: "/b", view: "B" }], "/a");
  r.replace("/b");
  return r.back().view; // still at index 0 -> "B"!
}, "B");
```

## Solution

```javascript
function matchRoute(pattern, pathname) {
  if (pattern === "*") return {};
  const pSegs = pattern.split("/").filter(Boolean);
  const aSegs = pathname.split("/").filter(Boolean);
  if (pSegs.length !== aSegs.length) return null;
  const params = {};
  for (let i = 0; i < pSegs.length; i++) {
    if (pSegs[i].startsWith(":")) params[pSegs[i].slice(1)] = decodeURIComponent(aSegs[i]);
    else if (pSegs[i] !== aSegs[i]) return null;
  }
  return params;
}

class SpaRouter {
  #routes;
  #history;
  #cursor = 0;

  constructor(routes, initialPath = "/") {
    this.#routes = [...routes];
    this.#history = [initialPath];
  }

  current() {
    const full = this.#history[this.#cursor];
    const [pathname, rawQuery = ""] = full.split("?", 2);
    const query = Object.fromEntries(new URLSearchParams(rawQuery));
    for (const route of this.#routes) {
      const params = matchRoute(route.path, pathname);
      if (params !== null) {
        return { path: full, view: route.view, params, query };
      }
    }
    return { path: full, view: null, params: {}, query };
  }

  push(path) {
    this.#history = this.#history.slice(0, this.#cursor + 1);
    this.#history.push(path);
    this.#cursor = this.#history.length - 1;
    return this.current();
  }

  replace(path) {
    this.#history[this.#cursor] = path;
    return this.current();
  }

  back() {
    if (this.#cursor > 0) this.#cursor -= 1;
    return this.current();
  }

  forward() {
    if (this.#cursor < this.#history.length - 1) this.#cursor += 1;
    return this.current();
  }
}
```

## Restored

The render rail's SPA router now manages browser-style history stacks, query strings, and dynamic routes.
