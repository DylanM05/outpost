---
id: fix-the-outage
title: Fix the outage
system: Incident room
symbol: controller
scene: tests
skills: config, observability, security, reliability, sql
assessment: true
---

## Briefing

Alerts just lit up the incident room: the deployed exchange is returning `500` errors on `/orders`, leaking signing secrets into logs, accepting path traversal on `/exports/...`, and letting an attacker hammer `/login` without throttling.

Diagnose the outage from the production logs, then fix all four defects inside `ProductionService` without breaking healthy endpoints.

This is an independent mission. Hints unlock after your second submission. Use everything you've learned across the grid.

## Objective

Complete two deliverables in the starter file:

1. **`diagnose_incident(log_lines)`**: given a list of JSON log line strings (each with `"request_id"`, `"path"`, `"status"`, and optional `"secret"` or `"headers"`), return a dict:
   - `"error_count"`: count of entries with `500 <= status < 600`.
   - `"top_failing_path"`: the `"path"` with the most `5xx` errors (breaking ties alphabetically, or `None` if no `5xx` errors).
   - `"first_error_request_id"`: the `"request_id"` of the first `5xx` entry in `log_lines` (or `None`).
   - `"leaked_secret_count"`: count of log lines where `"api_secret"` or `"authorization"` appears as a key with a value other than `"[REDACTED]"` (check both top-level keys and nested `"headers"` dict, case-insensitive).
2. **Fix all four production bugs in `ProductionService(env, conn, files, now_fn=lambda: 1000)`**:
   - **Startup config & secret redaction:** require `API_SECRET` in `env` to be at least 16 chars (raise `ValueError` if missing/short — never fall back to `"dev-secret"`!), and never log raw `API_SECRET` or `Authorization` values (always store `"[REDACTED]"` in `self.logs`).
   - **Migrations & readiness:** run idempotent schema creation (`orders (id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT NOT NULL)`) inside `start()`, and make `GET /readyz` return `503` (not `200`!) if `orders` does not exist yet or `self.shutting_down` is `True`.
   - **Path traversal on `GET /exports/<name>`:** reject any path that escapes `/srv/exports/` (`..`, leading `/`, sibling prefix) with `400` instead of reading arbitrary files from `self.files`.
   - **Rate limiting, crash containment, and security headers:** rate-limit `POST /login` to **3 requests per 60 seconds** per `client_id` (returning `429` with `"Retry-After"`), catch unexpected handler errors returning `500` with `{"error": "internal error"}` (never leaking raw exception text), and attach `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY` to every response.

## Concept

Real incident response follows a clear loop:

1. **Triage from telemetry** (`diagnose_incident`): locate the failing endpoint, first failing `request_id`, and any secret leakage.
2. **Contain & repair root causes**: fail-fast config + log redaction, real readiness + migrations, strict `safe_join` on file exports, per-client sliding-window rate limiting on login, and crash containment with security headers.

## Hints

1. For `diagnose_incident`, parse each JSON line, track `5xx` counts per path, remember the first `5xx` `request_id`, and scan each entry's keys (and `entry.get("headers", {})`) for `"api_secret"` / `"authorization"` whose value != `"[REDACTED]"`.
2. In `ProductionService.__init__`: validate `len(env.get("API_SECRET", "").strip()) >= 16` (raising `ValueError` otherwise), and log startup with `api_secret="[REDACTED]"`.
3. In `GET /exports/<name>`: normalize `/srv/exports` + relative path and require `not rel.startswith(("/", "\\"))` and `target.startswith("/srv/exports/")`, returning `400` if invalid and `404` if not in `self.files`.
4. Add a sliding-window `deque` rate limiter (`limit=3, window=60`) on `POST /login`, wrap dispatch in `try/except` returning `500 {"error": "internal error"}`, and attach `X-Content-Type-Options` and `X-Frame-Options` on every response.

## Starter

