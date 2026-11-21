---
id: place-an-order
title: Place an order
system: Exchange floor
symbol: controller
scene: tests
skills: api-design, sql, auth
---

## Briefing

Finish the Supply Exchange API by adding orders: authenticated operators can place orders (atomically deducting stock), view their own orders, and cancel orders they own (atomically returning stock to the listing) — while admins can cancel any order.

## Objective

Extend `OrderService(conn, secret, now_fn)` (schema and token verification are provided in the starter) to handle three authenticated routes in `handle(self, request)`:

1. **`POST /orders`**:
   - Requires valid Bearer token (`401` otherwise).
   - JSON body `{"sku": str, "quantity": int}` (`quantity > 0`, `400` otherwise).
   - If `sku` does not exist in `listings`, return `404`.
   - Atomically deduct `quantity` from `listings` where `sku = ? AND quantity >= ?`. If `rowcount == 0`, return `409` (`{"error": "insufficient stock"}`).
   - Insert into `orders (user_id, sku, quantity)` using `claims["uid"]`, commit, and return `201` with `{"id": order_id, "user_id": claims["uid"], "sku": sku, "quantity": quantity}`.
2. **`GET /orders`**:
   - Requires valid Bearer token (`401` otherwise).
   - Returns `200` with a JSON list of **only this user's** orders (`WHERE user_id = ?`), as `{"id": ..., "user_id": ..., "sku": ..., "quantity": ...}` ordered by `id ASC`.
3. **`DELETE /orders/{id}`**:
   - Requires valid Bearer token (`401` otherwise).
   - Look up order by integer `id` (`404` if missing or non-integer).
   - If `claims.get("role") != "admin"` and `order_user_id != claims["uid"]`, return `403`.
   - In one transaction: delete the order and add its `quantity` back to `listings` for its `sku`, commit, and return `204` with an empty body `""`.

## Concept

Notice how every piece of database hygiene pays off here:

- Placing an order decrements stock and inserts the order in **one transaction** so stock can never go negative or vanish.
- Canceling an order checks **authorization (`403`)** against `claims["uid"]` and `claims["role"]`, then deletes the order and restores stock in **one transaction**.

## Hints

1. Check `SELECT 1 FROM listings WHERE sku = ?` before returning `404` vs `409` on `POST /orders`, so a missing SKU returns `404` and a low-stock SKU returns `409`.
2. For `DELETE /orders/{id}`, match `path.startswith("/orders/")`, parse `int(path.split("/", 2)[2])` inside `try/except ValueError` (returning `404` if invalid).
3. On `DELETE /orders/{id}`, return `{"status": 204, "headers": {}, "body": ""}` after deleting the order and restoring `listings.quantity`.

## Starter: guided

```python
import base64
import hashlib
import hmac
import json
import sqlite3


def verify_token(token, secret, now):
    if not isinstance(token, str) or token.count(".") != 1:
        return None
    p, sig = token.split(".")
    expected = hmac.new(secret.encode("utf-8"), p.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        claims = json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)).decode("utf-8"))
    except Exception:
        return None
    if not isinstance(claims, dict) or claims.get("exp", 0) <= now:
        return None
    return claims


class OrderService:
    def __init__(self, conn, secret, now_fn=lambda: 1000):
        self.conn = conn
        self.secret = secret
        self.now_fn = now_fn

    def _resp(self, status, data):
        return {
            "status": status,
            "headers": {"Content-Type": "application/json"} if data is not None else {},
            "body": "" if data is None else json.dumps(data),
        }

    def _current_user(self, request):
        headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
        auth = headers.get("authorization", "")
        if not auth.startswith("Bearer "):
            return None
        return verify_token(auth[7:], self.secret, self.now_fn())

    def handle(self, request):
        claims = self._current_user(request)
        if claims is None:
            return self._resp(401, {"error": "unauthorized"})
        method = request["method"].upper()
        path = request["path"].split("?", 1)[0]
        # Implement POST /orders, GET /orders, DELETE /orders/{id}.
        return self._resp(404, {"error": "not found"})
```

## Starter: standard

