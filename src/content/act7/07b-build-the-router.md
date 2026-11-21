---
id: build-the-router
title: Build the router
system: Route switchboard
symbol: controller
scene: tests
skills: api-design, classes
---

## Briefing

Every web framework — Flask, FastAPI, Go's `http.ServeMux` — has a router at its core. Build Kestrel Ridge's `Router` class so any HTTP request dict is routed to the right handler, with path parameters extracted and JSON responses formatted cleanly.

## Objective

Write a `Router` class with:

- `add_route(self, method, pattern, handler)`: registers `handler` for HTTP `method` (uppercase, e.g. `"GET"`, `"POST"`) and path `pattern` (e.g. `"/health"`, `"/supplies/{sku}"`).
- `dispatch(self, request)`: takes a dict `{"method": str, "path": str, "headers": dict, "body": str}` (where `"headers"` and `"body"` may be omitted) and returns a response dict `{"status": int, "headers": dict, "body": str}`:
  - Strip any `?query` from `request["path"]` before matching (still pass the full `request` to the handler!).
  - If a route matches both path and method, call `handler(request, params)` which returns `(status, data)` (a Python object to JSON-encode, or `None` for an empty body such as `204`). Return `{"status": status, "headers": {"Content-Type": "application/json"}, "body": "" if data is None else json.dumps(data)}`.
  - If at least one route matches the path with a **different** method, return `status = 405`, `headers = {"Content-Type": "application/json", "Allow": ", ".join(sorted(allowed_methods))}`, and JSON body `{"error": "method not allowed"}`.
  - If no route matches the path, return `status = 404`, `headers = {"Content-Type": "application/json"}`, and JSON body `{"error": "not found"}`.

```python
r = Router()
r.add_route("GET", "/supplies/{sku}", lambda req, params: (200, {"sku": params["sku"]}))
r.dispatch({"method": "GET", "path": "/supplies/FUEL-1"})
# {"status": 200, "headers": {"Content-Type": "application/json"}, "body": '{"sku": "FUEL-1"}'}
```

## Concept

Separating **routing** (matching URLs, methods, and serializing responses) from **handlers** (business logic) keeps an API easy to grow and test.

