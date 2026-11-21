---
id: connect-the-settlements
title: Connect the settlements
system: Settlement bridge
symbol: controller
scene: tests
skills: http, sql, api-design, auth
assessment: true
---

## Briefing

Kestrel Ridge's supply exchange and Valley Station's depot service are both online, and now they need to talk to each other. Build `SettlementBridge`: a service that pulls Valley Station's paginated catalog over a flaky HTTP link into Kestrel Ridge's SQLite database, accepts signed restock webhooks idempotently, and serves Kestrel Ridge's own authenticated catalog and order API.

This is an independent mission. There is no starter code, and hints unlock after your second submission. Use everything you've learned in the exchange — HTTP clients, retries, SQLite, routing, signed tokens, and webhooks.

## Objective

Write a `SettlementBridge` class initialized as:

```python
SettlementBridge(conn, valley_transport, valley_url, valley_token, api_secret, webhook_secret, now_fn=lambda: 1000)
```

1. **Database setup in `__init__`:** create tables (if not exist):
   - `catalog (sku TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, quantity INTEGER NOT NULL CHECK (quantity >= 0))`
   - `orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT NOT NULL, sku TEXT NOT NULL REFERENCES catalog(sku), quantity INTEGER NOT NULL CHECK (quantity > 0))`
   - `webhook_events (event_id TEXT PRIMARY KEY)`
   Enable `PRAGMA foreign_keys = ON`.
2. **`sync_from_valley(self)`:**
   - Calls `valley_transport("GET", f"{valley_url.rstrip('/')}/catalog?page={page}", headers={"Authorization": f"Bearer {valley_token}", "Accept": "application/json"}, body=None)` starting at `page = 1`.
   - Retries each page up to 3 attempts on `429` or `5xx` statuses; raises `PermissionError` on `401` and `RuntimeError` on any other non-`200` failure.
   - Each `200` body is JSON `{"items": [{"sku": ..., "name": ..., "category": ..., "quantity": ...}, ...], "next_page": <int or None>}`.
   - Upserts every received item into `catalog` (`ON CONFLICT(sku) DO UPDATE SET name=excluded.name, category=excluded.category, quantity=excluded.quantity`), commits, and returns the total number of items synced.
3. **`handle(self, request)`** returns `{"status": int, "headers": {"Content-Type": "application/json"}, "body": <json str>}` for:
   - **`GET /catalog`**: optional `?category=<name>` query parameter; returns `200` with JSON list of `{"sku", "name", "category", "quantity"}` dicts ordered by `sku ASC`.
   - **`POST /orders`**: requires valid `Authorization: Bearer <token>` signed with `api_secret` (same `<base64url(json)>.<hmac_sha256_hex>` format from the gatehouse, with `exp > now_fn()` and `"sub"` claim; `401` otherwise). JSON body `{"sku": str, "quantity": int}` (`quantity > 0`, `400` otherwise). Returns `404` if SKU not in `catalog`, `409` if insufficient stock, or atomically decrements `catalog.quantity`, inserts into `orders`, commits, and returns `201` with `{"id": ..., "user": claims["sub"], "sku": sku, "quantity": quantity}`.
   - **`POST /webhooks/valley`**: verifies `X-Signature` (case-insensitive) HMAC-SHA256 hex digest of `request["body"]` using `webhook_secret` (`401` otherwise). Parses JSON `{"event_id": str, "sku": str, "delta": int}` (`delta > 0`, `400` otherwise). If `event_id` is already in `webhook_events`, returns `200` `{"status": "duplicate"}` without changing stock; if `sku` isn't in `catalog`, returns `404`; otherwise records `event_id`, adds `delta` to `catalog.quantity`, commits, and returns `200` `{"status": "applied"}`.
   - Unknown routes return `404`.

## Concept

This finale combines every layer of Act VII:

| Layer | Responsibility |
|---|---|
| HTTP Client | Paginated `GET /catalog?page=N`, `Bearer` header, retries on `429`/`5xx` |
| SQLite Storage | `catalog`, `orders`, `webhook_events`, `PRAGMA foreign_keys = ON`, atomic upsert & stock updates |
| HTTP Server | `GET /catalog` (with `urllib.parse.parse_qs`), `POST /orders` (`400`/`401`/`404`/`409`/`201`) |
| Security | Constant-time HMAC-SHA256 for both Bearer tokens and webhook `X-Signature`, plus `event_id` idempotency |