```python
import base64
import hashlib
import hmac
import json
import sqlite3


def verify_token(token, secret, now):
    if not isinstance(token, str) or token.count(".") != 1:
        return None
    p, sig = token.split(".")
    expected = hmac.new(secret.encode("utf-8"), p.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        claims = json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)).decode("utf-8"))
    except Exception:
        return None
    if not isinstance(claims, dict) or claims.get("exp", 0) <= now:
        return None
    return claims


class OrderService:
    def __init__(self, conn, secret, now_fn=lambda: 1000):
        self.conn = conn
        self.secret = secret
        self.now_fn = now_fn

    def handle(self, request):
        return {"status": 404, "headers": {}, "body": ""}
```

## Starter: challenge

```python
import base64
import hashlib
import hmac
import json
import sqlite3


def verify_token(token, secret, now):
    if not isinstance(token, str) or token.count(".") != 1:
        return None
    p, sig = token.split(".")
    expected = hmac.new(secret.encode("utf-8"), p.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        claims = json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)).decode("utf-8"))
    except Exception:
        return None
    if not isinstance(claims, dict) or claims.get("exp", 0) <= now:
        return None
    return claims
```

## Checks

```python
import base64 as _b64, hashlib as _hl, hmac as _hm, json as _json, sqlite3 as _sq

SECRET = "ord-secret"

def _tok(claims):
    raw = _json.dumps({**claims, "exp": 5000}, sort_keys=True, separators=(",", ":")).encode()
    p = _b64.urlsafe_b64encode(raw).decode().rstrip("=")
    s = _hm.new(SECRET.encode(), p.encode(), _hl.sha256).hexdigest()
    return f"{p}.{s}"

conn = _sq.connect(":memory:")
conn.execute("PRAGMA foreign_keys = ON")
conn.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, role TEXT)")
conn.execute("CREATE TABLE listings (id INTEGER PRIMARY KEY, sku TEXT UNIQUE, name TEXT, quantity INTEGER CHECK (quantity >= 0))")
conn.execute("CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id), sku TEXT REFERENCES listings(sku), quantity INTEGER CHECK (quantity > 0))")
conn.executemany("INSERT INTO users VALUES (?, ?, ?)", [(1, "mara", "operator"), (2, "ines", "operator"), (3, "chief", "admin")])
conn.execute("INSERT INTO listings VALUES (1, 'FUEL', 'Winter fuel', 10)")
conn.commit()

svc = get("OrderService")(conn, SECRET, now_fn=lambda: 1000)
mara_t = _tok({"uid": 1, "sub": "mara", "role": "operator"})
ines_t = _tok({"uid": 2, "sub": "ines", "role": "operator"})
admin_t = _tok({"uid": 3, "sub": "chief", "role": "admin"})

def _call(method, path, body=None, token=None):
    h = {"Content-Type": "application/json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    r = svc.handle({"method": method, "path": path, "headers": h, "body": "" if body is None else _json.dumps(body)})
    return r["status"], (_json.loads(r["body"]) if r["body"] else None)

expect("POST /orders creates order and deducts stock", lambda: (_call("POST", "/orders", {"sku": "FUEL", "quantity": 6}, token=mara_t), conn.execute("SELECT quantity FROM listings WHERE sku='FUEL'").fetchone()[0]), ((201, {"id": 1, "user_id": 1, "sku": "FUEL", "quantity": 6}), 4))
expect("POST /orders exceeding remaining stock returns 409", lambda: _call("POST", "/orders", {"sku": "FUEL", "quantity": 5}, token=ines_t)[0], 409)
expect("GET /orders returns only caller's own orders", lambda: (_call("GET", "/orders", token=mara_t), _call("GET", "/orders", token=ines_t)), ((200, [{"id": 1, "user_id": 1, "sku": "FUEL", "quantity": 6}]), (200, [])))
expect("Ines cannot cancel Mara's order (403)", lambda: _call("DELETE", "/orders/1", token=ines_t)[0], 403)
expect("Mara cancels own order (204) and stock restores to 10", lambda: (_call("DELETE", "/orders/1", token=mara_t), conn.execute("SELECT quantity FROM listings WHERE sku='FUEL'").fetchone()[0]), ((204, None), 10))
```

## Hidden checks

