---
id: match-the-route
kind: predict
title: Match the route
system: Route switchboard
symbol: controller
scene: console
skills: api-design, reading-code
---

## Briefing

Now flip to the server side of the wire. When an HTTP request arrives at an API server, a **router** inspects its HTTP method and path (ignoring the query string), extracts any named path parameters like `{sku}`, and calls the matching handler. If no route matches the path, the server returns `404 Not Found`; if the path exists for a *different* method, it returns `405 Method Not Allowed`. Trace what this tiny router returns for three requests.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

Path templates like `"/supplies/{sku}"` match segment by segment:

- Split both pattern and path on `"/"`.
- They must have the same number of segments.
- A segment wrapped in `{...}` captures whatever text is in that slot as a parameter (`{"sku": "FUEL-1"}`).
- Every other segment must match literally.

Strip the `?query` part of the path before matching routes, so `GET /supplies/FUEL-1?detail=1` still matches `"/supplies/{sku}"`.

## Hints

1. First call: `GET /supplies/FUEL-1` matches `("GET", "/supplies/{sku}")` with `params = {"sku": "FUEL-1"}`.
2. Second call: `DELETE /supplies/FUEL-1` matches the *path* `"/supplies/{sku}"`, but not the method `"DELETE"` -> `405`.
3. Third call: `GET /unknown` matches no path at all -> `404`.

## Program

```python
def match_pattern(pattern, path):
    p_parts = pattern.strip("/").split("/")
    u_parts = path.strip("/").split("/")
    if len(p_parts) != len(u_parts):
        return None
    params = {}
    for p, u in zip(p_parts, u_parts):
        if p.startswith("{") and p.endswith("}"):
            params[p[1:-1]] = u
        elif p != u:
            return None
    return params


routes = [("GET", "/supplies/{sku}")]


def handle(method, path):
    path_only = path.split("?", 1)[0]
    path_matched = False
    for r_method, pattern in routes:
        params = match_pattern(pattern, path_only)
        if params is not None:
            path_matched = True
            if r_method == method:
                return (200, params)
    return (405, {}) if path_matched else (404, {})


print(handle("GET", "/supplies/FUEL-1?full=1"))
print(handle("DELETE", "/supplies/FUEL-1"))
print(handle("GET", "/missing"))
```

## Output

```text
(200, {'sku': 'FUEL-1'})
(405, {})
(404, {})
```

## Restored

You traced segment matching, parameter capture, and the difference between `404 Not Found` and `405 Method Not Allowed`.
