---
id: build-your-outpost
title: Build your own outpost
system: Capstone bay
symbol: controller
scene: tests
skills: architecture, sql, api-design, auth
---

## Briefing

Time to build your own service from a clean specification: the **Outpost Alert Broker**. Weather stations, beacons, and settlements subscribe to topics (`"weather.*"`, `"supply.low"`), publishers emit events over an authenticated HTTP API, and the broker persists subscriptions, records idempotent deliveries in SQLite, and captures failed deliveries in a dead-letter table without blocking other subscribers.

## Objective

Write `OutpostBroker(conn, secret, deliver_fn, now_fn=lambda: 1000)`:

- **Database schema in `__init__`** (`CREATE TABLE IF NOT EXISTS`):
  - `subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, owner TEXT NOT NULL, pattern TEXT NOT NULL, target TEXT NOT NULL, UNIQUE(owner, pattern, target))`
  - `deliveries (id INTEGER PRIMARY KEY AUTOINCREMENT, sub_id INTEGER NOT NULL, event_id TEXT NOT NULL, topic TEXT NOT NULL, status TEXT NOT NULL, UNIQUE(sub_id, event_id))`
  - `dead_letters (id INTEGER PRIMARY KEY AUTOINCREMENT, sub_id INTEGER NOT NULL, event_id TEXT NOT NULL, topic TEXT NOT NULL, payload_json TEXT NOT NULL, error TEXT NOT NULL)`
- **Authentication:** every route below requires a valid `Authorization: Bearer <token>` signed with `secret` (`<base64url(json)>.<hmac_sha256_hex>`, `exp > now_fn()`, with `"sub"` claim); otherwise return `401`.
- **Routes in `handle(self, request)`** returning `{"status": int, "headers": {"Content-Type": "application/json"}, "body": <json str>}`:
  1. **`POST /subscriptions`**: JSON body `{"pattern": str, "target": str}` (non-empty strings, else `400`). Inserts with `owner = claims["sub"]`. Duplicate `(owner, pattern, target)` returns `409`. Returns `201` with `{"id": ..., "owner": ..., "pattern": ..., "target": ...}`.
  2. **`GET /subscriptions`**: returns `200` with a list of **this user's** subscriptions (`owner = claims["sub"]`), ordered by `id ASC`.
  3. **`POST /publish`**: JSON body `{"event_id": str, "topic": str, "payload": dict}` (non-empty `event_id`/`topic` and `dict` payload, else `400`).
     - Finds all subscriptions (ordered by `id ASC`) whose `pattern` matches `topic` (exact match, or `pattern.endswith(".*")` matching `topic.startswith(pattern[:-1])`).
     - For each matching subscription:
       - If `(sub_id, event_id)` is already in `deliveries`, count it as `"skipped"` and do not call `deliver_fn`.
       - Otherwise call `deliver_fn(target, {"id": event_id, "topic": topic, "payload": payload})`.
       - If `deliver_fn` succeeds: insert `(sub_id, event_id, topic, "delivered")` into `deliveries`, increment `"delivered"`.
       - If `deliver_fn` raises an exception: insert `(sub_id, event_id, topic, json.dumps(payload), str(exc))` into `dead_letters`, increment `"failed"`, and keep delivering to remaining subscribers.
     - Commit and return `200` with `{"delivered": ..., "failed": ..., "skipped": ...}`.
  4. Unknown routes return `404`.

## Concept

This capstone pulls together five acts of skills into one cohesive, self-contained service:

- **OOP & clean structure** (Act V)
- **Wildcard matching & data structures** (Act VI)
- **SQLite schemas, unique constraints, HTTP routing & HMAC Bearer tokens** (Act VII)
- **Fault isolation & dead-letter persistence** (Acts VIII & IX)

## Hints

1. Write `_verify_token(token)` using `base64.urlsafe_b64decode` + `hmac.compare_digest` and check `claims.get("exp", 0) > self.now_fn()`.
2. Write `_matches(pattern, topic)` handling both exact equality and `pattern.endswith(".*")`.
3. On `POST /publish`, check `SELECT 1 FROM deliveries WHERE sub_id = ? AND event_id = ?` before calling `self.deliver_fn(...)`.

## Starter: guided

