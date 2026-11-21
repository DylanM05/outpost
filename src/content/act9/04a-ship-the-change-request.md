---
id: ship-the-change-request
title: Ship the change request
system: Change order
symbol: controller
scene: tests
skills: architecture, sql, api-design, auth, reliability, debugging
assessment: true
---

## Briefing

Building a service from scratch is half the job; evolving a **live** service without breaking existing callers or wiping existing data is the other half. Your `OutpostBroker` is already running in production with real subscriptions and delivery logs in SQLite. Now the valley sends a four-part **change request**:

1. Quiet hours per subscription — with an `"emergency"` priority override that always gets through.
2. Safe, non-breaking schema migration on existing v1 databases.
3. An admin-only dead-letter replay endpoint.
4. A live audit stats endpoint.

Ship every part of the change request while keeping 100% backward compatibility with existing v1 callers and data.

This is the final independent mission of Outpost. Hints unlock after your second submission.

## Objective

Extend the working v1 `OutpostBroker` in the starter code to fulfill all four requirements:

1. **Backward-compatible migration in `__init__`:**
   - Ensure `subscriptions` has nullable integer columns `quiet_start` and `quiet_end` (if connecting to an existing v1 database without them, `ALTER TABLE subscriptions ADD COLUMN ...` without losing existing rows!).
   - Ensure `deliveries` has `priority TEXT NOT NULL DEFAULT 'normal'`.
2. **Quiet hours & emergency override:**
   - `POST /subscriptions` accepts optional `"quiet_start"` and `"quiet_end"` (integers `0..23`, or both `None`/omitted; reject invalid values with `400`). Return `"quiet_start"` and `"quiet_end"` on both `POST /subscriptions` and `GET /subscriptions`.
   - `POST /publish` accepts optional `"priority"` (`"normal"` by default, or `"emergency"`; reject other values with `400`).
   - Current hour is `hour = (self.now_fn() // 3600) % 24`. A subscription with non-null `quiet_start` and `quiet_end` is in quiet hours if:
     - When `quiet_start < quiet_end`: `quiet_start <= hour < quiet_end`.
     - When `quiet_start > quiet_end` (wraps past midnight, e.g. `22` to `6`): `hour >= quiet_start or hour < quiet_end`.
   - During quiet hours, if `priority != "emergency"`: do **not** call `deliver_fn`, record `(sub_id, event_id, topic, 'suppressed', priority)` in `deliveries`, and count it in `"suppressed"`. If `priority == "emergency"`, **bypass quiet hours** and deliver normally!
   - `POST /publish` now returns `{"delivered": ..., "failed": ..., "skipped": ..., "suppressed": ...}`.
3. **`POST /dead-letters/replay` (admin-only):**
   - Requires `claims.get("role") == "admin"` (`403` for non-admin, `401` if unauthenticated).
   - For each row in `dead_letters` (ordered by `id ASC`), looks up the subscription's `target` and calls `deliver_fn(target, {"id": event_id, "topic": topic, "payload": json.loads(payload_json)})`.
   - On success: inserts `(sub_id, event_id, topic, 'delivered', 'normal')` into `deliveries` (using `INSERT OR IGNORE`), deletes that row from `dead_letters`, increments `replayed`.
   - On failure: leaves the row in `dead_letters` with updated `error`, increments `remaining`.
   - Commits and returns `200` with `{"replayed": replayed, "remaining": remaining}`.
4. **`GET /stats` (any authenticated user):**
   - Returns `200` with `{"subscriptions": int, "delivered": int, "suppressed": int, "dead_letters": int}` counted from SQLite.

## Concept

Real-world change requests test everything you learned across all nine acts:

- Check `PRAGMA table_info(subscriptions)` to detect missing columns and run idempotent `ALTER TABLE` migrations on live v1 databases.
- Keep optional new fields defaulting to v1 behavior (`quiet_start=None`, `priority="normal"`) so existing clients never break.
- Guard operational endpoints (`/dead-letters/replay`) with role-based authorization (`403`).

## Hints

1. Check existing columns via `{r[1] for r in self.conn.execute("PRAGMA table_info(subscriptions)").fetchall()}` before running `ALTER TABLE subscriptions ADD COLUMN quiet_start INTEGER`, etc.
2. Write `_in_quiet_hours(hour, start, end)`: if `start is None or end is None`, return `False`. If `start < end`, return `start <= hour < end`. If `start > end`, return `hour >= start or hour < end`.
3. On `POST /dead-letters/replay`, check `claims.get("role") != "admin"` -> return `403`, then loop over `SELECT d.id, d.sub_id, d.event_id, d.topic, d.payload_json, s.target FROM dead_letters d INNER JOIN subscriptions s ON s.id = d.sub_id ORDER BY d.id ASC`.

