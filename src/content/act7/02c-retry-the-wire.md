---
id: retry-the-wire
title: Retry the wire
system: Client desk
symbol: instrument
scene: tests
skills: http, errors
---

## Briefing

Mountain radio links drop packets and return `503 Service Unavailable` or `429 Too Many Requests` when Valley Station is busy. Retrying a `503` makes sense; retrying a `400 Bad Request` or `404 Not Found` just wastes airtime on a request that will never succeed. Build a JSON request helper that retries only transient errors and sends proper `Content-Type` headers on writes.

## Objective

Write `request_json(transport, method, url, payload=None, headers=None, max_attempts=3)`.

- Copy `headers` (or start with `{}`) without mutating the caller's dict.
- If `payload is not None`, serialize it with `json.dumps(payload)` as `body` and set `"Content-Type": "application/json"` on the outgoing headers. Otherwise pass `body=None`.
- Call `transport(method, url, headers=out_headers, body=body)` up to `max_attempts` times:
  - Retry **only** if `status` is `429` or `500 <= status < 600`.
  - Stop immediately on any `2xx` or any other `4xx` status!
- Return `(status, parsed_body)` where `parsed_body` is `None` if the response body is empty (`""`) or `status == 204`, otherwise `json.loads(resp["body"])`.

```python
# First call returns 503, second returns 201 with '{"id": 7}':
request_json(transport, "POST", "https://valley.local/orders", payload={"sku": "FUEL", "qty": 2})
# (201, {"id": 7})
```

## Concept

HTTP methods carry meaning about what you're doing:

- `GET`: read a resource (no body).
- `POST`: create a new resource (JSON body, typically returns `201 Created`).
- `PUT`: replace a resource (JSON body, `200 OK` or `204 No Content`).
- `DELETE`: remove a resource (often returns `204 No Content` with an empty body).

Retrying blindly on `4xx` errors floods the server with broken requests. Retrying only on `429` and `5xx` (up to `max_attempts`) recovers from brief blips without hammering the link.

## Hints

1. Make `out_headers = dict(headers) if headers else {}` so you don't mutate the caller's dict.
2. Encode `body = json.dumps(payload)` and set `out_headers["Content-Type"] = "application/json"` when `payload is not None`.
3. Loop `for attempt in range(max_attempts):`, call `transport`, and `break` unless `status == 429 or 500 <= status < 600`.
4. After the loop, parse `resp["body"]` with `json.loads` unless `status == 204` or `not resp["body"]`.

## Starter: guided

```python
import json


def request_json(transport, method, url, payload=None, headers=None, max_attempts=3):
    out_headers = dict(headers) if headers else {}
    body = None
    if payload is not None:
        body = json.dumps(payload)
        out_headers["Content-Type"] = "application/json"

    resp = None
    for _ in range(max_attempts):
        resp = transport(method, url, headers=out_headers, body=body)
        status = resp["status"]
        # Break unless status is 429 or 5xx.
        break

    status = resp["status"]
    if status == 204 or not resp["body"]:
        return (status, None)
    return (status, json.loads(resp["body"]))
```

## Starter: standard

```python
import json


def request_json(transport, method, url, payload=None, headers=None, max_attempts=3):
    return (0, None)
```

## Starter: challenge

```python
```

## Checks

```python
import json as _json

def _scripted(responses):
    calls = []
    it = iter(responses)
    def transport(method, url, headers=None, body=None):
        calls.append((method, url, dict(headers or {}), body))
        return next(it)
    return transport, calls

t1, c1 = _scripted([
    {"status": 503, "headers": {}, "body": '{"error":"busy"}'},
    {"status": 429, "headers": {}, "body": '{"error":"slow down"}'},
    {"status": 201, "headers": {}, "body": '{"id": 7}'},
])
caller_headers = {"Authorization": "Bearer abc"}
expect(
    "retries 503 and 429 and succeeds on 3rd attempt",
    lambda: get("request_json")(t1, "POST", "https://valley.local/orders", payload={"sku": "FUEL", "qty": 2}, headers=caller_headers),
    (201, {"id": 7}),
)
expect("made 3 attempts", lambda: len(c1), 3)
expect("sent Content-Type: application/json and JSON body", lambda: (c1[0][2].get("Content-Type"), _json.loads(c1[0][3])), ("application/json", {"sku": "FUEL", "qty": 2}))
expect("did not mutate caller headers", lambda: caller_headers, {"Authorization": "Bearer abc"})

t2, c2 = _scripted([
    {"status": 404, "headers": {}, "body": '{"error":"missing"}'},
    {"status": 200, "headers": {}, "body": '{"should":"never reach"}'},
])
expect("does NOT retry 404", lambda: (get("request_json")(t2, "GET", "https://valley.local/x"), len(c2)), ((404, {"error": "missing"}), 1))
```

## Hidden checks

```python
t3, c3 = _scripted([{"status": 204, "headers": {}, "body": ""}])
expect("handles 204 No Content with empty body", lambda: get("request_json")(t3, "DELETE", "https://valley.local/orders/7"), (204, None))
expect("DELETE without payload sends body=None", lambda: c3[0][3], None)

t4, c4 = _scripted([
    {"status": 500, "headers": {}, "body": '{"error":"down"}'},
    {"status": 502, "headers": {}, "body": '{"error":"bad gw"}'},
])
expect("stops after max_attempts=2 and returns last error", lambda: (get("request_json")(t4, "GET", "https://valley.local/x", max_attempts=2), len(c4)), ((502, {"error": "bad gw"}), 2))

t5, c5 = _scripted([{"status": 400, "headers": {}, "body": '{"error":"bad"}'}])
expect("does NOT retry 400", lambda: (get("request_json")(t5, "POST", "https://valley.local/x", payload={}), len(c5)), ((400, {"error": "bad"}), 1))
```

## Solution

```python
import json


def request_json(transport, method, url, payload=None, headers=None, max_attempts=3):
    out_headers = dict(headers) if headers else {}
    body = None
    if payload is not None:
        body = json.dumps(payload)
        out_headers["Content-Type"] = "application/json"

    resp = None
    for _ in range(max_attempts):
        resp = transport(method, url, headers=out_headers, body=body)
        status = resp["status"]
        if status != 429 and not (500 <= status < 600):
            break

    status = resp["status"]
    if status == 204 or not resp["body"]:
        return (status, None)
    return (status, json.loads(resp["body"]))
```

## Restored

The client desk rides through brief radio blips automatically and fails immediately on real client mistakes.