```python
from collections import deque
import json
import math
import os


def diagnose_incident(log_lines):
    return {
        "error_count": 0,
        "top_failing_path": None,
        "first_error_request_id": None,
        "leaked_secret_count": 0,
    }


class ProductionService:
    def __init__(self, env, conn, files, now_fn=lambda: 1000):
        # BUG 1: silently falls back to weak hardcoded secret and logs it in plaintext!
        self.secret = env.get("API_SECRET", "dev-secret")
        self.conn = conn
        self.files = files
        self.now_fn = now_fn
        self.shutting_down = False
        self.logs = []
        self.logs.append(json.dumps({"event": "startup", "api_secret": self.secret}))

    def start(self):
        # BUG 2: doesn't create the orders table!
        pass

    def handle(self, request):
        method = request["method"].upper()
        path = request["path"].split("?", 1)[0]

        if method == "GET" and path == "/healthz":
            return {"status": 200, "headers": {"Content-Type": "application/json"}, "body": '{"status":"alive"}'}

        if method == "GET" and path == "/readyz":
            # BUG 2: always says 200 even before start() migrates the DB or during shutdown!
            return {"status": 200, "headers": {"Content-Type": "application/json"}, "body": '{"status":"ready"}'}

        if method == "POST" and path == "/login":
            # BUG 4: no rate limiting!
            return {"status": 200, "headers": {"Content-Type": "application/json"}, "body": '{"ok":true}'}

        if method == "POST" and path == "/orders":
            body = json.loads(request.get("body", "{}"))
            self.conn.execute("INSERT INTO orders (sku) VALUES (?)", (body["sku"],))
            self.conn.commit()
            return {"status": 201, "headers": {"Content-Type": "application/json"}, "body": json.dumps({"sku": body["sku"]})}

        if method == "GET" and path.startswith("/exports/"):
            # BUG 3: path traversal!
            filename = path[len("/exports/"):]
            full = os.path.normpath(os.path.join("/srv/exports", filename))
            if full not in self.files:
                return {"status": 404, "headers": {"Content-Type": "application/json"}, "body": '{"error":"not found"}'}
            return {"status": 200, "headers": {"Content-Type": "text/plain"}, "body": self.files[full]}

        if method == "GET" and path == "/crash":
            # BUG 4: uncaught exception leaks raw internals!
            raise RuntimeError("db_password=supersecret crash")

        return {"status": 404, "headers": {"Content-Type": "application/json"}, "body": '{"error":"not found"}'}
```

## Checks

```python
import json as _json, sqlite3 as _sq

incident_logs = [
    _json.dumps({"request_id": "r-1", "path": "/healthz", "status": 200}),
    _json.dumps({"request_id": "r-2", "path": "/orders", "status": 500, "api_secret": "dev-secret"}),
    _json.dumps({"request_id": "r-3", "path": "/orders", "status": 500, "headers": {"Authorization": "Bearer raw-tok"}}),
    _json.dumps({"request_id": "r-4", "path": "/login", "status": 503, "headers": {"Authorization": "[REDACTED]"}}),
]
expect(
    "diagnose_incident triages errors and secret leaks",
    lambda: get("diagnose_incident")(incident_logs),
    {
        "error_count": 3,
        "top_failing_path": "/orders",
        "first_error_request_id": "r-2",
        "leaked_secret_count": 2,
    },
)

def _rejects_weak_secret():
    try:
        get("ProductionService")({"API_SECRET": "short"}, _sq.connect(":memory:"), {})
        return False
    except ValueError:
        return True

check("rejects missing/short API_SECRET at startup", _rejects_weak_secret, "Raise ValueError when API_SECRET is < 16 chars.")

files = {"/srv/exports/nov.csv": "sku,qty\nFUEL,10", "/etc/passwd": "root:x:0:0"}
clock = [1000]
conn = _sq.connect(":memory:")
svc = get("ProductionService")({"API_SECRET": "prod-secret-0123456789"}, conn, files, now_fn=lambda: clock[0])

check("startup logs never contain raw API_SECRET", lambda: all("prod-secret-0123456789" not in line for line in svc.logs))
expect("/readyz is 503 before start() migrates DB", lambda: svc.handle({"method": "GET", "path": "/readyz", "headers": {}})["status"], 503)
svc.start()
expect("/readyz is 200 after start()", lambda: svc.handle({"method": "GET", "path": "/readyz", "headers": {}})["status"], 200)
expect("POST /orders succeeds after start()", lambda: svc.handle({"method": "POST", "path": "/orders", "headers": {}, "body": '{"sku":"FUEL"}'})["status"], 201)
expect("GET /exports/nov.csv serves allowed file", lambda: svc.handle({"method": "GET", "path": "/exports/nov.csv", "headers": {}})["body"], "sku,qty\nFUEL,10")
expect("GET /exports/../../etc/passwd blocked with 400", lambda: svc.handle({"method": "GET", "path": "/exports/../../etc/passwd", "headers": {}})["status"], 400)
```

