---
id: verify-the-hook
title: Verify the hook
system: Webhook relay
symbol: instrument
scene: tests
skills: auth, api-design, sql
---

## Briefing

Instead of Kestrel Ridge polling Valley Station every minute to ask "did a delivery arrive?", Valley Station sends a **webhook** — an HTTP `POST` straight to Kestrel Ridge whenever a shipment lands. Two hazards come with every webhook:

1. **Forged calls:** anyone on the wire could POST a fake restock unless we verify the `X-Signature` HMAC-SHA256 header over the raw request body.
2. **Duplicate deliveries:** if our `200 OK` reply gets lost on the radio, Valley Station will send the exact same webhook again! Without **idempotency**, we'd credit the shipment twice.

## Objective

Write `handle_webhook(conn, request, secret)`.

Tables already exist in `conn`:
- `inventory (sku TEXT PRIMARY KEY, quantity INTEGER NOT NULL)`
- `processed_events (event_id TEXT PRIMARY KEY)`

Behavior:

1. Read `X-Signature` (case-insensitive) from `request["headers"]`. Compute the expected HMAC-SHA256 hex digest of `request["body"].encode("utf-8")` with `secret.encode("utf-8")`. If missing or `not hmac.compare_digest(sig, expected)`, return `(401, {"error": "invalid signature"})`.
2. Parse `request["body"]` as JSON: expects `{"event_id": str, "sku": str, "delta": int}` (`delta > 0`). If invalid JSON or missing/bad fields, return `(400, {"error": "invalid payload"})`.
3. Check if `event_id` is already in `processed_events`:
   - If already processed, **do not modify `inventory`**, and return `(200, {"status": "duplicate"})`.
   - Otherwise, in one transaction: record `event_id` in `processed_events` and add `delta` to `inventory` (inserting `(sku, delta)` if the SKU doesn't exist yet, or adding to existing `quantity` using `INSERT INTO inventory (sku, quantity) VALUES (?, ?) ON CONFLICT(sku) DO UPDATE SET quantity = quantity + excluded.quantity`), commit, and return `(200, {"status": "applied"})`.

## Concept

**Idempotency** means applying the same event twice has the same effect as applying it once. Storing every handled `event_id` as a `PRIMARY KEY` in `processed_events` inside the **same database transaction** as the inventory update guarantees that a retry can never double-credit stock, even if the server crashes right after committing.

SQLite's **upsert** syntax handles both new and existing SKUs in one statement:

```sql
INSERT INTO inventory (sku, quantity) VALUES (?, ?)
ON CONFLICT(sku) DO UPDATE SET quantity = quantity + excluded.quantity
```

## Hints

1. Always verify `X-Signature` over the exact raw `request["body"]` string *before* parsing JSON.
2. Try inserting `event_id` into `processed_events` (or `SELECT 1 FROM processed_events WHERE event_id = ?`). If it already exists, return `(200, {"status": "duplicate"})`.
3. Run the `INSERT ... ON CONFLICT(sku) DO UPDATE ...` and `conn.commit()`, then return `(200, {"status": "applied"})`.

## Starter: guided

```python
import hashlib
import hmac
import json


def handle_webhook(conn, request, secret):
    headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
    sig = headers.get("x-signature", "")
    raw_body = request.get("body", "")
    expected = hmac.new(secret.encode("utf-8"), raw_body.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return (401, {"error": "invalid signature"})
    # Parse JSON, check processed_events for idempotency, upsert inventory, commit.
    return (400, {"error": "not implemented"})
```

## Starter: standard

```python
import hashlib
import hmac
import json


def handle_webhook(conn, request, secret):
    return (400, {"error": "not implemented"})
```

## Starter: challenge

```python
```

## Checks

```python
import hashlib as _hl, hmac as _hm, json as _json, sqlite3 as _sq

SECRET = "hook-secret"

def _db():
    c = _sq.connect(":memory:")
    c.execute("CREATE TABLE inventory (sku TEXT PRIMARY KEY, quantity INTEGER NOT NULL)")
    c.execute("CREATE TABLE processed_events (event_id TEXT PRIMARY KEY)")
    c.execute("INSERT INTO inventory VALUES ('FUEL', 10)")
    c.commit()
    return c

def _signed(payload, sec=SECRET):
    body = _json.dumps(payload)
    sig = _hm.new(sec.encode(), body.encode(), _hl.sha256).hexdigest()
    return {"headers": {"X-Signature": sig}, "body": body}

conn = _db()
ev1 = _signed({"event_id": "evt-1", "sku": "FUEL", "delta": 5})
expect("valid webhook applies stock delta", lambda: (get("handle_webhook")(conn, ev1, SECRET), conn.execute("SELECT quantity FROM inventory WHERE sku='FUEL'").fetchone()[0]), ((200, {"status": "applied"}), 15))
expect("duplicate delivery returns 200 duplicate without double-crediting", lambda: (get("handle_webhook")(conn, ev1, SECRET), conn.execute("SELECT quantity FROM inventory WHERE sku='FUEL'").fetchone()[0]), ((200, {"status": "duplicate"}), 15))
expect("wrong signature rejected with 401", lambda: get("handle_webhook")(conn, _signed({"event_id": "evt-2", "sku": "FUEL", "delta": 99}, sec="wrong"), SECRET)[0], 401)
```

## Hidden checks

```python
ev_new = _signed({"event_id": "evt-3", "sku": "ROPE", "delta": 4})
expect("webhook creates new SKU via upsert", lambda: (get("handle_webhook")(conn, ev_new, SECRET), conn.execute("SELECT quantity FROM inventory WHERE sku='ROPE'").fetchone()[0]), ((200, {"status": "applied"}), 4))
expect("bad delta <= 0 rejected with 400", lambda: get("handle_webhook")(conn, _signed({"event_id": "evt-4", "sku": "FUEL", "delta": 0}), SECRET)[0], 400)
expect("missing signature rejected with 401", lambda: get("handle_webhook")(conn, {"headers": {}, "body": '{"event_id":"e","sku":"FUEL","delta":1}'}, SECRET)[0], 401)
```

## Solution

```python
import hashlib
import hmac
import json


def handle_webhook(conn, request, secret):
    headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
    sig = headers.get("x-signature", "")
    raw_body = request.get("body", "")
    expected = hmac.new(secret.encode("utf-8"), raw_body.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return (401, {"error": "invalid signature"})

    try:
        data = json.loads(raw_body)
    except (json.JSONDecodeError, TypeError):
        return (400, {"error": "invalid payload"})

    if not isinstance(data, dict):
        return (400, {"error": "invalid payload"})
    event_id = data.get("event_id")
    sku = data.get("sku")
    delta = data.get("delta")
    if (
        not isinstance(event_id, str)
        or not event_id
        or not isinstance(sku, str)
        or not sku
        or isinstance(delta, bool)
        or not isinstance(delta, int)
        or delta <= 0
    ):
        return (400, {"error": "invalid payload"})

    seen = conn.execute(
        "SELECT 1 FROM processed_events WHERE event_id = ?",
        (event_id,),
    ).fetchone()
    if seen is not None:
        return (200, {"status": "duplicate"})

    conn.execute("INSERT INTO processed_events (event_id) VALUES (?)", (event_id,))
    conn.execute(
        """
        INSERT INTO inventory (sku, quantity) VALUES (?, ?)
        ON CONFLICT(sku) DO UPDATE SET quantity = quantity + excluded.quantity
        """,
        (sku, delta),
    )
    conn.commit()
    return (200, {"status": "applied"})
```

## Restored

Valley Station's delivery webhooks are signed and idempotent — replays can't double-count a single crate.
