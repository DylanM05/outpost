---
id: create-the-ledger
title: Create the ledger
system: Ledger schema
symbol: equipment
scene: tests
skills: sql
---

## Briefing

A table without rules lets garbage slip in: duplicate SKUs, missing names, or negative stock counts. SQL **constraints** push those invariants down into the database itself, so no buggy script can ever write an impossible row. Build the exchange's `supplies` table schema.

## Objective

Write `init_db(conn)` that creates a table named `supplies` (using `CREATE TABLE IF NOT EXISTS`) with these exact columns and constraints:

- `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
- `sku`: `TEXT NOT NULL UNIQUE`
- `name`: `TEXT NOT NULL`
- `category`: `TEXT NOT NULL DEFAULT 'general'`
- `quantity`: `INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0)`

Commit the connection (`conn.commit()`).

```python
conn = sqlite3.connect(":memory:")
init_db(conn)
conn.execute("INSERT INTO supplies (sku, name) VALUES ('ROPE-1', 'Climbing rope')")
# category defaults to 'general', quantity defaults to 0
```

## Concept

Database **constraints** enforce data integrity automatically on every insert and update:

- `PRIMARY KEY`: uniquely identifies every row (`INTEGER PRIMARY KEY AUTOINCREMENT` assigns `1, 2, 3, ...` automatically).
- `NOT NULL`: refuses `NULL` (`None` in Python).
- `UNIQUE`: refuses duplicate values in that column.
- `DEFAULT ...`: fills in a value when an `INSERT` omits that column.
- `CHECK (condition)`: refuses any row where the condition is false (like `quantity < 0`).

If any constraint is violated, SQLite rejects the statement and raises `sqlite3.IntegrityError`.

## Hints

1. Use a triple-quoted SQL string inside `conn.execute("""CREATE TABLE IF NOT EXISTS supplies (...)""")`.
2. Separate each column definition with a comma, and put `DEFAULT 'general'` and `CHECK (quantity >= 0)` right on their columns.
3. Call `conn.commit()` afterwards.

## Starter: guided

```python
import sqlite3


def init_db(conn):
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS supplies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            -- Add category (TEXT NOT NULL DEFAULT 'general')
            -- and quantity (INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0))
            quantity INTEGER
        )
        """
    )
    conn.commit()
```

## Starter: standard

```python
import sqlite3


def init_db(conn):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
import sqlite3 as _sq

conn = _sq.connect(":memory:")
get("init_db")(conn)
conn.execute("INSERT INTO supplies (sku, name) VALUES (?, ?)", ("ROPE-1", "Climbing rope"))
row = conn.execute("SELECT id, sku, name, category, quantity FROM supplies").fetchone()
expect("defaults fill id=1, category='general', quantity=0", lambda: row, (1, "ROPE-1", "Climbing rope", "general", 0))

def _rejects(sql, params):
    try:
        conn.execute(sql, params)
        return False
    except _sq.IntegrityError:
        return True

check("rejects duplicate sku", lambda: _rejects("INSERT INTO supplies (sku, name) VALUES (?, ?)", ("ROPE-1", "Other")), "Add UNIQUE to sku.")
check("rejects negative quantity", lambda: _rejects("INSERT INTO supplies (sku, name, quantity) VALUES (?, ?, ?)", ("FUEL-1", "Fuel", -5)), "Add CHECK (quantity >= 0) to quantity.")
```

## Hidden checks

```python
check("rejects NULL name", lambda: _rejects("INSERT INTO supplies (sku, name) VALUES (?, ?)", ("X-1", None)), "Add NOT NULL to name.")
check("rejects NULL sku", lambda: _rejects("INSERT INTO supplies (sku, name) VALUES (?, ?)", (None, "No SKU")), "Add NOT NULL to sku.")
check("rejects NULL category", lambda: _rejects("INSERT INTO supplies (sku, name, category) VALUES (?, ?, ?)", ("X-2", "Lamp", None)), "Add NOT NULL to category.")
check("init_db is idempotent (can be called twice)", lambda: (get("init_db")(conn), True)[1], "Use CREATE TABLE IF NOT EXISTS.")
```

## Solution

```python
import sqlite3


def init_db(conn):
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS supplies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'general',
            quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0)
        )
        """
    )
    conn.commit()
```

## Restored

The exchange ledger now rejects duplicate SKUs, missing names, and negative stock at the database level.