## Hints

1. Keep small private helpers for JSON responses, HMAC token verification, and header normalization (`{k.lower(): v for k, v in ...}`).
2. In `sync_from_valley()`, loop over `page` until `next_page is None`, retrying each page request up to 3 times on `429` or `500 <= status < 600`.
3. On `POST /webhooks/valley`, verify `X-Signature` over the exact raw body string before parsing JSON, then check `webhook_events` and `catalog` before committing both the event ID and the stock addition together.

## Starter

```python
```

## Checks

```python
import base64 as _b64, hashlib as _hl, hmac as _hm, json as _json, sqlite3 as _sq

API_SECRET = "ridge-api-secret"
HOOK_SECRET = "valley-hook-secret"

def _mint(sub, exp=5000):
    raw = _json.dumps({"sub": sub, "exp": exp}, sort_keys=True, separators=(",", ":")).encode()
    p = _b64.urlsafe_b64encode(raw).decode().rstrip("=")
    s = _hm.new(API_SECRET.encode(), p.encode(), _hl.sha256).hexdigest()
    return f"{p}.{s}"

def _valley_server():
    attempts = [0]
    pages = [
        [
            {"sku": "FUEL-1", "name": "Winter fuel", "category": "fuel", "quantity": 10},
            {"sku": "ROPE-1", "name": "Climbing rope", "category": "gear", "quantity": 4},
        ],
        [
            {"sku": "FLARE-1", "name": "Signal flare", "category": "safety", "quantity": 6},
        ],
    ]
    def transport(method, url, headers=None, body=None):
        auth = {k.lower(): v for k, v in (headers or {}).items()}.get("authorization")
        if auth != "Bearer valley-key":
            return {"status": 401, "headers": {}, "body": '{"error":"bad token"}'}
        page = int(url.split("page=")[-1])
        if page == 2 and attempts[0] == 0:
            attempts[0] += 1
            return {"status": 503, "headers": {}, "body": '{"error":"busy"}'}
        nxt = page + 1 if page < len(pages) else None
        return {"status": 200, "headers": {"Content-Type": "application/json"}, "body": _json.dumps({"items": pages[page - 1], "next_page": nxt})}
    return transport

conn = _sq.connect(":memory:")
bridge = get("SettlementBridge")(conn, _valley_server(), "https://valley.local", "valley-key", API_SECRET, HOOK_SECRET, now_fn=lambda: 1000)

expect("sync_from_valley retries 503 and syncs all 3 items", lambda: bridge.sync_from_valley(), 3)

def _call(method, path, body=None, headers=None):
    h = dict(headers or {})
    raw = "" if body is None else (body if isinstance(body, str) else _json.dumps(body))
    r = bridge.handle({"method": method, "path": path, "headers": h, "body": raw})
    return r["status"], (_json.loads(r["body"]) if r["body"] else None)

expect(
    "GET /catalog?category=fuel filters and orders cleanly",
    lambda: _call("GET", "/catalog?category=fuel"),
    (200, [{"sku": "FUEL-1", "name": "Winter fuel", "category": "fuel", "quantity": 10}]),
)

tok = _mint("mara")
expect(
    "POST /orders deducts stock and returns 201",
    lambda: (_call("POST", "/orders", {"sku": "FUEL-1", "quantity": 7}, {"Authorization": f"Bearer {tok}"}), _call("GET", "/catalog?category=fuel")[1][0]["quantity"]),
    ((201, {"id": 1, "user": "mara", "sku": "FUEL-1", "quantity": 7}), 3),
)

hook_body = _json.dumps({"event_id": "v-100", "sku": "FUEL-1", "delta": 5})
hook_sig = _hm.new(HOOK_SECRET.encode(), hook_body.encode(), _hl.sha256).hexdigest()
expect(
    "signed webhook restocks FUEL-1 from 3 to 8",
    lambda: (_call("POST", "/webhooks/valley", hook_body, {"X-Signature": hook_sig}), _call("GET", "/catalog?category=fuel")[1][0]["quantity"]),
    ((200, {"status": "applied"}), 8),
)
expect(
    "duplicate webhook does not double-credit",
    lambda: (_call("POST", "/webhooks/valley", hook_body, {"X-Signature": hook_sig}), _call("GET", "/catalog?category=fuel")[1][0]["quantity"]),
    ((200, {"status": "duplicate"}), 8),
)
```

## Hidden checks

