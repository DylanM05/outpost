---
id: normalize-shipments
title: Normalize shipments
system: Relational vault
symbol: equipment
scene: tests
skills: sql
---

## Briefing

Split the exchange's shipping log into two normalized tables — `depots` and `shipments` — linked by a real **foreign key** so no shipment can ever point to a depot that doesn't exist. Then write two join reports: one listing every shipment with its depot's name, and one counting shipments per depot including depots with zero shipments.

## Objective

Write three functions:

1. `setup_vault(conn)`:
   - Enables SQLite foreign key enforcement with `PRAGMA foreign_keys = ON`.
   - Creates `depots (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)`.
   - Creates `shipments (id INTEGER PRIMARY KEY AUTOINCREMENT, depot_id INTEGER NOT NULL REFERENCES depots(id), sku TEXT NOT NULL, quantity INTEGER NOT NULL CHECK (quantity > 0))`.
   - Commits.
2. `shipment_manifest(conn)`: returns a list of `(shipment_id, depot_name, sku, quantity)` tuples using `INNER JOIN`, ordered by `shipment_id ASC`.
3. `depot_totals(conn)`: returns a list of `(depot_name, shipment_count, total_units)` tuples for **every** depot (including depots with zero shipments, showing `0` and `0`!) using `LEFT JOIN`, `COUNT(s.id)`, and `COALESCE(SUM(s.quantity), 0)`, ordered by `depot_name ASC`.

```python
depot_totals(conn)  # [("North", 2, 15), ("South", 0, 0)]
```

## Concept

Two SQLite idioms every backend developer uses:

1. SQLite leaves foreign keys **off** by default for legacy reasons, so always run `PRAGMA foreign_keys = ON` on every connection where you want `REFERENCES` enforced.
2. On a `LEFT JOIN`, a depot with zero shipments has `s.id = NULL` and `SUM(s.quantity) = NULL`. Use `COUNT(s.id)` (not `COUNT(*)`, which would return `1`!) and `COALESCE(SUM(s.quantity), 0)` to turn `NULL` into `0`.

## Hints

1. Run `conn.execute("PRAGMA foreign_keys = ON")` first in `setup_vault(conn)`.
2. In `shipment_manifest`, join `shipments s INNER JOIN depots d ON d.id = s.depot_id ORDER BY s.id ASC`.
3. In `depot_totals`, join `depots d LEFT JOIN shipments s ON s.depot_id = d.id GROUP BY d.id, d.name ORDER BY d.name ASC`, selecting `d.name, COUNT(s.id), COALESCE(SUM(s.quantity), 0)`.

## Starter: guided

```python
def setup_vault(conn):
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS depots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
        """
    )
    # Create shipments with FOREIGN KEY depot_id REFERENCES depots(id), sku, quantity > 0.
    conn.commit()


def shipment_manifest(conn):
    return []


def depot_totals(conn):
    # Remember LEFT JOIN, COUNT(s.id), and COALESCE(SUM(s.quantity), 0)!
    return []
```

## Starter: standard

```python
def setup_vault(conn):
    pass


def shipment_manifest(conn):
    return []


def depot_totals(conn):
    return []
```

## Starter: challenge

```python
```

## Checks

```python
import sqlite3 as _sq

conn = _sq.connect(":memory:")
get("setup_vault")(conn)
conn.execute("INSERT INTO depots (name) VALUES ('North')")
conn.execute("INSERT INTO depots (name) VALUES ('South')")
conn.execute("INSERT INTO shipments (depot_id, sku, quantity) VALUES (1, 'FUEL', 10)")
conn.execute("INSERT INTO shipments (depot_id, sku, quantity) VALUES (1, 'ROPE', 5)")
conn.commit()

def _fk_enforced():
    try:
        conn.execute("INSERT INTO shipments (depot_id, sku, quantity) VALUES (999, 'FUEL', 1)")
        return False
    except _sq.IntegrityError:
        return True

check("foreign key rejects unknown depot_id", _fk_enforced, "Run PRAGMA foreign_keys = ON and add REFERENCES depots(id).")
expect("shipment_manifest joins depot names", lambda: get("shipment_manifest")(conn), [(1, "North", "FUEL", 10), (2, "North", "ROPE", 5)])
expect(
    "depot_totals includes South with 0 shipments and 0 units",
    lambda: get("depot_totals")(conn),
    [("North", 2, 15), ("South", 0, 0)],
    "Use LEFT JOIN with COUNT(s.id) and COALESCE(SUM(s.quantity), 0).",
)
```

## Hidden checks

```python
def _rejects_zero_qty():
    try:
        conn.execute("INSERT INTO shipments (depot_id, sku, quantity) VALUES (1, 'X', 0)")
        return False
    except _sq.IntegrityError:
        return True

check("shipments rejects quantity <= 0", _rejects_zero_qty, "Add CHECK (quantity > 0) on quantity.")
conn.execute("INSERT INTO depots (name) VALUES ('Alpha')")
conn.execute("INSERT INTO shipments (depot_id, sku, quantity) VALUES (3, 'FLARE', 4)")
expect("depot_totals orders alphabetically", lambda: get("depot_totals")(conn), [("Alpha", 1, 4), ("North", 2, 15), ("South", 0, 0)])
```

## Solution

```python
def setup_vault(conn):
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS depots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS shipments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            depot_id INTEGER NOT NULL REFERENCES depots(id),
            sku TEXT NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0)
        )
        """
    )
    conn.commit()


def shipment_manifest(conn):
    return conn.execute(
        """
        SELECT s.id, d.name, s.sku, s.quantity
        FROM shipments s
        INNER JOIN depots d ON d.id = s.depot_id
        ORDER BY s.id ASC
        """
    ).fetchall()


def depot_totals(conn):
    return conn.execute(
        """
        SELECT d.name, COUNT(s.id), COALESCE(SUM(s.quantity), 0)
        FROM depots d
        LEFT JOIN shipments s ON s.depot_id = d.id
        GROUP BY d.id, d.name
        ORDER BY d.name ASC
        """
    ).fetchall()
```

## Restored

Foreign keys keep orphan shipments out of the vault, and both `INNER JOIN` and `LEFT JOIN` reports stay accurate even for quiet depots.
