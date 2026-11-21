---
id: deploy-the-exchange
title: Deploy the exchange
system: Operations desk
symbol: controller
scene: tests
skills: containers, observability, security
---

## Briefing

Wrap Kestrel Ridge's exchange handler in a single **production middleware** (`ProductionGateway`) before exposing it on the grid. Every request passes through the gateway on the way in and out: assigning a correlation `X-Request-Id`, enforcing rate limits, adding security headers, catching crashes without leaking stack traces, and writing a structured access log.

## Objective

Write `ProductionGateway(handler, rate_limiter, logger, allowed_origins=(), now_fn=lambda: 1000)` where `handle(self, request)` wraps `handler(request)` (which returns `{"status": int, "headers": dict, "body": str}`):

1. **Request ID:** read `X-Request-Id` (case-insensitive) from `request["headers"]`; if missing/empty, assign `f"req-{self._seq}"` (incrementing `1, 2, 3, ...`).
2. **Rate limiting:** read `client_id = request.get("client_id", "anon")`. Call `allowed, retry_after = self.rate_limiter.allow(client_id, self.now_fn())`. If not allowed, skip `handler` and build a `429` response with `{"error": "rate limited"}` and header `"Retry-After": str(retry_after)`.
3. **Crash containment:** if `handler(request)` raises any exception, catch it and build a `500` response `{"error": "internal error", "request_id": req_id}` — **never** include the raw exception text in the HTTP body!
4. **Response headers:** apply security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, plus `Access-Control-Allow-Origin` and `Vary: Origin` only if the request's `Origin` header is in `allowed_origins`) and always include `"X-Request-Id": req_id`.
5. **Structured log:** call `self.logger.log("ERROR" if status >= 500 else "INFO", "http_request", request_id=req_id, method=request["method"], path=request["path"], status=status)`.
6. Return the response dict.

## Concept

**Middleware** wraps cross-cutting production concerns around your business handlers so every single endpoint gets correlation IDs, rate limiting, security headers, safe `500` handling, and structured logging automatically — even when an endpoint crashes unexpectedly!

## Hints

1. Normalize incoming request headers once: `in_headers = {k.lower(): v for k, v in request.get("headers", {}).items()}`.
2. Keep `self._seq = 0` and only increment it (or always assign `req-{seq}`) when `X-Request-Id` isn't supplied.
3. Wrap `self.handler(request)` in `try ... except Exception:` and log/return the safe `500` JSON body with `request_id`.
4. Always apply security headers + `X-Request-Id` and log the request for **every** response (including `429` and `500`!).

## Starter: guided

```python
import json


class ProductionGateway:
    def __init__(self, handler, rate_limiter, logger, allowed_origins=(), now_fn=lambda: 1000):
        self.handler = handler
        self.rate_limiter = rate_limiter
        self.logger = logger
        self.allowed_origins = set(allowed_origins)
        self.now_fn = now_fn
        self._seq = 0

    def handle(self, request):
        in_headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
        req_id = in_headers.get("x-request-id") or ""
        if not req_id:
            self._seq += 1
            req_id = f"req-{self._seq}"

        # 1. Check rate_limiter.allow(client_id, self.now_fn()) -> 429 + Retry-After if blocked.
        # 2. Otherwise call self.handler(request) inside try/except -> safe 500 on crash.
        # 3. Apply security headers + CORS allowlist + X-Request-Id.
        # 4. Emit structured log and return response.
        return {"status": 500, "headers": {}, "body": ""}
```

## Starter: standard

```python
import json


class ProductionGateway:
    def __init__(self, handler, rate_limiter, logger, allowed_origins=(), now_fn=lambda: 1000):
        self.handler = handler
        self.rate_limiter = rate_limiter
        self.logger = logger
        self.allowed_origins = set(allowed_origins)
        self.now_fn = now_fn

    def handle(self, request):
        return self.handler(request)
```

## Starter: challenge

```python
```

## Checks

