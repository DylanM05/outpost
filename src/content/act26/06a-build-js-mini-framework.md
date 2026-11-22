---
id: build-js-mini-framework
language: javascript
title: Build an end-to-end full-stack JavaScript mini framework
system: Module audit
symbol: controller
scene: tests
assessment: true
skills: js-web-apis, js-validation-auth, js-reactive-ui
---

## Briefing

Tie **JS II (*The module bay*)** together in `class MiniApp`: an Express-style router with Koa-style async middleware, Web Crypto HS256 JWT route guards, schema-validated JSON mutations into an immutable reactive store, and XSS-safe virtual-DOM HTML rendering!

## Concept

Implement `class MiniApp`:
- `constructor({ jwtSecret, initialState = {} })`:
  - Stores `jwtSecret`, creates an internal immutable store initialized with `{ ...initialState }`, an array of middlewares, and an array of routes.
- **`use(middleware)`:** registers an onion middleware `async (ctx, next) => ...` (returning `this`).
- **`route(method, pattern, handler)`:** registers a route handler `async (ctx) => { status, body }` (returning `this`), supporting `:param` extraction and `405` / `404` distinction!
- **`getState()` / `setState(patchOrFn)` / `subscribe(fn)`:** delegates to the internal immutable store (notifying subscribers only when at least one key changes!).
- **`async signToken(payload)` / `async verifyToken(token, nowSec)`:** HS256 Web Crypto JWT signing & verification (rejecting non-HS256 or expired `nowSec >= payload.exp` tokens with `null`).
- **`render(vnode)`:** renders `{ tag, props, children }` trees (and strings/numbers/arrays/null/booleans) into XSS-escaped HTML strings with sorted attributes!
- **`async handle(req)`** where `req` is `{ method, path, headers = {}, body, nowSec = 0 }`:
  - Creates context `ctx = { req, method, pathname, params: {}, query, user: null, res: null, app: this }`.
  - If `headers.authorization` (case-insensitive) starts with `"Bearer "`, verifies the JWT with `verifyToken(token, nowSec)` and sets `ctx.user` to the payload (or `null` if invalid/expired).
  - Runs all registered middlewares in onion order, ending at route dispatch (which sets `ctx.res = await handler(ctx)`, or `405` if path matched another method, or `404` if unmatched — unless an earlier middleware already short-circuited and set `ctx.res`!).
  - Returns `ctx.res`.

## Objective

Implement `class MiniApp` with `use`, `route`, `getState`, `setState`, `subscribe`, `signToken`, `verifyToken`, `render`, and `async handle(req)`.

## Hints

1. Put route dispatch as the innermost step of `composeMiddleware([...this.#middlewares, dispatchRoute])` so outer middlewares can time requests, catch errors, or short-circuit with `ctx.res = { status: 401, ... }` before the route runs!

## Starter: guided

```javascript
class MiniApp {
  constructor({ jwtSecret, initialState = {} }) {
    this.jwtSecret = jwtSecret;
    this._state = { ...initialState };
    this._listeners = new Set();
    this._middlewares = [];
    this._routes = [];
  }

  use(mw) {
    this._middlewares.push(mw);
    return this;
  }

  route(method, pattern, handler) {
    this._routes.push({ method: method.toUpperCase(), pattern, handler });
    return this;
  }

  getState() { return this._state; }
  setState(updater) {}
  subscribe(fn) {}
  async signToken(payload) {}
  async verifyToken(token, nowSec) {}
  render(node) {}
  async handle(req) {}
}
```

## Starter: standard

