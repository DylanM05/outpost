---
id: api-contract
title: Api contract
system: Webhook relay
symbol: instrument
scene: tests
skills: api-design, http
---

## Briefing

Bandwidth between Kestrel Ridge and Valley Station is slow, and Valley Station polls the catalog frequently even when nothing changed. HTTP **conditional caching** with `ETag` and `If-None-Match` lets the server hash the response body once and answer `304 Not Modified` with an empty body whenever the client already has the latest version.

## Objective

Write `serve_cached_json(request, data)`:

1. Serialize `data` deterministically with `body = json.dumps(data, sort_keys=True, separators=(",", ":"))`.
2. Compute a quoted ETag from the first 16 hex characters of its SHA-256 hash: `etag = f'"{hashlib.sha256(body.encode("utf-8")).hexdigest()[:16]}"'`.
3. Inspect the `If-None-Match` header (case-insensitive) from `request.get("headers", {})`:
   - If it equals `etag`, return `{"status": 304, "headers": {"ETag": etag}, "body": ""}`.
   - Otherwise return `{"status": 200, "headers": {"Content-Type": "application/json", "ETag": etag}, "body": body}`.

```python
r1 = serve_cached_json({"headers": {}}, [{"sku": "FUEL", "qty": 10}])
# r1["status"] == 200, r1["headers"]["ETag"] == '"..."'

r2 = serve_cached_json({"headers": {"If-None-Match": r1["headers"]["ETag"]}}, [{"sku": "FUEL", "qty": 10}])
# r2["status"] == 304, r2["body"] == ""
```

## Concept

HTTP caching headers save enormous bandwidth without changing a client's logic:

1. Server sends `ETag: "a1b2c3..."` (a fingerprint of the exact response representation).
2. Next time, the client sends `If-None-Match: "a1b2c3..."`.
3. If the data hasn't changed, the server sends **`304 Not Modified`** with no body; if even one number changed, the ETag changes and the server sends `200 OK` with the fresh body and new ETag.

Because JSON object key order can vary, sorting keys (`sort_keys=True`) ensures identical data always produces the exact same ETag.

## Hints

1. `body = json.dumps(data, sort_keys=True, separators=(",", ":"))`.
2. `etag = f'"{hashlib.sha256(body.encode("utf-8")).hexdigest()[:16]}"'` — note the double quotes around the hex hash, as required by HTTP ETags.
3. Compare `headers.get("if-none-match", "").strip() == etag`.

## Starter: guided

```python
import hashlib
import json


def serve_cached_json(request, data):
    body = json.dumps(data, sort_keys=True, separators=(",", ":"))
    etag = f'"{hashlib.sha256(body.encode("utf-8")).hexdigest()[:16]}"'
    headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
    # Return 304 with empty body if If-None-Match matches etag, else 200 with body.
    return {"status": 200, "headers": {"Content-Type": "application/json"}, "body": body}
```

## Starter: standard

```python
import hashlib
import json


def serve_cached_json(request, data):
    return {"status": 200, "headers": {}, "body": ""}
```

## Starter: challenge

```python
```

## Checks

```python
r1 = get("serve_cached_json")({"headers": {}}, {"b": 2, "a": 1})
expect("first request returns 200 and sorted compact JSON", lambda: (r1["status"], r1["body"], r1["headers"].get("Content-Type")), (200, '{"a":1,"b":2}', "application/json"))
etag = r1["headers"].get("ETag", "")
check("ETag is a quoted 16-char hex digest", lambda: len(etag) == 18 and etag.startswith('"') and etag.endswith('"'))

r2 = get("serve_cached_json")({"headers": {"If-None-Match": etag}}, {"a": 1, "b": 2})
expect("matching If-None-Match returns 304 with empty body", lambda: (r2["status"], r2["body"], r2["headers"].get("ETag")), (304, "", etag))

r3 = get("serve_cached_json")({"headers": {"If-None-Match": etag}}, {"a": 1, "b": 3})
expect("changed data returns 200 with a new ETag", lambda: (r3["status"], r3["headers"].get("ETag") != etag), (200, True))
```

## Hidden checks

```python
r4 = get("serve_cached_json")({"headers": {"if-none-match": etag}}, {"b": 2, "a": 1})
expect("lowercase if-none-match header works", lambda: r4["status"], 304)
```

## Solution

```python
import hashlib
import json


def serve_cached_json(request, data):
    body = json.dumps(data, sort_keys=True, separators=(",", ":"))
    etag = f'"{hashlib.sha256(body.encode("utf-8")).hexdigest()[:16]}"'
    headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
    if headers.get("if-none-match", "").strip() == etag:
        return {"status": 304, "headers": {"ETag": etag}, "body": ""}
    return {
        "status": 200,
        "headers": {"Content-Type": "application/json", "ETag": etag},
        "body": body,
    }
```

## Restored

Unchanged catalog polls now answer with a tiny `304 Not Modified`, cutting radio traffic across the pass.