## Hidden checks

```python
# Rate limit on POST /login (3 per 60s)
for _ in range(3):
    r_ok = svc.handle({"method": "POST", "path": "/login", "headers": {}, "client_id": "attacker"})
    expect("first 3 logins allowed", lambda: r_ok["status"], 200)
r_block = svc.handle({"method": "POST", "path": "/login", "headers": {}, "client_id": "attacker"})
expect("4th login in 60s returns 429 with Retry-After", lambda: (r_block["status"], int(r_block["headers"].get("Retry-After", "0")) > 0), (429, True))

# Crash containment + security headers
r_crash = svc.handle({"method": "GET", "path": "/crash", "headers": {}})
expect("crash returns safe 500 without leaking exception text", lambda: (r_crash["status"], "supersecret" not in r_crash["body"], _json.loads(r_crash["body"]).get("error")), (500, True, "internal error"))
expect("responses carry nosniff and DENY security headers", lambda: (r_crash["headers"].get("X-Content-Type-Options"), r_crash["headers"].get("X-Frame-Options")), ("nosniff", "DENY"))

# Graceful shutdown makes /readyz 503
svc.shutting_down = True
expect("/readyz returns 503 when shutting_down is True", lambda: svc.handle({"method": "GET", "path": "/readyz", "headers": {}})["status"], 503)

# Sibling directory traversal blocked
files["/srv/exports-secret/leak.txt"] = "secret"
expect("sibling directory escape blocked with 400", lambda: svc.handle({"method": "GET", "path": "/exports/../exports-secret/leak.txt", "headers": {}})["status"], 400)

# start() is idempotent
check("calling start() twice succeeds", lambda: (svc.start(), True)[1])
```

## Solution