```javascript
class MiniApp {
  constructor(options) {}
  use(mw) {}
  route(method, pattern, handler) {}
  getState() {}
  setState(updater) {}
  subscribe(fn) {}
  async signToken(payload) {}
  async verifyToken(token, nowSec) {}
  render(node) {}
  async handle(req) {}
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
await expect("handles JWT auth middleware, parameterized mutations, store updates, and XSS-safe SSR", async () => {
  const App = get("MiniApp");
  const app = new App({ jwtSecret: "top-secret", initialState: { notes: [] } });
  const trace = [];
  const storeChanges = [];
  app.subscribe((s) => storeChanges.push(s.notes.length));

  app.use(async (ctx, next) => {
    trace.push(`in:${ctx.method}`);
    await next();
    trace.push(`out:${ctx.res.status}`);
  });

  app.route("POST", "/notes/:author", async (ctx) => {
    if (!ctx.user) return { status: 401, body: { error: "unauthorized" } };
    const text = ctx.body?.text;
    if (typeof text !== "string" || text.length < 1) return { status: 400, body: { error: "invalid" } };
    ctx.app.setState((s) => ({ notes: [...s.notes, { author: ctx.params.author, text }] }));
    return { status: 201, body: { ok: true, by: ctx.user.sub } };
  });

  app.route("GET", "/view", async (ctx) => {
    const html = ctx.app.render({
      tag: "ul",
      props: { class: "notes" },
      children: ctx.app.getState().notes.map((n) => ({
        tag: "li",
        props: {},
        children: [`${n.author}: ${n.text}`],
      })),
    });
    return { status: 200, body: html };
  });

  const tok = await app.signToken({ sub: "ada", exp: 1000 });
  const unauth = await app.handle({ method: "POST", path: "/notes/ada", body: { text: "hi" }, nowSec: 500 });
  const created = await app.handle({
    method: "POST",
    path: "/notes/ada",
    headers: { Authorization: `Bearer ${tok}` },
    body: { text: "<script>x</script>" },
    nowSec: 500,
  });
  const view = await app.handle({ method: "GET", path: "/view", nowSec: 500 });
  const wrongMethod = await app.handle({ method: "DELETE", path: "/view", nowSec: 500 });

  return { unauthStatus: unauth.status, created, view, wrongMethodStatus: wrongMethod.status, storeChanges, trace };
}, {
  unauthStatus: 401,
  created: { status: 201, body: { ok: true, by: "ada" } },
  view: { status: 200, body: '<ul class="notes"><li>ada: &lt;script&gt;x&lt;/script&gt;</li></ul>' },
  wrongMethodStatus: 405,
  storeChanges: [1],
  trace: ["in:POST", "out:401", "in:POST", "out:201", "in:GET", "out:200", "in:DELETE", "out:405"],
});
```

## Hidden checks

```javascript
await expect("rejects expired JWT and returns 404 on unknown route", async () => {
  const app = new (get("MiniApp"))({ jwtSecret: "k" });
  app.route("GET", "/me", (ctx) => ({ status: ctx.user ? 200 : 401, body: ctx.user }));
  const tok = await app.signToken({ sub: "lin", exp: 100 });
  const expired = await app.handle({ method: "GET", path: "/me", headers: { authorization: `Bearer ${tok}` }, nowSec: 100 });
  const missing = await app.handle({ method: "GET", path: "/nope", nowSec: 50 });
  return [expired.status, missing.status];
}, [401, 404]);
```

## Solution