```python
expect("GET /catalog returns all 3 items sorted by sku", lambda: [x["sku"] for x in _call("GET", "/catalog")[1]], ["FLARE-1", "FUEL-1", "ROPE-1"])
expect("POST /orders without token returns 401", lambda: _call("POST", "/orders", {"sku": "ROPE-1", "quantity": 1})[0], 401)
expect("POST /orders with expired token returns 401", lambda: _call("POST", "/orders", {"sku": "ROPE-1", "quantity": 1}, {"Authorization": f"Bearer {_mint('mara', exp=500)}"})[0], 401)
expect("POST /orders exceeding stock returns 409", lambda: _call("POST", "/orders", {"sku": "ROPE-1", "quantity": 99}, {"Authorization": f"Bearer {tok}"})[0], 409)
expect("POST /orders unknown SKU returns 404", lambda: _call("POST", "/orders", {"sku": "NOPE", "quantity": 1}, {"Authorization": f"Bearer {tok}"})[0], 404)
expect("webhook with wrong signature returns 401", lambda: _call("POST", "/webhooks/valley", hook_body, {"X-Signature": "deadbeef"})[0], 401)

# Re-syncing updates existing quantities via upsert cleanly
expect("second sync_from_valley upserts without IntegrityError", lambda: (bridge.sync_from_valley(), _call("GET", "/catalog?category=fuel")[1][0]["quantity"]), (3, 10))

# Bad remote token raises PermissionError
conn_bad = _sq.connect(":memory:")
bad_bridge = get("SettlementBridge")(conn_bad, _valley_server(), "https://valley.local", "wrong-key", API_SECRET, HOOK_SECRET)
def _sync_unauth():
    try:
        bad_bridge.sync_from_valley()
    except PermissionError:
        return "permission-error"
    return "no-error"
expect("sync_from_valley raises PermissionError on 401", _sync_unauth, "permission-error")
```

## Solution

