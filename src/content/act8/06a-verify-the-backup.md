---
id: verify-the-backup
title: Verify the backup
system: Backup vault
symbol: equipment
scene: tests
skills: reliability, sql
---

## Briefing

An untested backup isn't a backup — it's wishful thinking. Build Kestrel Ridge's snapshot tool: export every user table's schema and rows from SQLite into a checksummed JSON snapshot, and verify the SHA-256 checksum before restoring into a clean database so silent disk corruption is caught immediately.

## Objective

Write two functions:

1. `create_snapshot(conn)`:
   - Queries `SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC`.
   - For each table, fetches all rows (`SELECT * FROM "<name>"`) as lists (`[list(r) for r in rows]`).
   - Builds `payload = {"tables": [{"name": name, "sql": sql, "rows": rows}, ...]}`.
   - Computes `checksum = hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()`.
   - Returns `json.dumps({"payload": payload, "checksum": checksum}, sort_keys=True)`.
2. `restore_snapshot(snapshot_text, target_conn)`:
   - Parses `snapshot_text` as JSON (raising `ValueError("corrupt snapshot")` on invalid JSON or missing keys).
   - Recomputes the SHA-256 checksum over `data["payload"]` and verifies it with `hmac.compare_digest` — raising `ValueError("checksum mismatch")` if tampered or corrupted!
   - Executes each table's `sql` on `target_conn` and inserts all its `rows` with parameterized `?` placeholders, commits, and returns the total number of rows restored.

```python
snap = create_snapshot(source_conn)
fresh = sqlite3.connect(":memory:")
restore_snapshot(snap, fresh)  # returns count of restored rows
```

## Concept

Two operational rules for real backups:

1. **Checksum everything** so bit rot or truncated transfers fail loudly before overwriting good data.
2. **Practice restores into a fresh database** — that's the only way to know your backup actually contains every table and constraint you expect!

## Hints

1. Use `json.dumps(payload, sort_keys=True, separators=(",", ":"))` identically in both `create_snapshot` and `restore_snapshot` so the SHA-256 matches deterministically.
2. For inserting each row back: `placeholders = ", ".join(["?"] * len(row))` and `target_conn.execute(f'INSERT INTO "{name}" VALUES ({placeholders})', row)`.
3. Verify the checksum *before* executing any SQL on `target_conn`!

## Starter: guided

```python
import hashlib
import hmac
import json


def _checksum(payload):
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def create_snapshot(conn):
    tables = []
    meta = conn.execute(
        "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC"
    ).fetchall()
    for name, sql in meta:
        rows = [list(r) for r in conn.execute(f'SELECT * FROM "{name}"').fetchall()]
        tables.append({"name": name, "sql": sql, "rows": rows})
    payload = {"tables": tables}
    # Return JSON with "payload" and "checksum".
    return ""


def restore_snapshot(snapshot_text, target_conn):
    # Parse JSON, verify checksum (raise ValueError on mismatch), recreate tables and rows, commit.
    return 0
```

## Starter: standard

```python
import hashlib
import hmac
import json


def create_snapshot(conn):
    return ""


def restore_snapshot(snapshot_text, target_conn):
    return 0
```

## Starter: challenge

```python
```

## Checks

```python
import json as _json, sqlite3 as _sq

src = _sq.connect(":memory:")
src.execute("CREATE TABLE depots (id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
src.execute("CREATE TABLE items (sku TEXT PRIMARY KEY, qty INTEGER)")
src.executemany("INSERT INTO depots VALUES (?, ?)", [(1, "Ridge"), (2, "Valley")])
src.executemany("INSERT INTO items VALUES (?, ?)", [("FUEL", 10), ("ROPE", 4)])
src.commit()

snap = get("create_snapshot")(src)
dst = _sq.connect(":memory:")
restored = get("restore_snapshot")(snap, dst)
expect("restores all 4 rows", lambda: restored, 4)
expect("restored depots match", lambda: dst.execute("SELECT * FROM depots ORDER BY id").fetchall(), [(1, "Ridge"), (2, "Valley")])
expect("restored items match", lambda: dst.execute("SELECT * FROM items ORDER BY sku").fetchall(), [("FUEL", 10), ("ROPE", 4)])

def _tampered_fails():
    tampered = snap.replace("Valley", "Corrupt")
    try:
        get("restore_snapshot")(tampered, _sq.connect(":memory:"))
        return False
    except ValueError:
        return True

check("tampered snapshot raises ValueError", _tampered_fails, "Verify SHA-256 checksum before restoring.")
```

## Hidden checks

```python
def _bad_json_fails():
    try:
        get("restore_snapshot")("{broken", _sq.connect(":memory:"))
        return False
    except ValueError:
        return True

check("corrupt JSON raises ValueError", _bad_json_fails)

empty_src = _sq.connect(":memory:")
empty_src.execute("CREATE TABLE logs (id INTEGER PRIMARY KEY, msg TEXT)")
empty_snap = get("create_snapshot")(empty_src)
empty_dst = _sq.connect(":memory:")
expect("restores empty table schema with 0 rows", lambda: (get("restore_snapshot")(empty_snap, empty_dst), empty_dst.execute("SELECT COUNT(*) FROM logs").fetchone()[0]), (0, 0))
```

## Solution

```python
import hashlib
import hmac
import json


def _checksum(payload):
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def create_snapshot(conn):
    tables = []
    meta = conn.execute(
        "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC"
    ).fetchall()
    for name, sql in meta:
        rows = [list(r) for r in conn.execute(f'SELECT * FROM "{name}"').fetchall()]
        tables.append({"name": name, "sql": sql, "rows": rows})
    payload = {"tables": tables}
    return json.dumps({"payload": payload, "checksum": _checksum(payload)}, sort_keys=True)


def restore_snapshot(snapshot_text, target_conn):
    try:
        data = json.loads(snapshot_text)
    except (json.JSONDecodeError, TypeError):
        raise ValueError("corrupt snapshot")
    if not isinstance(data, dict) or "payload" not in data or "checksum" not in data:
        raise ValueError("corrupt snapshot")
    payload = data["payload"]
    checksum = data["checksum"]
    if not isinstance(checksum, str) or not hmac.compare_digest(_checksum(payload), checksum):
        raise ValueError("checksum mismatch")

    total = 0
    for table in payload["tables"]:
        target_conn.execute(table["sql"])
        name = table["name"]
        for row in table["rows"]:
            placeholders = ", ".join(["?"] * len(row))
            target_conn.execute(f'INSERT INTO "{name}" VALUES ({placeholders})', row)
            total += 1
    target_conn.commit()
    return total
```

## Restored

Every nightly backup now ships with a verified SHA-256 seal and a tested restore path.