```python
import json as _json
from collections import deque as _dq

class _RL:
    def __init__(self, limit):
        self.limit = limit
        self.counts = {}
    def allow(self, cid, now):
        n = self.counts.get(cid, 0)
        if n < self.limit:
            self.counts[cid] = n + 1
            return (True, 0)
        return (False, 30)

class _Log:
    def __init__(self):
        self.records = []
    def log(self, level, event, **fields):
        self.records.append((level, event, fields))

def _handler(req):
    if req["path"] == "/boom":
        raise RuntimeError("sqlite password=topsecret failed")
    return {"status": 200, "headers": {"Content-Type": "application/json"}, "body": '{"ok":true}'}

log = _Log()
gw = get("ProductionGateway")(_handler, _RL(2), log, allowed_origins=["https://ridge.local"])

r1 = gw.handle({"method": "GET", "path": "/catalog", "headers": {"Origin": "https://ridge.local"}, "client_id": "ip-1"})
expect("normal 200 gets X-Request-Id, security headers, and allowed CORS", lambda: (r1["status"], r1["headers"].get("X-Request-Id"), r1["headers"].get("X-Content-Type-Options"), r1["headers"].get("Access-Control-Allow-Origin")), (200, "req-1", "nosniff", "https://ridge.local"))

r2 = gw.handle({"method": "GET", "path": "/boom", "headers": {"X-Request-Id": "trace-9"}, "client_id": "ip-1"})
expect("crash returns safe 500 without leaking raw exception message", lambda: (r2["status"], _json.loads(r2["body"]), "topsecret" not in r2["body"]), (500, {"error": "internal error", "request_id": "trace-9"}, True))

r3 = gw.handle({"method": "GET", "path": "/catalog", "headers": {}, "client_id": "ip-1"})
expect("3rd request hits 429 with Retry-After and security headers", lambda: (r3["status"], r3["headers"].get("Retry-After"), r3["headers"].get("X-Frame-Options")), (429, "30", "DENY"))

expect("logged all 3 requests with ERROR for 500 and INFO for 200/429", lambda: [(lvl, ev, f["status"]) for lvl, ev, f in log.records], [("INFO", "http_request", 200), ("ERROR", "http_request", 500), ("INFO", "http_request", 429)])
```

## Hidden checks

```python
r_evil = gw.handle({"method": "GET", "path": "/catalog", "headers": {"Origin": "https://evil.example"}, "client_id": "ip-2"})
expect("untrusted Origin gets no CORS header", lambda: "Access-Control-Allow-Origin" in r_evil["headers"], False)
expect("preserves HSTS header on 500 crash responses too", lambda: r2["headers"].get("Strict-Transport-Security"), "max-age=31536000; includeSubDomains")
```

## Solution

```python
import json


class ProductionGateway:
    def __init__(self, handler, rate_limiter, logger, allowed_origins=(), now_fn=lambda: 1000):
        self.handler = handler
        self.rate_limiter = rate_limiter
        self.logger = logger
        self.allowed_origins = set(allowed_origins)
        self.now_fn = now_fn
        self._seq = 0

    def _apply_headers(self, headers, req_id, origin):
        out = dict(headers)
        out["X-Request-Id"] = req_id
        out["X-Content-Type-Options"] = "nosniff"
        out["X-Frame-Options"] = "DENY"
        out["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        if origin and origin in self.allowed_origins:
            out["Access-Control-Allow-Origin"] = origin
            out["Vary"] = "Origin"
        return out

    def handle(self, request):
        in_headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
        req_id = in_headers.get("x-request-id") or ""
        if not req_id:
            self._seq += 1
            req_id = f"req-{self._seq}"
        origin = in_headers.get("origin")
        client_id = request.get("client_id", "anon")

        allowed, retry_after = self.rate_limiter.allow(client_id, self.now_fn())
        if not allowed:
            resp = {
                "status": 429,
                "headers": {"Content-Type": "application/json", "Retry-After": str(retry_after)},
                "body": json.dumps({"error": "rate limited"}),
            }
        else:
            try:
                resp = self.handler(request)
            except Exception:
                resp = {
                    "status": 500,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps({"error": "internal error", "request_id": req_id}),
                }

        resp = {
            "status": resp["status"],
            "headers": self._apply_headers(resp.get("headers", {}), req_id, origin),
            "body": resp.get("body", ""),
        }
        level = "ERROR" if resp["status"] >= 500 else "INFO"
        self.logger.log(
            level,
            "http_request",
            request_id=req_id,
            method=request["method"],
            path=request["path"],
            status=resp["status"],
        )
        return resp
```

## Restored

The Supply Exchange is now deployed behind Kestrel Ridge's production gateway — rate-limited, header-hardened, crash-contained, and logged end to end.
