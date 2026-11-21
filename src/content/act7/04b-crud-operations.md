---
id: crud-operations
title: Crud operations
system: Query desk
symbol: equipment
scene: tests
skills: sql
---

## Briefing

Almost every backend service rests on four database operations: **Create, Read, Update, and Delete (CRUD)**. Wire up the query desk's four helpers against the `supplies` table so callers can look up an item, change its stock level, adjust stock safely, and retire discontinued items.

## Objective

Given a `supplies(id, sku, name, category, quantity)` table, write four parameterized functions:

1. `get_by_sku(conn, sku)`: returns a dict `{"id": ..., "sku": ..., "name": ..., "category": ..., "quantity": ...}` for the matching row, or `None` if not found.
2. `set_quantity(conn, sku, quantity)`: sets `quantity` for `sku`, commits, and returns `True` if a row was updated or `False` if `sku` wasn't found. (If `quantity < 0`, return `False` without crashing.)
3. `adjust_quantity(conn, sku, delta)`: adds `delta` (positive or negative) to `quantity` for `sku` only if `quantity + delta >= 0`, commits, and returns `True` if updated or `False` otherwise.
4. `delete_by_sku(conn, sku)`: deletes the row with `sku`, commits, and returns `True` if a row was deleted or `False` if not found.

```python
get_by_sku(conn, "FUEL-1")          # {"id": 1, "sku": "FUEL-1", ...}
adjust_quantity(conn, "FUEL-1", -5) # True (when quantity >= 5)
delete_by_sku(conn, "MISSING")      # False
```

## Concept

`UPDATE` and `DELETE` both need a `WHERE` clause (forgetting `WHERE` updates or deletes **every** row in the table!), and `cursor.rowcount` tells you how many rows matched:

```python
cur = conn.execute(
    "UPDATE supplies SET quantity = quantity + ? WHERE sku = ? AND quantity + ? >= 0",
    (delta, sku, delta),
)
conn.commit()
return cur.rowcount == 1
```

Checking `quantity + ? >= 0` directly inside the `WHERE` clause makes `adjust_quantity` atomic — no separate `SELECT` needed!

## Hints

1. In `get_by_sku`, select the 5 columns explicitly (`SELECT id, sku, name, category, quantity FROM supplies WHERE sku = ?`), call `.fetchone()`, and build the dict if not `None`.
2. In `set_quantity`, check `if quantity < 0: return False` (or catch `sqlite3.IntegrityError`), then run `UPDATE supplies SET quantity = ? WHERE sku = ?` and check `cur.rowcount > 0`.
3. In `adjust_quantity`, use `WHERE sku = ? AND quantity + ? >= 0` so going negative updates 0 rows and returns `False`.
4. In `delete_by_sku`, run `DELETE FROM supplies WHERE sku = ?`, commit, and return `cur.rowcount > 0`.

## Starter: guided

```python
import sqlite3


def get_by_sku(conn, sku):
    row = conn.execute(
        "SELECT id, sku, name, category, quantity FROM supplies WHERE sku = ?",
        (sku,),
    ).fetchone()
    # Return None if row is None, otherwise return the dict.
    return None


def set_quantity(conn, sku, quantity):
    if quantity < 0:
        return False
    # UPDATE supplies SET quantity = ? WHERE sku = ?, commit, return cur.rowcount > 0.
    return False


def adjust_quantity(conn, sku, delta):
    # UPDATE atomically only when quantity + delta >= 0.
    return False


def delete_by_sku(conn, sku):
    # DELETE FROM supplies WHERE sku = ?, commit, return cur.rowcount > 0.
    return False
```

## Starter: standard

```python
import sqlite3


def get_by_sku(conn, sku):
    return None


def set_quantity(conn, sku, quantity):
    return False


def adjust_quantity(conn, sku, delta):
    return False


def delete_by_sku(conn, sku):
    return False
```

## Starter: challenge

```python
```

## Checks

```python
import sqlite3 as _sq

def _db():
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
    c.execute("INSERT INTO supplies (sku, name, category, quantity) VALUES ('FUEL-1', 'Winter fuel', 'fuel', 10)")
    c.execute("INSERT INTO supplies (sku, name, category, quantity) VALUES ('ROPE-1', 'Rope', 'gear', 4)")
    c.commit()
    return c

conn = _db()
expect("get_by_sku finds FUEL-1", lambda: get("get_by_sku")(conn, "FUEL-1"), {"id": 1, "sku": "FUEL-1", "name": "Winter fuel", "category": "fuel", "quantity": 10})
expect("get_by_sku missing returns None", lambda: get("get_by_sku")(conn, "NOPE"), None)
expect("set_quantity updates existing row", lambda: (get("set_quantity")(conn, "FUEL-1", 25), get("get_by_sku")(conn, "FUEL-1")["quantity"]), (True, 25))
expect("set_quantity missing returns False", lambda: get("set_quantity")(conn, "NOPE", 5), False)
expect("adjust_quantity subtracts safely", lambda: (get("adjust_quantity")(conn, "ROPE-1", -3), get("get_by_sku")(conn, "ROPE-1")["quantity"]), (True, 1))
expect("adjust_quantity refuses going below zero", lambda: (get("adjust_quantity")(conn, "ROPE-1", -5), get("get_by_sku")(conn, "ROPE-1")["quantity"]), (False, 1))
expect("delete_by_sku removes row", lambda: (get("delete_by_sku")(conn, "ROPE-1"), get("get_by_sku")(conn, "ROPE-1")), (True, None))
```

## Hidden checks

```python
conn2 = _db()
expect("set_quantity rejects negative value cleanly", lambda: (get("set_quantity")(conn2, "FUEL-1", -1), get("get_by_sku")(conn2, "FUEL-1")["quantity"]), (False, 10))
expect("adjust_quantity can hit exact 0", lambda: (get("adjust_quantity")(conn2, "ROPE-1", -4), get("get_by_sku")(conn2, "ROPE-1")["quantity"]), (True, 0))
expect("delete_by_sku missing returns False", lambda: get("delete_by_sku")(conn2, "NOPE"), False)
expect("delete_by_sku leaves other rows intact", lambda: get("get_by_sku")(conn2, "FUEL-1")["quantity"], 10)
```

## Solution

```python
import sqlite3


def get_by_sku(conn, sku):
    row = conn.execute(
        "SELECT id, sku, name, category, quantity FROM supplies WHERE sku = ?",
        (sku,),
    ).fetchone()
    if row is None:
        return None
    return {
        "id": row[0],
        "sku": row[1],
        "name": row[2],
        "category": row[3],
        "quantity": row[4],
    }


def set_quantity(conn, sku, quantity):
    if quantity < 0:
        return False
    cur = conn.execute(
        "UPDATE supplies SET quantity = ? WHERE sku = ?",
        (quantity, sku),
    )
    conn.commit()
    return cur.rowcount > 0


def adjust_quantity(conn, sku, delta):
    cur = conn.execute(
        "UPDATE supplies SET quantity = quantity + ? WHERE sku = ? AND quantity + ? >= 0",
        (delta, sku, delta),
    )
    conn.commit()
    return cur.rowcount > 0


def delete_by_sku(conn, sku):
    cur = conn.execute("DELETE FROM supplies WHERE sku = ?", (sku,))
    conn.commit()
    return cur.rowcount > 0
```

## Restored

The query desk handles every create, read, update, and delete cleanly with parameterized SQL and atomic stock checks.
