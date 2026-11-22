---
id: express-router
language: javascript
title: Build an Express-style HTTP router with path parameters and 405 detection
system: Router rack
symbol: equipment
scene: tests
skills: js-web-apis
---

## Briefing

Node.js web frameworks like Express, Fastify, and Hono register routes like `router.get("/drones/:id/logs/:day", handler)`, extract named `:params` from incoming URLs, and distinguish `404 Not Found` (unknown path) from `405 Method Not Allowed` (path matched, wrong HTTP method)!

## Concept

Implement `class Router`:
- `add(method, pattern, handler)` (plus shorthand `get(pattern, handler)` and `post(pattern, handler)`).
- Normalize `method.toUpperCase()`.
- **`async dispatch(req)`** where `req` is `{ method, path, body? }`:
  - Strip query string from `req.path` (parsing query string into `req.query` via `Object.fromEntries(new URLSearchParams(...))`!).
  - Match registered routes in registration order by splitting pattern and path on `"/"` (ignoring empty leading/trailing segments):
    - A segment starting with `":"` matches any single non-empty segment and captures `params[seg.slice(1)] = decodeURIComponent(actual)`.
    - Literal segments must match strictly (`seg === actual`).
  - If a route matches both **path AND method**: invoke `await handler({ ...req, params, query })` and return its result!
  - If at least one route matched the **path** with a different method -> return `{ status: 405, allow: sortedUniqueMethods, body: { error: "Method Not Allowed" } }`!
  - Otherwise -> return `{ status: 404, body: { error: "Not Found" } }`!

## Objective

Implement `class Router` with `add`, `get`, `post`, and `async dispatch(req)`.

## Hints

1. Split path segments cleanly with `const splitPath = (p) => p.split("/").filter(Boolean);`.
2. Track `allowedMethods = new Set()` as you scan routes: if path matches but method doesn't, record `route.method` and keep scanning in case a later route handles that method!

## Starter: guided

```javascript
class Router {
  #routes = [];

  add(method, pattern, handler) {
    this.#routes.push({ method: method.toUpperCase(), pattern, handler });
    return this;
  }

  get(pattern, handler) {
    return this.add("GET", pattern, handler);
  }

  post(pattern, handler) {
    return this.add("POST", pattern, handler);
  }

  async dispatch(req) {
    // Parse path + query, match :param segments, handle 200/405/404.
  }
}
```

## Starter: standard

```javascript
class Router {
  add(method, pattern, handler) {}
  get(pattern, handler) {}
  post(pattern, handler) {}
  async dispatch(req) {}
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
await expect("matches :params, parses query string, and distinguishes 405 vs 404", async () => {
  const r = new (get("Router"))();
  r.get("/drones/:id", async (req) => ({ status: 200, body: { id: req.params.id, q: req.query } }));
  r.post("/drones/:id", async (req) => ({ status: 201, body: { id: req.params.id, body: req.body } }));

  const r1 = await r.dispatch({ method: "get", path: "/drones/kestrel-1?verbose=1" });
  const r2 = await r.dispatch({ method: "DELETE", path: "/drones/kestrel-1" });
  const r3 = await r.dispatch({ method: "GET", path: "/unknown/path" });
  return { r1, r2, r3 };
}, {
  r1: { status: 200, body: { id: "kestrel-1", q: { verbose: "1" } } },
  r2: { status: 405, allow: ["GET", "POST"], body: { error: "Method Not Allowed" } },
  r3: { status: 404, body: { error: "Not Found" } },
});
```

## Hidden checks

```javascript
await expect("decodes URI-encoded params and handles root / route", async () => {
  const r = new (get("Router"))();
  r.get("/", () => ({ status: 200, body: "root" }));
  r.get("/files/:name", (req) => ({ status: 200, body: req.params.name }));
  return [
    await r.dispatch({ method: "GET", path: "/" }),
    await r.dispatch({ method: "GET", path: "/files/hello%20world.txt" }),
  ];
}, [
  { status: 200, body: "root" },
  { status: 200, body: "hello world.txt" },
]);
```

## Solution

```javascript
function splitSegs(pathname) {
  return pathname.split("/").filter(Boolean);
}

function matchPattern(pattern, pathname) {
  const pSegs = splitSegs(pattern);
  const aSegs = splitSegs(pathname);
  if (pSegs.length !== aSegs.length) return null;
  const params = {};
  for (let i = 0; i < pSegs.length; i++) {
    if (pSegs[i].startsWith(":")) {
      params[pSegs[i].slice(1)] = decodeURIComponent(aSegs[i]);
    } else if (pSegs[i] !== aSegs[i]) {
      return null;
    }
  }
  return params;
}

class Router {
  #routes = [];

  add(method, pattern, handler) {
    this.#routes.push({ method: method.toUpperCase(), pattern, handler });
    return this;
  }

  get(pattern, handler) {
    return this.add("GET", pattern, handler);
  }

  post(pattern, handler) {
    return this.add("POST", pattern, handler);
  }

  async dispatch(req) {
    const method = req.method.toUpperCase();
    const [pathname, rawQuery = ""] = req.path.split("?", 2);
    const query = Object.fromEntries(new URLSearchParams(rawQuery));
    const allowed = new Set();

    for (const route of this.#routes) {
      const params = matchPattern(route.pattern, pathname);
      if (params === null) continue;
      if (route.method === method) {
        return await route.handler({ ...req, method, params, query });
      }
      allowed.add(route.method);
    }

    if (allowed.size > 0) {
      return { status: 405, allow: [...allowed].sort(), body: { error: "Method Not Allowed" } };
    }
    return { status: 404, body: { error: "Not Found" } };
  }
}
```

## Restored

The router rack now dispatches parameterized JavaScript HTTP routes with full query parsing and `405` detection.
