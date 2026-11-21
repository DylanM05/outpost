---
id: fetch-all-pages
title: Fetch all pages
system: Client desk
symbol: instrument
scene: tests
skills: http, loops
---

## Briefing

Valley Station's catalog endpoint doesn't dump thousands of items in a single response — it returns one page at a time (`?page=1`, `?page=2`, ...) with a `"next_page"` field telling the client whether more pages exist. It also requires a Bearer token in the `Authorization` header. Write a client that collects every page cleanly.

## Objective

Write `fetch_catalog(transport, base_url, token)`.

`transport(method, url, headers=None, body=None)` is a callable representing the HTTP link. It returns a dict `{"status": int, "headers": dict, "body": str}`.

- Send `GET` requests starting at `f"{base_url.rstrip('/')}/items?page=1"` with headers `{"Authorization": f"Bearer {token}", "Accept": "application/json"}`.
- If `status == 401`, raise `PermissionError("unauthorized")`.
- If `status != 200`, raise `RuntimeError(f"http {status}")`.
- Each `200` body is JSON: `{"items": [...], "next_page": <int or None>}`.
- Collect all `"items"` across pages in order until `"next_page"` is `None`, then return the combined list.

```python
# Page 1 returns {"items": ["rope"], "next_page": 2}
# Page 2 returns {"items": ["fuel"], "next_page": None}
fetch_catalog(transport, "https://valley.local", "secret-key")
# ["rope", "fuel"]
```

## Concept

APIs paginate large collections so neither the server nor the client runs out of memory or bandwidth on one response. Passing a `transport` callable into your client function is also a clean engineering pattern (**dependency injection**): in production it calls a real socket; in tests it runs against a fast, deterministic fake server without touching the network.

Every authenticated request sends:

```python
headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/json",
}
```

## Hints

1. Start with `page = 1` and `collected = []`. Loop `while page is not None:`.
2. Build `url = f"{base_url.rstrip('/')}/items?page={page}"`, call `resp = transport("GET", url, headers=headers)`.
3. Check `resp["status"] == 401` -> raise `PermissionError`, `!= 200` -> raise `RuntimeError`. Otherwise parse `data = json.loads(resp["body"])`, extend `collected` with `data["items"]`, and set `page = data["next_page"]`.

## Starter: guided

```python
import json


def fetch_catalog(transport, base_url, token):
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    collected = []
    page = 1
    while page is not None:
        url = f"{base_url.rstrip('/')}/items?page={page}"
        resp = transport("GET", url, headers=headers)
        # Handle 401, non-200 errors, parse JSON, append items, and advance page.
        break
    return collected
```

## Starter: standard

```python
import json


def fetch_catalog(transport, base_url, token):
    return []
```

## Starter: challenge

```python
```

## Checks

```python
import json as _json

def _make_server(pages, expected_token="tok-1", fail_page=None, fail_status=500):
    seen = []
    def transport(method, url, headers=None, body=None):
        seen.append((method, url, headers or {}))
        auth = {k.lower(): v for k, v in (headers or {}).items()}.get("authorization")
        if auth != f"Bearer {expected_token}":
            return {"status": 401, "headers": {}, "body": '{"error":"bad token"}'}
        if method != "GET":
            return {"status": 405, "headers": {}, "body": ""}
        page = int(url.split("page=")[-1])
        if fail_page == page:
            return {"status": fail_status, "headers": {}, "body": '{"error":"boom"}'}
        data = pages[page - 1]
        nxt = page + 1 if page < len(pages) else None
        return {"status": 200, "headers": {"Content-Type": "application/json"}, "body": _json.dumps({"items": data, "next_page": nxt})}
    return transport, seen

t, seen = _make_server([["rope", "fuel"], ["flare"], ["battery", "wire"]])
expect("collects all 3 pages in order", lambda: get("fetch_catalog")(t, "https://valley.local/", "tok-1"), ["rope", "fuel", "flare", "battery", "wire"])
expect("sent 3 GET requests", lambda: len(seen), 3)
expect("sent Accept: application/json header", lambda: {k.lower(): v for k, v in seen[0][2].items()}.get("accept"), "application/json")
```

## Hidden checks

```python
t_bad, _ = _make_server([["rope"]], expected_token="right")
def _auth_fail():
    try:
        get("fetch_catalog")(t_bad, "https://valley.local", "wrong")
    except PermissionError:
        return "permission-error"
    return "no-error"
expect("401 raises PermissionError", _auth_fail, "permission-error")

t_err, _ = _make_server([["a"], ["b"]], fail_page=2, fail_status=500)
def _server_fail():
    try:
        get("fetch_catalog")(t_err, "https://valley.local", "tok-1")
    except RuntimeError:
        return "runtime-error"
    return "no-error"
expect("500 on page 2 raises RuntimeError", _server_fail, "runtime-error")

t_empty, _ = _make_server([[]])
expect("single empty page returns []", lambda: get("fetch_catalog")(t_empty, "https://valley.local", "tok-1"), [])
```

## Solution

```python
import json


def fetch_catalog(transport, base_url, token):
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    collected = []
    page = 1
    while page is not None:
        url = f"{base_url.rstrip('/')}/items?page={page}"
        resp = transport("GET", url, headers=headers)
        if resp["status"] == 401:
            raise PermissionError("unauthorized")
        if resp["status"] != 200:
            raise RuntimeError(f"http {resp['status']}")
        data = json.loads(resp["body"])
        collected.extend(data["items"])
        page = data["next_page"]
    return collected
```

## Restored

The client desk pages cleanly through Valley Station's catalog with Bearer credentials and stops immediately on an auth or server failure.