```python
from collections import deque
import json
import math
import os


def diagnose_incident(log_lines):
    error_count = 0
    errors_by_path = {}
    first_error_req = None
    leaked_secret_count = 0

    for line in log_lines:
        entry = json.loads(line)
        status = entry.get("status", 0)
        if 500 <= status < 600:
            error_count += 1
            path = entry.get("path")
            errors_by_path[path] = errors_by_path.get(path, 0) + 1
            if first_error_req is None:
                first_error_req = entry.get("request_id")

        leaked = False
        for k, v in entry.items():
            if k.lower() in ("api_secret", "authorization") and v != "[REDACTED]":
                leaked = True
        headers = entry.get("headers")
        if isinstance(headers, dict):
            for k, v in headers.items():
                if k.lower() in ("api_secret", "authorization") and v != "[REDACTED]":
                    leaked = True
        if leaked:
            leaked_secret_count += 1

    top_failing_path = None
    if errors_by_path:
        top_failing_path = min(errors_by_path, key=lambda p: (-errors_by_path[p], p))

    return {
        "error_count": error_count,
        "top_failing_path": top_failing_path,
        "first_error_request_id": first_error_req,
        "leaked_secret_count": leaked_secret_count,
    }


class ProductionService:
    def __init__(self, env, conn, files, now_fn=lambda: 1000):
        secret = str(env.get("API_SECRET", "")).strip()
        if len(secret) < 16:
            raise ValueError("API_SECRET must be at least 16 characters")
        self.secret = secret
        self.conn = conn
        self.files = files
        self.now_fn = now_fn
        self.shutting_down = False
        self.logs = []
        self._login_windows = {}
        self.logs.append(json.dumps({"event": "startup", "api_secret": "[REDACTED]"}))

    def start(self):
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT NOT NULL)"
        )
        self.conn.commit()

    def _allow_login(self, client_id):
        now = self.now_fn()
        q = self._login_windows.setdefault(client_id, deque())
        while q and q[0] <= now - 60:
            q.popleft()
        if len(q) < 3:
            q.append(now)
            return (True, 0)
        return (False, max(1, math.ceil((q[0] + 60) - now)))

    def _with_security_headers(self, resp):
        headers = dict(resp.get("headers", {}))
        headers["X-Content-Type-Options"] = "nosniff"
        headers["X-Frame-Options"] = "DENY"
        return {"status": resp["status"], "headers": headers, "body": resp.get("body", "")}

    def _dispatch(self, request):
        method = request["method"].upper()
        path = request["path"].split("?", 1)[0]

        if method == "GET" and path == "/healthz":
            return {"status": 200, "headers": {"Content-Type": "application/json"}, "body": '{"status":"alive"}'}

        if method == "GET" and path == "/readyz":
            if self.shutting_down:
                return {"status": 503, "headers": {"Content-Type": "application/json"}, "body": '{"status":"shutting_down"}'}
            try:
                existing = {
                    r[0]
                    for r in self.conn.execute(
                        "SELECT name FROM sqlite_master WHERE type = 'table'"
                    ).fetchall()
                }
            except Exception:
                return {"status": 503, "headers": {"Content-Type": "application/json"}, "body": '{"status":"db_unavailable"}'}
            if "orders" not in existing:
                return {"status": 503, "headers": {"Content-Type": "application/json"}, "body": '{"status":"not_ready"}'}
            return {"status": 200, "headers": {"Content-Type": "application/json"}, "body": '{"status":"ready"}'}

        if method == "POST" and path == "/login":
            allowed, retry_after = self._allow_login(request.get("client_id", "anon"))
            if not allowed:
                return {
                    "status": 429,
                    "headers": {"Content-Type": "application/json", "Retry-After": str(retry_after)},
                    "body": '{"error":"rate limited"}',
                }
            return {"status": 200, "headers": {"Content-Type": "application/json"}, "body": '{"ok":true}'}

        if method == "POST" and path == "/orders":
            body = json.loads(request.get("body", "{}"))
            self.conn.execute("INSERT INTO orders (sku) VALUES (?)", (body["sku"],))
            self.conn.commit()
            return {"status": 201, "headers": {"Content-Type": "application/json"}, "body": json.dumps({"sku": body["sku"]})}

        if method == "GET" and path.startswith("/exports/"):
            filename = path[len("/exports/"):]
            if not filename or filename.startswith(("/", "\\")) or "\x00" in filename:
                return {"status": 400, "headers": {"Content-Type": "application/json"}, "body": '{"error":"invalid path"}'}
            full = os.path.normpath(os.path.join("/srv/exports", filename))
            if not full.startswith("/srv/exports/"):
                return {"status": 400, "headers": {"Content-Type": "application/json"}, "body": '{"error":"invalid path"}'}
            if full not in self.files:
                return {"status": 404, "headers": {"Content-Type": "application/json"}, "body": '{"error":"not found"}'}
            return {"status": 200, "headers": {"Content-Type": "text/plain"}, "body": self.files[full]}

        if method == "GET" and path == "/crash":
            raise RuntimeError("db_password=supersecret crash")

        return {"status": 404, "headers": {"Content-Type": "application/json"}, "body": '{"error":"not found"}'}

    def handle(self, request):
        try:
            resp = self._dispatch(request)
        except Exception:
            resp = {
                "status": 500,
                "headers": {"Content-Type": "application/json"},
                "body": '{"error":"internal error"}',
            }
        return self._with_security_headers(resp)
```

## Restored

The outage is resolved, secrets are scrubbed, migrations gate readiness, exports stay inside `/srv/exports`, and brute-force traffic hits a clean `429`. The grid is fully online.
