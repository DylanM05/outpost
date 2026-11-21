---
id: verify-the-contract
title: Verify the contract
system: Review bench
symbol: controller
scene: tests
skills: architecture, api-design
---

## Briefing

Documentation that drifts out of sync with the live API is worse than no documentation at all: operators read a stale README and call endpoints that were renamed months ago. Build a contract auditor that compares your live registered routes against your API specification and flags every drift automatically in CI.

## Objective

Write `audit_api_docs(routes, docs)`.

- `routes` is a list of live route dicts: `{"method": str, "path": str, "auth": bool}`.
- `docs` is a list of documented endpoint dicts: `{"method": str, "path": str, "auth": bool, "statuses": [int, ...]}`.
- Compare `(method.upper(), path)` across both lists and return a dict of sorted issue lists:
  - `"undocumented"`: `f"{METHOD} {path}"` for every live route missing from `docs`.
  - `"stale"`: `f"{METHOD} {path}"` for every documented endpoint not in `routes`.
  - `"auth_mismatch"`: `f"{METHOD} {path}"` for any route present in both where `route["auth"] != doc["auth"]`.
  - `"missing_401"`: `f"{METHOD} {path}"` for any route present in both where `route["auth"]` is `True` and `401` is not in `doc.get("statuses", [])`.

```python
audit_api_docs(
    [{"method": "GET", "path": "/healthz", "auth": False}, {"method": "POST", "path": "/orders", "auth": True}],
    [{"method": "POST", "path": "/orders", "auth": True, "statuses": [201, 400]}],
)
# {
#   "undocumented": ["GET /healthz"],
#   "stale": [],
#   "auth_mismatch": [],
#   "missing_401": ["POST /orders"],
# }
```

## Concept

**Contract testing** treats documentation as verifiable code instead of prose written once and forgotten. Running `audit_api_docs` in CI guarantees every new endpoint is documented, deleted endpoints are cleaned up, and every authenticated route documents its `401` failure contract.

## Hints

1. Key both lists by `key = (item["method"].upper(), item["path"])` and format labels as `f"{m} {p}"`.
2. `undocumented` = keys in `live_map` but not `doc_map`; `stale` = keys in `doc_map` but not `live_map`.
3. For keys in both maps, check `live["auth"] != doc["auth"]` and `live["auth"] and 401 not in doc.get("statuses", [])`.

## Starter: guided

```python
def audit_api_docs(routes, docs):
    live_map = {(r["method"].upper(), r["path"]): r for r in routes}
    doc_map = {(d["method"].upper(), d["path"]): d for d in docs}
    # Compute sorted undocumented, stale, auth_mismatch, and missing_401 lists.
    return {
        "undocumented": [],
        "stale": [],
        "auth_mismatch": [],
        "missing_401": [],
    }
```

## Starter: standard

```python
def audit_api_docs(routes, docs):
    return {"undocumented": [], "stale": [], "auth_mismatch": [], "missing_401": []}
```

## Starter: challenge

```python
```

## Checks

```python
routes = [
    {"method": "GET", "path": "/healthz", "auth": False},
    {"method": "POST", "path": "/orders", "auth": True},
    {"method": "DELETE", "path": "/orders/{id}", "auth": True},
]
docs = [
    {"method": "POST", "path": "/orders", "auth": True, "statuses": [201, 400]},
    {"method": "DELETE", "path": "/orders/{id}", "auth": False, "statuses": [204, 401]},
    {"method": "GET", "path": "/legacy", "auth": False, "statuses": [200]},
]
expect(
    "detects undocumented, stale, auth_mismatch, and missing_401",
    lambda: get("audit_api_docs")(routes, docs),
    {
        "undocumented": ["GET /healthz"],
        "stale": ["GET /legacy"],
        "auth_mismatch": ["DELETE /orders/{id}"],
        "missing_401": ["POST /orders"],
    },
)
```

## Hidden checks

```python
clean_routes = [{"method": "get", "path": "/items", "auth": True}]
clean_docs = [{"method": "GET", "path": "/items", "auth": True, "statuses": [200, 401]}]
expect(
    "clean case-insensitive match returns all empty lists",
    lambda: get("audit_api_docs")(clean_routes, clean_docs),
    {"undocumented": [], "stale": [], "auth_mismatch": [], "missing_401": []},
)
```

## Solution

```python
def audit_api_docs(routes, docs):
    live_map = {(r["method"].upper(), r["path"]): r for r in routes}
    doc_map = {(d["method"].upper(), d["path"]): d for d in docs}

    label = lambda k: f"{k[0]} {k[1]}"

    undocumented = sorted(label(k) for k in live_map if k not in doc_map)
    stale = sorted(label(k) for k in doc_map if k not in live_map)
    auth_mismatch = sorted(
        label(k) for k in live_map if k in doc_map and live_map[k]["auth"] != doc_map[k]["auth"]
    )
    missing_401 = sorted(
        label(k)
        for k in live_map
        if k in doc_map and live_map[k]["auth"] and 401 not in doc_map[k].get("statuses", [])
    )
    return {
        "undocumented": undocumented,
        "stale": stale,
        "auth_mismatch": auth_mismatch,
        "missing_401": missing_401,
    }
```

## Restored

API documentation is checked against the live router on every build — no more stale endpoints or undocumented `401` walls.