## Starter

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

## Checks

```python
import base64 as _b64, hashlib as _hl, hmac as _hm, json as _json, sqlite3 as _sq

SECRET = "grad-secret"

def _tok(sub, role="operator", exp=100_000_000):
    raw = _json.dumps({"sub": sub, "role": role, "exp": exp}, sort_keys=True, separators=(",", ":")).encode()
    p = _b64.urlsafe_b64encode(raw).decode().rstrip("=")
    s = _hm.new(SECRET.encode(), p.encode(), _hl.sha256).hexdigest()
    return f"{p}.{s}"

# Pre-populate an existing v1 database BEFORE constructing OutpostBroker!
conn = _sq.connect(":memory:")
conn.execute("CREATE TABLE subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, owner TEXT NOT NULL, pattern TEXT NOT NULL, target TEXT NOT NULL, UNIQUE(owner, pattern, target))")
conn.execute("CREATE TABLE deliveries (id INTEGER PRIMARY KEY AUTOINCREMENT, sub_id INTEGER NOT NULL, event_id TEXT NOT NULL, topic TEXT NOT NULL, status TEXT NOT NULL, UNIQUE(sub_id, event_id))")
conn.execute("CREATE TABLE dead_letters (id INTEGER PRIMARY KEY AUTOINCREMENT, sub_id INTEGER NOT NULL, event_id TEXT NOT NULL, topic TEXT NOT NULL, payload_json TEXT NOT NULL, error TEXT NOT NULL)")
conn.execute("INSERT INTO subscriptions (owner, pattern, target) VALUES ('mara', 'weather.*', 'legacy-hook')")
conn.execute("INSERT INTO deliveries (sub_id, event_id, topic, status) VALUES (1, 'old-1', 'weather.wind', 'delivered')")
conn.commit()

fail_target = [True]
delivered_log = []
def _deliver(target, ev):
    if target == "flaky" and fail_target[0]:
        raise RuntimeError("down")
    delivered_log.append((target, ev["id"]))

# Hour 23 (23 * 3600 = 82800) — inside midnight-wrapping quiet hours 22..6!
clock = [23 * 3600]
broker = get("OutpostBroker")(conn, SECRET, _deliver, now_fn=lambda: clock[0])
mara = _tok("mara", "operator")
admin = _tok("chief", "admin")

def _call(method, path, body=None, token=None):
    h = {"Content-Type": "application/json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    r = broker.handle({"method": method, "path": path, "headers": h, "body": "" if body is None else _json.dumps(body)})
    return r["status"], _json.loads(r["body"])

expect("migrated v1 subscription keeps existing data with None quiet hours", lambda: _call("GET", "/subscriptions", token=mara), (200, [{"id": 1, "owner": "mara", "pattern": "weather.*", "target": "legacy-hook", "quiet_start": None, "quiet_end": None}]))
expect("subscribe with midnight-wrapping quiet hours 22..6", lambda: _call("POST", "/subscriptions", {"pattern": "weather.*", "target": "night-pager", "quiet_start": 22, "quiet_end": 6}, token=mara)[0], 201)
expect(
    "normal publish at hour 23 delivers to legacy-hook and suppresses night-pager",
    lambda: _call("POST", "/publish", {"event_id": "e1", "topic": "weather.snow", "payload": {"cm": 5}}, token=mara),
    (200, {"delivered": 1, "failed": 0, "skipped": 0, "suppressed": 1}),
)
expect(
    "emergency publish at hour 23 bypasses quiet hours and delivers to both",
    lambda: _call("POST", "/publish", {"event_id": "e2", "topic": "weather.storm", "payload": {"kph": 120}, "priority": "emergency"}, token=mara),
    (200, {"delivered": 2, "failed": 0, "skipped": 0, "suppressed": 0}),
)
```

## Hidden checks