```python
expect("POST /orders unknown SKU returns 404", lambda: _call("POST", "/orders", {"sku": "GHOST", "quantity": 1}, token=mara_t)[0], 404)
expect("POST /orders zero qty returns 400", lambda: _call("POST", "/orders", {"sku": "FUEL", "quantity": 0}, token=mara_t)[0], 400)
expect("POST /orders without token returns 401", lambda: _call("POST", "/orders", {"sku": "FUEL", "quantity": 1})[0], 401)
_call("POST", "/orders", {"sku": "FUEL", "quantity": 3}, token=mara_t)
expect("Admin can cancel Mara's order (204) and stock restores to 10", lambda: (_call("DELETE", "/orders/2", token=admin_t), conn.execute("SELECT quantity FROM listings WHERE sku='FUEL'").fetchone()[0]), ((204, None), 10))
expect("Deleting missing order returns 404", lambda: _call("DELETE", "/orders/999", token=admin_t)[0], 404)
```

## Solution

```python
import base64
import hashlib
import hmac
import json
import sqlite3


def verify_token(token, secret, now):
    if not isinstance(token, str) or token.count(".") != 1:
        return None
    p, sig = token.split(".")
    expected = hmac.new(secret.encode("utf-8"), p.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        claims = json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)).decode("utf-8"))
    except Exception:
        return None
    if not isinstance(claims, dict) or claims.get("exp", 0) <= now:
        return None
    return claims


class OrderService:
    def __init__(self, conn, secret, now_fn=lambda: 1000):
        self.conn = conn
        self.secret = secret
        self.now_fn = now_fn

    def _resp(self, status, data):
        return {
            "status": status,
            "headers": {"Content-Type": "application/json"} if data is not None else {},
            "body": "" if data is None else json.dumps(data),
        }

    def _current_user(self, request):
        headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
        auth = headers.get("authorization", "")
        if not auth.startswith("Bearer "):
            return None
        return verify_token(auth[7:], self.secret, self.now_fn())

    def handle(self, request):
        claims = self._current_user(request)
        if claims is None:
            return self._resp(401, {"error": "unauthorized"})
        method = request["method"].upper()
        path = request["path"].split("?", 1)[0]

        if method == "POST" and path == "/orders":
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
            exists = self.conn.execute("SELECT 1 FROM listings WHERE sku = ?", (sku,)).fetchone()
            if exists is None:
                return self._resp(404, {"error": "sku not found"})
            cur = self.conn.execute(
                "UPDATE listings SET quantity = quantity - ? WHERE sku = ? AND quantity >= ?",
                (qty, sku, qty),
            )
            if cur.rowcount != 1:
                self.conn.rollback()
                return self._resp(409, {"error": "insufficient stock"})
            cur2 = self.conn.execute(
                "INSERT INTO orders (user_id, sku, quantity) VALUES (?, ?, ?)",
                (claims["uid"], sku, qty),
            )
            self.conn.commit()
            return self._resp(201, {"id": cur2.lastrowid, "user_id": claims["uid"], "sku": sku, "quantity": qty})

        if method == "GET" and path == "/orders":
            rows = self.conn.execute(
                "SELECT id, user_id, sku, quantity FROM orders WHERE user_id = ? ORDER BY id ASC",
                (claims["uid"],),
            ).fetchall()
            return self._resp(
                200,
                [{"id": r[0], "user_id": r[1], "sku": r[2], "quantity": r[3]} for r in rows],
            )

        if method == "DELETE" and path.startswith("/orders/"):
            raw_id = path.split("/", 2)[2]
            if "/" in raw_id:
                return self._resp(404, {"error": "not found"})
            try:
                order_id = int(raw_id)
            except ValueError:
                return self._resp(404, {"error": "not found"})
            row = self.conn.execute(
                "SELECT id, user_id, sku, quantity FROM orders WHERE id = ?",
                (order_id,),
            ).fetchone()
            if row is None:
                return self._resp(404, {"error": "order not found"})
            if claims.get("role") != "admin" and row[1] != claims["uid"]:
                return self._resp(403, {"error": "forbidden"})
            self.conn.execute("DELETE FROM orders WHERE id = ?", (order_id,))
            self.conn.execute(
                "UPDATE listings SET quantity = quantity + ? WHERE sku = ?",
                (row[3], row[2]),
            )
            self.conn.commit()
            return self._resp(204, None)

        return self._resp(404, {"error": "not found"})
```

## Restored

The Supply Exchange API is live from end to end: registration, login tokens, listings, atomic orders, and ownership-checked cancellations.