```javascript
const _enc = new TextEncoder();
const _dec = new TextDecoder();
const _VOID = new Set(["br", "hr", "img", "input"]);

function _toB64Url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function _fromB64Url(str) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function _escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function _matchRoute(pattern, pathname) {
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

class MiniApp {
  #secret;
  #state;
  #listeners = new Set();
  #middlewares = [];
  #routes = [];

  constructor({ jwtSecret, initialState = {} }) {
    this.#secret = jwtSecret;
    this.#state = { ...initialState };
  }

  use(mw) {
    this.#middlewares.push(mw);
    return this;
  }

  route(method, pattern, handler) {
    this.#routes.push({ method: method.toUpperCase(), pattern, handler });
    return this;
  }

  getState() {
    return this.#state;
  }

  setState(updater) {
    const patch = typeof updater === "function" ? updater(this.#state) : updater;
    if (!patch || typeof patch !== "object") return;
    let changed = false;
    for (const k of Object.keys(patch)) {
      if (!Object.is(this.#state[k], patch[k])) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    const prev = this.#state;
    this.#state = { ...this.#state, ...patch };
    for (const fn of [...this.#listeners]) fn(this.#state, prev);
  }

  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  async #hmacKey() {
    return crypto.subtle.importKey(
      "raw",
      _enc.encode(this.#secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
  }

  async signToken(payload) {
    const header = _toB64Url(_enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
    const body = _toB64Url(_enc.encode(JSON.stringify(payload)));
    const input = `${header}.${body}`;
    const sigBuf = await crypto.subtle.sign("HMAC", await this.#hmacKey(), _enc.encode(input));
    return `${input}.${_toB64Url(new Uint8Array(sigBuf))}`;
  }

  async verifyToken(token, nowSec = 0) {
    if (typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [hB64, bB64, sB64] = parts;
    try {
      const header = JSON.parse(_dec.decode(_fromB64Url(hB64)));
      if (header?.alg !== "HS256") return null;
      const valid = await crypto.subtle.verify(
        "HMAC",
        await this.#hmacKey(),
        _fromB64Url(sB64),
        _enc.encode(`${hB64}.${bB64}`),
      );
      if (!valid) return null;
      const payload = JSON.parse(_dec.decode(_fromB64Url(bB64)));
      if (payload.exp !== undefined && nowSec >= payload.exp) return null;
      return payload;
    } catch {
      return null;
    }
  }

  render(node) {
    if (node === null || node === undefined || typeof node === "boolean") return "";
    if (typeof node === "string" || typeof node === "number") return _escHtml(String(node));
    if (Array.isArray(node)) return node.map((c) => this.render(c)).join("");
    if (typeof node.tag === "function") {
      return this.render(node.tag({ ...(node.props ?? {}), children: node.children ?? [] }));
    }
    const attrs = [];
    for (const k of Object.keys(node.props ?? {}).sort()) {
      const v = node.props[k];
      if (v === false || v === null || v === undefined) continue;
      attrs.push(v === true ? k : `${k}="${_escHtml(String(v))}"`);
    }
    const attrStr = attrs.length ? ` ${attrs.join(" ")}` : "";
    if (_VOID.has(node.tag)) return `<${node.tag}${attrStr} />`;
    const inner = (node.children ?? []).map((c) => this.render(c)).join("");
    return `<${node.tag}${attrStr}>${inner}</${node.tag}>`;
  }

  async handle(req) {
    const method = req.method.toUpperCase();
    const [pathname, rawQuery = ""] = req.path.split("?", 2);
    const query = Object.fromEntries(new URLSearchParams(rawQuery));
    const lowerHeaders = Object.fromEntries(
      Object.entries(req.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
    );
    let user = null;
    const auth = lowerHeaders.authorization;
    if (typeof auth === "string" && auth.startsWith("Bearer ")) {
      user = await this.verifyToken(auth.slice(7).trim(), req.nowSec ?? 0);
    }

    const ctx = {
      req,
      method,
      pathname,
      params: {},
      query,
      body: req.body,
      user,
      res: null,
      app: this,
    };

    const dispatchRoute = async (c) => {
      if (c.res !== null) return;
      const allowed = new Set();
      for (const r of this.#routes) {
        const params = _matchRoute(r.pattern, c.pathname);
        if (params === null) continue;
        if (r.method === c.method) {
          c.params = params;
          c.res = await r.handler(c);
          return;
        }
        allowed.add(r.method);
      }
      if (allowed.size > 0) {
        c.res = { status: 405, allow: [...allowed].sort(), body: { error: "Method Not Allowed" } };
      } else {
        c.res = { status: 404, body: { error: "Not Found" } };
      }
    };

    const stack = [...this.#middlewares, dispatchRoute];
    let last = -1;
    const runAt = async (i) => {
      if (i <= last) throw new Error("next() called multiple times");
      last = i;
      if (i >= stack.length) return;
      await stack[i](ctx, () => runAt(i + 1));
    };
    await runAt(0);
    return ctx.res;
  }
}
```

## Restored

The module bay is fully operational — your JavaScript mini framework integrates middleware, JWT auth, reactive state, and XSS-safe rendering end to end.