```python
# Add flaky subscriber, trigger DLQ, verify 403 for operator and 200 replay for admin
_call("POST", "/subscriptions", {"pattern": "supply.*", "target": "flaky"}, token=mara)
expect("flaky subscriber dead-letters while down", lambda: _call("POST", "/publish", {"event_id": "s1", "topic": "supply.low", "payload": {"sku": "FUEL"}}, token=mara), (200, {"delivered": 0, "failed": 1, "skipped": 0, "suppressed": 0}))
expect("non-admin cannot replay dead letters (403)", lambda: _call("POST", "/dead-letters/replay", {}, token=mara)[0], 403)

fail_target[0] = False
expect("admin replays dead letter cleanly", lambda: _call("POST", "/dead-letters/replay", {}, token=admin), (200, {"replayed": 1, "remaining": 0}))

# Stats check: 3 subs, 5 delivered (old-1 + e1 legacy + e2 legacy + e2 night + replayed s1), 1 suppressed (e1 night), 0 dead_letters
expect(
    "GET /stats reports accurate live counts",
    lambda: _call("GET", "/stats", token=mara),
    (200, {"subscriptions": 3, "delivered": 5, "suppressed": 1, "dead_letters": 0}),
)

# Outside quiet hours (hour 10): night-pager receives normal events
clock[0] = 10 * 3600
expect(
    "normal event at hour 10 delivers to night-pager too",
    lambda: _call("POST", "/publish", {"event_id": "e3", "topic": "weather.clear", "payload": {}}, token=mara),
    (200, {"delivered": 2, "failed": 0, "skipped": 0, "suppressed": 0}),
)

# Validation checks
expect("invalid priority returns 400", lambda: _call("POST", "/publish", {"event_id": "e4", "topic": "weather.a", "payload": {}, "priority": "urgent"}, token=mara)[0], 400)
expect("invalid quiet_start=25 returns 400", lambda: _call("POST", "/subscriptions", {"pattern": "a.*", "target": "t", "quiet_start": 25, "quiet_end": 6}, token=mara)[0], 400)
expect("half-specified quiet hours returns 400", lambda: _call("POST", "/subscriptions", {"pattern": "a.*", "target": "t", "quiet_start": 22}, token=mara)[0], 400)
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


def _in_quiet_hours(hour, start, end):
    if start is None or end is None:
        return False
    if start < end:
        return start <= hour < end
    if start > end:
        return hour >= start or hour < end
    return False


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
                quiet_start INTEGER,
                quiet_end INTEGER,
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
                priority TEXT NOT NULL DEFAULT 'normal',
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
        sub_cols = {r[1] for r in self.conn.execute("PRAGMA table_info(subscriptions)").fetchall()}
        if "quiet_start" not in sub_cols:
            self.conn.execute("ALTER TABLE subscriptions ADD COLUMN quiet_start INTEGER")
        if "quiet_end" not in sub_cols:
            self.conn.execute("ALTER TABLE subscriptions ADD COLUMN quiet_end INTEGER")
        del_cols = {r[1] for r in self.conn.execute("PRAGMA table_info(deliveries)").fetchall()}
        if "priority" not in del_cols:
            self.conn.execute("ALTER TABLE deliveries ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal'")
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
            qs = body.get("quiet_start")
            qe = body.get("quiet_end")
            if not isinstance(pattern, str) or not pattern or not isinstance(target, str) or not target:
                return self._resp(400, {"error": "invalid subscription"})
            if (qs is None) != (qe is None):
                return self._resp(400, {"error": "quiet_start and quiet_end must both be set"})
            if qs is not None:
                if (
                    isinstance(qs, bool)
                    or isinstance(qe, bool)
                    or not isinstance(qs, int)
                    or not isinstance(qe, int)
                    or not (0 <= qs <= 23)
                    or not (0 <= qe <= 23)
                ):
                    return self._resp(400, {"error": "quiet hours must be 0..23"})
            try:
                cur = self.conn.execute(
                    "INSERT INTO subscriptions (owner, pattern, target, quiet_start, quiet_end) VALUES (?, ?, ?, ?, ?)",
                    (claims["sub"], pattern, target, qs, qe),
                )
                self.conn.commit()
                return self._resp(
                    201,
                    {
                        "id": cur.lastrowid,
                        "owner": claims["sub"],
                        "pattern": pattern,
                        "target": target,
                        "quiet_start": qs,
                        "quiet_end": qe,
                    },
                )
            except sqlite3.IntegrityError:
                self.conn.rollback()
                return self._resp(409, {"error": "duplicate subscription"})

        if method == "GET" and path == "/subscriptions":
            rows = self.conn.execute(
                "SELECT id, owner, pattern, target, quiet_start, quiet_end FROM subscriptions WHERE owner = ? ORDER BY id ASC",
                (claims["sub"],),
            ).fetchall()
            return self._resp(
                200,
                [
                    {
                        "id": r[0],
                        "owner": r[1],
                        "pattern": r[2],
                        "target": r[3],
                        "quiet_start": r[4],
                        "quiet_end": r[5],
                    }
                    for r in rows
                ],
            )

        if method == "POST" and path == "/publish":
            body = self._read_json(request)
            if not body:
                return self._resp(400, {"error": "invalid json"})
            event_id = body.get("event_id")
            topic = body.get("topic")
            payload = body.get("payload")
            priority = body.get("priority", "normal")
            if (
                not isinstance(event_id, str)
                or not event_id
                or not isinstance(topic, str)
                or not topic
                or not isinstance(payload, dict)
                or priority not in ("normal", "emergency")
            ):
                return self._resp(400, {"error": "invalid event"})
            hour = (self.now_fn() // 3600) % 24
            subs = self.conn.execute(
                "SELECT id, pattern, target, quiet_start, quiet_end FROM subscriptions ORDER BY id ASC"
            ).fetchall()
            delivered = failed = skipped = suppressed = 0
            event = {"id": event_id, "topic": topic, "payload": payload}
            for sub_id, pattern, target, qs, qe in subs:
                if not _matches(pattern, topic):
                    continue
                if self.conn.execute(
                    "SELECT 1 FROM deliveries WHERE sub_id = ? AND event_id = ?",
                    (sub_id, event_id),
                ).fetchone() is not None:
                    skipped += 1
                    continue
                if priority != "emergency" and _in_quiet_hours(hour, qs, qe):
                    self.conn.execute(
                        "INSERT INTO deliveries (sub_id, event_id, topic, status, priority) VALUES (?, ?, ?, 'suppressed', ?)",
                        (sub_id, event_id, topic, priority),
                    )
                    suppressed += 1
                    continue
                try:
                    self.deliver_fn(target, event)
                    self.conn.execute(
                        "INSERT INTO deliveries (sub_id, event_id, topic, status, priority) VALUES (?, ?, ?, 'delivered', ?)",
                        (sub_id, event_id, topic, priority),
                    )
                    delivered += 1
                except Exception as exc:
                    self.conn.execute(
                        "INSERT INTO dead_letters (sub_id, event_id, topic, payload_json, error) VALUES (?, ?, ?, ?, ?)",
                        (sub_id, event_id, topic, json.dumps(payload), str(exc)),
                    )
                    failed += 1
            self.conn.commit()
            return self._resp(
                200,
                {"delivered": delivered, "failed": failed, "skipped": skipped, "suppressed": suppressed},
            )

        if method == "POST" and path == "/dead-letters/replay":
            if claims.get("role") != "admin":
                return self._resp(403, {"error": "forbidden"})
            rows = self.conn.execute(
                """
                SELECT d.id, d.sub_id, d.event_id, d.topic, d.payload_json, s.target
                FROM dead_letters d
                INNER JOIN subscriptions s ON s.id = d.sub_id
                ORDER BY d.id ASC
                """
            ).fetchall()
            replayed = 0
            remaining = 0
            for dl_id, sub_id, event_id, topic, payload_json, target in rows:
                event = {"id": event_id, "topic": topic, "payload": json.loads(payload_json)}
                try:
                    self.deliver_fn(target, event)
                    self.conn.execute(
                        "INSERT OR IGNORE INTO deliveries (sub_id, event_id, topic, status, priority) VALUES (?, ?, ?, 'delivered', 'normal')",
                        (sub_id, event_id, topic),
                    )
                    self.conn.execute("DELETE FROM dead_letters WHERE id = ?", (dl_id,))
                    replayed += 1
                except Exception as exc:
                    self.conn.execute("UPDATE dead_letters SET error = ? WHERE id = ?", (str(exc), dl_id))
                    remaining += 1
            self.conn.commit()
            return self._resp(200, {"replayed": replayed, "remaining": remaining})

        if method == "GET" and path == "/stats":
            subs_n = self.conn.execute("SELECT COUNT(*) FROM subscriptions").fetchone()[0]
            del_n = self.conn.execute("SELECT COUNT(*) FROM deliveries WHERE status = 'delivered'").fetchone()[0]
            sup_n = self.conn.execute("SELECT COUNT(*) FROM deliveries WHERE status = 'suppressed'").fetchone()[0]
            dl_n = self.conn.execute("SELECT COUNT(*) FROM dead_letters").fetchone()[0]
            return self._resp(
                200,
                {"subscriptions": subs_n, "delivered": del_n, "suppressed": sup_n, "dead_letters": dl_n},
            )

        return self._resp(404, {"error": "not found"})
```

## Restored

The change request shipped cleanly on top of live data: zero broken callers, quiet hours respected, emergencies always breaking through, and admins able to replay dead letters on demand. Every lamp across all nine regions of Kestrel Ridge is lit.
