---
id: enforce-the-rules
title: Enforce the rules
system: Ledger schema
symbol: equipment
scene: tests
skills: sql, errors
---

## Briefing

Now that the `supplies` table enforces constraints, write the Python layer that inserts new supply items safely and turns database constraint errors into clear results for callers — instead of letting an unhandled `IntegrityError` crash the exchange.

## Objective

Write `add_supply(conn, sku, name, category="general", quantity=0)`.

- Insert a row into `supplies (sku, name, category, quantity)` using parameterized `?` placeholders and commit.
- On success, return `(True, row_id)` where `row_id` is `cursor.lastrowid`.
- If SQLite raises `sqlite3.IntegrityError` (duplicate SKU, negative quantity, or `None` for a required column), roll back (`conn.rollback()`) and return `(False, "integrity error")` (any non-empty string works as the second element).

```python
add_supply(conn, "FUEL-1", "Winter fuel", "fuel", 20)   # (True, 1)
add_supply(conn, "FUEL-1", "Duplicate", "fuel", 5)      # (False, "integrity error")
add_supply(conn, "BAD-1", "Broken", "fuel", -3)         # (False, "integrity error")
```

## Concept

When you execute an `INSERT`, SQLite's cursor gives you `cursor.lastrowid` — the auto-generated `id` of the row you just inserted:

```python
try:
    cur = conn.execute(
        "INSERT INTO supplies (sku, name, category, quantity) VALUES (?, ?, ?, ?)",
        (sku, name, category, quantity),
    )
    conn.commit()
    return (True, cur.lastrowid)
except sqlite3.IntegrityError as exc:
    conn.rollback()
    return (False, str(exc))
```

Notice the `?` placeholders: the values are passed separately as a tuple, never glued into the SQL string with `+` or f-strings.

## Hints

1. Use `cur = conn.execute("INSERT INTO supplies (sku, name, category, quantity) VALUES (?, ?, ?, ?)", (sku, name, category, quantity))`.
2. Call `conn.commit()` and return `(True, cur.lastrowid)`.
3. Catch `sqlite3.IntegrityError`, call `conn.rollback()`, and return `(False, str(exc))`.

## Starter: guided

```python
import sqlite3


def add_supply(conn, sku, name, category="general", quantity=0):
    try:
        # Execute a parameterized INSERT, commit, and return (True, cur.lastrowid).
        return (False, "not implemented")
    except sqlite3.IntegrityError as exc:
        conn.rollback()
        return (False, str(exc))
```

## Starter: standard

```python
import sqlite3


def add_supply(conn, sku, name, category="general", quantity=0):
    return (False, "not implemented")
```

## Starter: challenge

```python
```

## Checks

```python
import sqlite3 as _sq

def _fresh():
    c = _sq.connect(":memory:")
    c.execute("""
        CREATE TABLE supplies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'general',
            quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0)
        )
    """)
    return c

conn = _fresh()
expect("first insert returns (True, 1)", lambda: get("add_supply")(conn, "FUEL-1", "Winter fuel", "fuel", 20), (True, 1))
expect("second insert returns (True, 2)", lambda: get("add_supply")(conn, "ROPE-1", "Rope"), (True, 2))
expect("duplicate sku returns (False, reason)", lambda: get("add_supply")(conn, "FUEL-1", "Dup", "fuel", 5)[0], False)
expect("negative quantity returns (False, reason)", lambda: get("add_supply")(conn, "BAD-1", "Bad", "fuel", -1)[0], False)
```

## Hidden checks

```python
expect("NULL name rejected cleanly", lambda: get("add_supply")(conn, "BAD-2", None)[0], False)
expect("quotes in name handled safely via parameters", lambda: get("add_supply")(conn, "O-1", "O'Neill's Lamp", "gear", 3), (True, 3), "Use ? placeholders so quotes inside text never break SQL.")
expect("stored row matches", lambda: conn.execute("SELECT sku, name, category, quantity FROM supplies WHERE sku = ?", ("O-1",)).fetchone(), ("O-1", "O'Neill's Lamp", "gear", 3))
```

## Solution

```python
import sqlite3


def add_supply(conn, sku, name, category="general", quantity=0):
    try:
        cur = conn.execute(
            "INSERT INTO supplies (sku, name, category, quantity) VALUES (?, ?, ?, ?)",
            (sku, name, category, quantity),
        )
        conn.commit()
        return (True, cur.lastrowid)
    except sqlite3.IntegrityError as exc:
        conn.rollback()
        return (False, str(exc))
```

## Restored

Inserts now catch constraint violations cleanly and preserve quotes and special characters through parameterized queries.