One subtle case to handle cleanly: the root path `"/"`! `"".split("/")` gives `[""]`, and `"/".strip("/")` is `""`, so make sure `"/"` matches `"/"` and does **not** accidentally match `"/health"` (both have `len(strip("/").split("/")) == 1` if you aren't careful!). Split cleanly:

```python
def _segments(path):
    stripped = path.strip("/")
    return [] if not stripped else stripped.split("/")
```

With `_segments`, `"/"` is `[]` (length 0), while `"/health"` is `["health"]` (length 1).

## Hints

1. Use `_segments(path)` returning `[]` for `"/"` and `path.strip("/").split("/")` otherwise.
2. In `dispatch(request)`: split `path_only = request["path"].split("?", 1)[0]`, normalize `method = request["method"].upper()`.
3. Track `allowed = set()` for every route whose pattern matches `path_only`. If a route also matches `method`, call `handler(request, params)` and return the formatted response. After the loop, return `405` (with `"Allow"`) if `allowed` is non-empty, else `404`.

## Starter: guided

```python
import json


def _segments(path):
    stripped = path.strip("/")
    return [] if not stripped else stripped.split("/")


def _match(pattern, path):
    p_parts = _segments(pattern)
    u_parts = _segments(path)
    if len(p_parts) != len(u_parts):
        return None
    params = {}
    for p, u in zip(p_parts, u_parts):
        if p.startswith("{") and p.endswith("}"):
            params[p[1:-1]] = u
        elif p != u:
            return None
    return params


class Router:
    def __init__(self):
        self._routes = []

    def add_route(self, method, pattern, handler):
        self._routes.append((method.upper(), pattern, handler))

    def dispatch(self, request):
        method = request["method"].upper()
        path_only = request["path"].split("?", 1)[0]
        allowed = set()
        # Match against self._routes, call handler(request, params), or return 405 / 404.
        return {
            "status": 404,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "not found"}),
        }
```

## Starter: standard

```python
import json


class Router:
    def __init__(self):
        self._routes = []

    def add_route(self, method, pattern, handler):
        pass

    def dispatch(self, request):
        return {"status": 404, "headers": {}, "body": ""}
```

## Starter: challenge

```python
```

## Checks

```python
import json as _json

r = get("Router")()
r.add_route("GET", "/", lambda req, p: (200, {"service": "exchange"}))
r.add_route("GET", "/supplies/{sku}", lambda req, p: (200, {"sku": p["sku"]}))
r.add_route("POST", "/supplies/{sku}", lambda req, p: (201, {"updated": p["sku"]}))
r.add_route("DELETE", "/supplies/{sku}", lambda req, p: (204, None))

resp_root = r.dispatch({"method": "GET", "path": "/"})
expect("GET / matches root", lambda: (resp_root["status"], _json.loads(resp_root["body"])), (200, {"service": "exchange"}))

resp_get = r.dispatch({"method": "GET", "path": "/supplies/FUEL-1?brief=1"})
expect("GET /supplies/FUEL-1 extracts sku", lambda: (resp_get["status"], _json.loads(resp_get["body"]), resp_get["headers"].get("Content-Type")), (200, {"sku": "FUEL-1"}, "application/json"))

resp_405 = r.dispatch({"method": "PUT", "path": "/supplies/FUEL-1"})
expect("PUT /supplies/FUEL-1 returns 405 with Allow header", lambda: (resp_405["status"], resp_405["headers"].get("Allow")), (405, "DELETE, GET, POST"))

resp_404 = r.dispatch({"method": "GET", "path": "/missing"})
expect("GET /missing returns 404", lambda: resp_404["status"], 404)
```

## Hidden checks

```python
resp_204 = r.dispatch({"method": "DELETE", "path": "/supplies/FUEL-1"})
expect("204 with None data returns empty body", lambda: (resp_204["status"], resp_204["body"]), (204, ""))

resp_root_404 = r.dispatch({"method": "GET", "path": "/other"})
expect("/ does not accidentally match /other", lambda: resp_root_404["status"], 404, "Make sure '/' splits to an empty segment list, not [''].")

r.add_route("GET", "/depots/{depot}/items/{item}", lambda req, p: (200, p))
resp_multi = r.dispatch({"method": "get", "path": "/depots/north/items/rope"})
expect("multiple params and lowercase method", lambda: (resp_multi["status"], _json.loads(resp_multi["body"])), (200, {"depot": "north", "item": "rope"}))
```

## Solution

```python
import json


def _segments(path):
    stripped = path.strip("/")
    return [] if not stripped else stripped.split("/")


def _match(pattern, path):
    p_parts = _segments(pattern)
    u_parts = _segments(path)
    if len(p_parts) != len(u_parts):
        return None
    params = {}
    for p, u in zip(p_parts, u_parts):
        if p.startswith("{") and p.endswith("}"):
            params[p[1:-1]] = u
        elif p != u:
            return None
    return params


class Router:
    def __init__(self):
        self._routes = []

    def add_route(self, method, pattern, handler):
        self._routes.append((method.upper(), pattern, handler))

    def dispatch(self, request):
        method = request["method"].upper()
        path_only = request["path"].split("?", 1)[0]
        allowed = set()
        for r_method, pattern, handler in self._routes:
            params = _match(pattern, path_only)
            if params is not None:
                allowed.add(r_method)
                if r_method == method:
                    status, data = handler(request, params)
                    return {
                        "status": status,
                        "headers": {"Content-Type": "application/json"},
                        "body": "" if data is None else json.dumps(data),
                    }
        if allowed:
            return {
                "status": 405,
                "headers": {
                    "Content-Type": "application/json",
                    "Allow": ", ".join(sorted(allowed)),
                },
                "body": json.dumps({"error": "method not allowed"}),
            }
        return {
            "status": 404,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "not found"}),
        }
```

## Restored

The route switchboard dispatches paths, captures parameters, encodes JSON, and returns accurate `404` and `405` responses.