```python
import base64
import hashlib
import hmac
import json
import sqlite3


def _matches(pattern, topic):
    if pattern.endswith(".*"):
        return topic.startswith(pattern[:-1])
    return pattern == topic


class OutpostBroker:
    def __init__(self, conn, secret, deliver_fn, now_fn=lambda: 1000):
        self.conn = conn
        self.secret = secret
        self.deliver_fn = deliver_fn
        self.now_fn = now_fn
        # Create subscriptions, deliveries, and dead_letters tables and commit.

    def _resp(self, status, data):
        return {"status": status, "headers": {"Content-Type": "application/json"}, "body": json.dumps(data)}

    def _auth(self, request):
        headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
        auth = headers.get("authorization", "")
        if not auth.startswith("Bearer "):
            return None
        token = auth[7:]
        if token.count(".") != 1:
            return None
        p, sig = token.split(".")
        expected = hmac.new(self.secret.encode("utf-8"), p.encode("ascii"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        try:
            claims = json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)).decode("utf-8"))
        except Exception:
            return None
        if not isinstance(claims, dict) or claims.get("exp", 0) <= self.now_fn() or not isinstance(claims.get("sub"), str):
            return None
        return claims

    def handle(self, request):
        claims = self._auth(request)
        if claims is None:
            return self._resp(401, {"error": "unauthorized"})
        # Implement POST /subscriptions, GET /subscriptions, POST /publish, and 404.
        return self._resp(404, {"error": "not found"})
```

## Starter: standard

```python
import base64
import hashlib
import hmac
import json
import sqlite3


class OutpostBroker:
    def __init__(self, conn, secret, deliver_fn, now_fn=lambda: 1000):
        self.conn = conn
        self.secret = secret
        self.deliver_fn = deliver_fn
        self.now_fn = now_fn

    def handle(self, request):
        return {"status": 404, "headers": {"Content-Type": "application/json"}, "body": '{"error":"not found"}'}
```

## Starter: challenge

```python
```

## Checks

```python
import base64 as _b64, hashlib as _hl, hmac as _hm, json as _json, sqlite3 as _sq

SECRET = "capstone-secret"

def _tok(sub, role="operator", exp=5000):
    raw = _json.dumps({"sub": sub, "role": role, "exp": exp}, sort_keys=True, separators=(",", ":")).encode()
    p = _b64.urlsafe_b64encode(raw).decode().rstrip("=")
    s = _hm.new(SECRET.encode(), p.encode(), _hl.sha256).hexdigest()
    return f"{p}.{s}"

sent = []
def _deliver(target, ev):
    if target == "broken-hook":
        raise RuntimeError("unreachable")
    sent.append((target, ev))

conn = _sq.connect(":memory:")
broker = get("OutpostBroker")(conn, SECRET, _deliver, now_fn=lambda: 1000)
mara = _tok("mara")
ines = _tok("ines")

def _call(method, path, body=None, token=None):
    h = {"Content-Type": "application/json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    r = broker.handle({"method": method, "path": path, "headers": h, "body": "" if body is None else _json.dumps(body)})
    return r["status"], _json.loads(r["body"])

expect("unauthenticated POST /subscriptions returns 401", lambda: _call("POST", "/subscriptions", {"pattern": "weather.*", "target": "fleet"})[0], 401)
expect("Mara subscribes to weather.*", lambda: _call("POST", "/subscriptions", {"pattern": "weather.*", "target": "fleet"}, token=mara), (201, {"id": 1, "owner": "mara", "pattern": "weather.*", "target": "fleet"}))
expect("duplicate subscription returns 409", lambda: _call("POST", "/subscriptions", {"pattern": "weather.*", "target": "fleet"}, token=mara)[0], 409)
expect("Ines subscribes a failing hook to weather.wind", lambda: _call("POST", "/subscriptions", {"pattern": "weather.wind", "target": "broken-hook"}, token=ines)[0], 201)
expect("GET /subscriptions only returns caller's own", lambda: len(_call("GET", "/subscriptions", token=mara)[1]), 1)

expect(
    "POST /publish fans out, delivers healthy, dead-letters broken",
    lambda: _call("POST", "/publish", {"event_id": "e1", "topic": "weather.wind", "payload": {"kph": 90}}, token=mara),
    (200, {"delivered": 1, "failed": 1, "skipped": 0}),
)
expect("dead_letters table recorded broken-hook", lambda: conn.execute("SELECT COUNT(*) FROM dead_letters").fetchone()[0], 1)
expect(
    "re-publishing e1 skips already-delivered subscription",
    lambda: _call("POST", "/publish", {"event_id": "e1", "topic": "weather.wind", "payload": {"kph": 90}}, token=mara),
    (200, {"delivered": 0, "failed": 1, "skipped": 1}),
)
```

## Hidden checks

```python
expect("invalid payload (not dict) returns 400", lambda: _call("POST", "/publish", {"event_id": "e2", "topic": "a.b", "payload": "bad"}, token=mara)[0], 400)
expect("non-matching topic delivers 0", lambda: _call("POST", "/publish", {"event_id": "e3", "topic": "supply.low", "payload": {}}, token=mara), (200, {"delivered": 0, "failed": 0, "skipped": 0}))
expect("unknown route returns 404", lambda: _call("GET", "/unknown", token=mara)[0], 404)
```

## Solution