```python
import base64
import hashlib
import hmac
import json
from urllib.parse import parse_qs, urlparse


class SettlementBridge:
    def __init__(self, conn, valley_transport, valley_url, valley_token, api_secret, webhook_secret, now_fn=lambda: 1000):
        self.conn = conn
        self.valley_transport = valley_transport
        self.valley_url = valley_url.rstrip("/")
        self.valley_token = valley_token
        self.api_secret = api_secret
        self.webhook_secret = webhook_secret
        self.now_fn = now_fn

        self.conn.execute("PRAGMA foreign_keys = ON")
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS catalog (
                sku TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                quantity INTEGER NOT NULL CHECK (quantity >= 0)
            )
            """
        )
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user TEXT NOT NULL,
                sku TEXT NOT NULL REFERENCES catalog(sku),
                quantity INTEGER NOT NULL CHECK (quantity > 0)
            )
            """
        )
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS webhook_events (
                event_id TEXT PRIMARY KEY
            )
            """
        )
        self.conn.commit()

    def _resp(self, status, data):
        return {
            "status": status,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(data),
        }

    def _headers(self, request):
        return {k.lower(): v for k, v in request.get("headers", {}).items()}

    def _verify_token(self, token):
        if not isinstance(token, str) or token.count(".") != 1:
            return None
        p, sig = token.split(".")
        expected = hmac.new(self.api_secret.encode("utf-8"), p.encode("ascii"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        try:
            claims = json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)).decode("utf-8"))
        except Exception:
            return None
        if not isinstance(claims, dict) or claims.get("exp", 0) <= self.now_fn() or not isinstance(claims.get("sub"), str):
            return None
        return claims

    def sync_from_valley(self):
        headers = {
            "Authorization": f"Bearer {self.valley_token}",
            "Accept": "application/json",
        }
        page = 1
        synced = 0
        while page is not None:
            url = f"{self.valley_url}/catalog?page={page}"
            resp = None
            for _ in range(3):
                resp = self.valley_transport("GET", url, headers=headers, body=None)
                status = resp["status"]
                if status != 429 and not (500 <= status < 600):
                    break
            status = resp["status"]
            if status == 401:
                raise PermissionError("unauthorized")
            if status != 200:
                raise RuntimeError(f"http {status}")
            data = json.loads(resp["body"])
            for item in data["items"]:
                self.conn.execute(
                    """
                    INSERT INTO catalog (sku, name, category, quantity)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(sku) DO UPDATE SET
                        name = excluded.name,
                        category = excluded.category,
                        quantity = excluded.quantity
                    """,
                    (item["sku"], item["name"], item["category"], item["quantity"]),
                )
                synced += 1
            page = data["next_page"]
        self.conn.commit()
        return synced

    def handle(self, request):
        method = request["method"].upper()
        parsed = urlparse(request["path"])
        path = parsed.path
        query = {k: vals[0] for k, vals in parse_qs(parsed.query).items()}
        headers = self._headers(request)

        if method == "GET" and path == "/catalog":
            category = query.get("category")
            if category is not None:
                rows = self.conn.execute(
                    "SELECT sku, name, category, quantity FROM catalog WHERE category = ? ORDER BY sku ASC",
                    (category,),
                ).fetchall()
            else:
                rows = self.conn.execute(
                    "SELECT sku, name, category, quantity FROM catalog ORDER BY sku ASC"
                ).fetchall()
            return self._resp(
                200,
                [{"sku": r[0], "name": r[1], "category": r[2], "quantity": r[3]} for r in rows],
            )

        if method == "POST" and path == "/orders":
            auth = headers.get("authorization", "")
            if not auth.startswith("Bearer "):
                return self._resp(401, {"error": "unauthorized"})
            claims = self._verify_token(auth[7:])
            if claims is None:
                return self._resp(401, {"error": "unauthorized"})
            try:
                body = json.loads(request.get("body", ""))
            except (json.JSONDecodeError, TypeError):
                return self._resp(400, {"error": "invalid json"})
            if not isinstance(body, dict):
                return self._resp(400, {"error": "invalid json"})
            sku = body.get("sku")
            qty = body.get("quantity")
            if not isinstance(sku, str) or not sku or isinstance(qty, bool) or not isinstance(qty, int) or qty <= 0:
                return self._resp(400, {"error": "invalid order"})
            if self.conn.execute("SELECT 1 FROM catalog WHERE sku = ?", (sku,)).fetchone() is None:
                return self._resp(404, {"error": "sku not found"})
            cur = self.conn.execute(
                "UPDATE catalog SET quantity = quantity - ? WHERE sku = ? AND quantity >= ?",
                (qty, sku, qty),
            )
            if cur.rowcount != 1:
                self.conn.rollback()
                return self._resp(409, {"error": "insufficient stock"})
            cur2 = self.conn.execute(
                "INSERT INTO orders (user, sku, quantity) VALUES (?, ?, ?)",
                (claims["sub"], sku, qty),
            )
            self.conn.commit()
            return self._resp(201, {"id": cur2.lastrowid, "user": claims["sub"], "sku": sku, "quantity": qty})

        if method == "POST" and path == "/webhooks/valley":
            raw_body = request.get("body", "")
            sig = headers.get("x-signature", "")
            expected = hmac.new(self.webhook_secret.encode("utf-8"), raw_body.encode("utf-8"), hashlib.sha256).hexdigest()
            if not hmac.compare_digest(sig, expected):
                return self._resp(401, {"error": "invalid signature"})
            try:
                body = json.loads(raw_body)
            except (json.JSONDecodeError, TypeError):
                return self._resp(400, {"error": "invalid payload"})
            if not isinstance(body, dict):
                return self._resp(400, {"error": "invalid payload"})
            event_id = body.get("event_id")
            sku = body.get("sku")
            delta = body.get("delta")
            if (
                not isinstance(event_id, str)
                or not event_id
                or not isinstance(sku, str)
                or not sku
                or isinstance(delta, bool)
                or not isinstance(delta, int)
                or delta <= 0
            ):
                return self._resp(400, {"error": "invalid payload"})
            if self.conn.execute("SELECT 1 FROM webhook_events WHERE event_id = ?", (event_id,)).fetchone() is not None:
                return self._resp(200, {"status": "duplicate"})
            if self.conn.execute("SELECT 1 FROM catalog WHERE sku = ?", (sku,)).fetchone() is None:
                return self._resp(404, {"error": "sku not found"})
            self.conn.execute("INSERT INTO webhook_events (event_id) VALUES (?)", (event_id,))
            self.conn.execute("UPDATE catalog SET quantity = quantity + ? WHERE sku = ?", (delta, sku))
            self.conn.commit()
            return self._resp(200, {"status": "applied"})

        return self._resp(404, {"error": "not found"})
```

## Restored

Kestrel Ridge and Valley Station trade over one clean, signed, fault-tolerant bridge. The exchange is fully online.