```python
import base64
import hashlib
import hmac
import json
import sqlite3


def _matches(pattern, topic):
    if pattern.endswith(".*"):
        return topic.startswith(pattern[:-1])
    return pattern == topic


class OutpostBroker:
    def __init__(self, conn, secret, deliver_fn, now_fn=lambda: 1000):
        self.conn = conn
        self.secret = secret
        self.deliver_fn = deliver_fn
        self.now_fn = now_fn
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner TEXT NOT NULL,
                pattern TEXT NOT NULL,
                target TEXT NOT NULL,
                UNIQUE(owner, pattern, target)
            )
            """
        )
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS deliveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sub_id INTEGER NOT NULL,
                event_id TEXT NOT NULL,
                topic TEXT NOT NULL,
                status TEXT NOT NULL,
                UNIQUE(sub_id, event_id)
            )
            """
        )
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS dead_letters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sub_id INTEGER NOT NULL,
                event_id TEXT NOT NULL,
                topic TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                error TEXT NOT NULL
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

    def _auth(self, request):
        headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
        auth = headers.get("authorization", "")
        if not auth.startswith("Bearer "):
            return None
        token = auth[7:]
        if token.count(".") != 1:
            return None
        p, sig = token.split(".")
        expected = hmac.new(self.secret.encode("utf-8"), p.encode("ascii"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        try:
            claims = json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)).decode("utf-8"))
        except Exception:
            return None
        if not isinstance(claims, dict) or claims.get("exp", 0) <= self.now_fn() or not isinstance(claims.get("sub"), str):
            return None
        return claims

    def _read_json(self, request):
        try:
            data = json.loads(request.get("body", ""))
            return data if isinstance(data, dict) else None
        except (json.JSONDecodeError, TypeError):
            return None

    def handle(self, request):
        claims = self._auth(request)
        if claims is None:
            return self._resp(401, {"error": "unauthorized"})
        method = request["method"].upper()
        path = request["path"].split("?", 1)[0]

        if method == "POST" and path == "/subscriptions":
            body = self._read_json(request)
            if not body:
                return self._resp(400, {"error": "invalid json"})
            pattern = body.get("pattern")
            target = body.get("target")
            if not isinstance(pattern, str) or not pattern or not isinstance(target, str) or not target:
                return self._resp(400, {"error": "invalid subscription"})
            try:
                cur = self.conn.execute(
                    "INSERT INTO subscriptions (owner, pattern, target) VALUES (?, ?, ?)",
                    (claims["sub"], pattern, target),
                )
                self.conn.commit()
                return self._resp(
                    201,
                    {"id": cur.lastrowid, "owner": claims["sub"], "pattern": pattern, "target": target},
                )
            except sqlite3.IntegrityError:
                self.conn.rollback()
                return self._resp(409, {"error": "duplicate subscription"})

        if method == "GET" and path == "/subscriptions":
            rows = self.conn.execute(
                "SELECT id, owner, pattern, target FROM subscriptions WHERE owner = ? ORDER BY id ASC",
                (claims["sub"],),
            ).fetchall()
            return self._resp(
                200,
                [{"id": r[0], "owner": r[1], "pattern": r[2], "target": r[3]} for r in rows],
            )

        if method == "POST" and path == "/publish":
            body = self._read_json(request)
            if not body:
                return self._resp(400, {"error": "invalid json"})
            event_id = body.get("event_id")
            topic = body.get("topic")
            payload = body.get("payload")
            if not isinstance(event_id, str) or not event_id or not isinstance(topic, str) or not topic or not isinstance(payload, dict):
                return self._resp(400, {"error": "invalid event"})
            subs = self.conn.execute(
                "SELECT id, pattern, target FROM subscriptions ORDER BY id ASC"
            ).fetchall()
            delivered = failed = skipped = 0
            event = {"id": event_id, "topic": topic, "payload": payload}
            for sub_id, pattern, target in subs:
                if not _matches(pattern, topic):
                    continue
                if self.conn.execute(
                    "SELECT 1 FROM deliveries WHERE sub_id = ? AND event_id = ?",
                    (sub_id, event_id),
                ).fetchone() is not None:
                    skipped += 1
                    continue
                try:
                    self.deliver_fn(target, event)
                    self.conn.execute(
                        "INSERT INTO deliveries (sub_id, event_id, topic, status) VALUES (?, ?, ?, 'delivered')",
                        (sub_id, event_id, topic),
                    )
                    delivered += 1
                except Exception as exc:
                    self.conn.execute(
                        "INSERT INTO dead_letters (sub_id, event_id, topic, payload_json, error) VALUES (?, ?, ?, ?, ?)",
                        (sub_id, event_id, topic, json.dumps(payload), str(exc)),
                    )
                    failed += 1
            self.conn.commit()
            return self._resp(200, {"delivered": delivered, "failed": failed, "skipped": skipped})

        return self._resp(404, {"error": "not found"})
```

## Restored

Your own Outpost Alert Broker is live, authenticated, SQLite-backed, and isolating failures cleanly into dead letters.
