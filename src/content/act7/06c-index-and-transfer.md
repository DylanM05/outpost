---
id: index-and-transfer
title: Index and transfer
system: Relational vault
symbol: equipment
scene: tests
skills: sql, errors
---

## Briefing

Two problems hit every growing database:

1. Looking up a depot's recent shipments scans the entire `shipments` table unless there is an **index** on `(depot_id, created_at)`.
2. Moving stock from one account to another takes *two* updates (subtract from sender, add to receiver). If the second update fails — say the receiver doesn't exist — committing halfway destroys stock! Wrap both updates in a **transaction** so either both succeed or neither happens.

## Objective

Write two functions:

1. `add_shipment_index(conn)`: creates an index named `idx_shipments_depot_time` on `shipments (depot_id, created_at)` (using `CREATE INDEX IF NOT EXISTS`) and commits.
2. `transfer_stock(conn, from_sku, to_sku, amount)`:
   - Operates on `accounts (sku TEXT PRIMARY KEY, quantity INTEGER NOT NULL CHECK (quantity >= 0))`.
   - If `amount <= 0` or `from_sku == to_sku`, return `False` without changing anything.
   - Inside a single transaction:
     1. Subtract `amount` from `from_sku` (only if `quantity >= amount`, checking `rowcount == 1`).
     2. Add `amount` to `to_sku` (checking `rowcount == 1`).
     - If **either** step updates 0 rows (missing SKU or insufficient stock), call `conn.rollback()` and return `False` so `from_sku`'s balance is completely restored!
     - If both succeed, call `conn.commit()` and return `True`.

```python
transfer_stock(conn, "RIDGE-FUEL", "MISSING-SKU", 5)  # False — RIDGE-FUEL is unchanged!
transfer_stock(conn, "RIDGE-FUEL", "VALLEY-FUEL", 5)  # True — both updated atomically
```

## Concept

A database **index** is a B-tree built alongside the table (just like the search trees from the deep survey!). You can inspect whether SQLite uses your index with `EXPLAIN QUERY PLAN`:

- Without an index: `SCAN shipments` (`O(n)` — reads every row).
- With an index: `SEARCH shipments USING INDEX idx_shipments_depot_time (depot_id=?)` (`O(log n)`).

A **transaction** makes multiple statements all-or-nothing (**atomic**): changes aren't permanent until `conn.commit()`, and `conn.rollback()` undoes every uncommitted statement since the last commit.

## Hints

1. `CREATE INDEX IF NOT EXISTS idx_shipments_depot_time ON shipments (depot_id, created_at)`.
2. In `transfer_stock`, make sure you do **not** call `conn.commit()` between the two `UPDATE` statements!
3. If the first `UPDATE` has `cur1.rowcount != 1`, rollback and return `False`. Then run the second `UPDATE`; if `cur2.rowcount != 1`, call `conn.rollback()` and return `False`. Only call `conn.commit()` after both succeed.

## Starter: guided

```python
def add_shipment_index(conn):
    # Create index idx_shipments_depot_time on shipments (depot_id, created_at) and commit.
    pass


def transfer_stock(conn, from_sku, to_sku, amount):
    if amount <= 0 or from_sku == to_sku:
        return False
    cur1 = conn.execute(
        "UPDATE accounts SET quantity = quantity - ? WHERE sku = ? AND quantity >= ?",
        (amount, from_sku, amount),
    )
    if cur1.rowcount != 1:
        conn.rollback()
        return False
    # Update to_sku; if cur2.rowcount != 1, rollback and return False! Otherwise commit and return True.
    conn.commit()
    return True
```

## Starter: standard

```python
def add_shipment_index(conn):
    pass


def transfer_stock(conn, from_sku, to_sku, amount):
    return False
```

## Starter: challenge

```python
```

## Checks

```python
import sqlite3 as _sq

conn = _sq.connect(":memory:")
conn.execute("CREATE TABLE shipments (id INTEGER PRIMARY KEY, depot_id INTEGER, created_at TEXT, sku TEXT)")
conn.execute("CREATE TABLE accounts (sku TEXT PRIMARY KEY, quantity INTEGER NOT NULL CHECK (quantity >= 0))")
conn.executemany("INSERT INTO accounts VALUES (?, ?)", [("A", 20), ("B", 5)])
conn.commit()

get("add_shipment_index")(conn)
plan = " ".join(str(r[-1]) for r in conn.execute("EXPLAIN QUERY PLAN SELECT * FROM shipments WHERE depot_id = 1 ORDER BY created_at").fetchall())
check(
    "query plan uses idx_shipments_depot_time",
    lambda: "idx_shipments_depot_time" in plan,
    f"Expected query plan to use idx_shipments_depot_time, got: {plan}",
)

expect("valid transfer moves 7 units from A to B", lambda: (get("transfer_stock")(conn, "A", "B", 7), conn.execute("SELECT sku, quantity FROM accounts ORDER BY sku").fetchall()), (True, [("A", 13), ("B", 12)]))
expect(
    "failed transfer to missing SKU rolls back deduction from A",
    lambda: (get("transfer_stock")(conn, "A", "NOPE", 5), conn.execute("SELECT sku, quantity FROM accounts ORDER BY sku").fetchall()),
    (False, [("A", 13), ("B", 12)]),
    "Call conn.rollback() when the second UPDATE affects 0 rows, and don't commit after the first UPDATE.",
)
```

## Hidden checks

```python
expect("insufficient funds returns False and leaves balances untouched", lambda: (get("transfer_stock")(conn, "A", "B", 100), conn.execute("SELECT sku, quantity FROM accounts ORDER BY sku").fetchall()), (False, [("A", 13), ("B", 12)]))
expect("non-positive amount returns False", lambda: get("transfer_stock")(conn, "A", "B", 0), False)
expect("negative amount returns False", lambda: get("transfer_stock")(conn, "A", "B", -3), False)
expect("transfer to self returns False", lambda: get("transfer_stock")(conn, "A", "A", 1), False)
check("add_shipment_index is idempotent", lambda: (get("add_shipment_index")(conn), True)[1], "Use CREATE INDEX IF NOT EXISTS.")
```

## Solution

```python
def add_shipment_index(conn):
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_shipments_depot_time ON shipments (depot_id, created_at)"
    )
    conn.commit()


def transfer_stock(conn, from_sku, to_sku, amount):
    if amount <= 0 or from_sku == to_sku:
        return False
    cur1 = conn.execute(
        "UPDATE accounts SET quantity = quantity - ? WHERE sku = ? AND quantity >= ?",
        (amount, from_sku, amount),
    )
    if cur1.rowcount != 1:
        conn.rollback()
        return False
    cur2 = conn.execute(
        "UPDATE accounts SET quantity = quantity + ? WHERE sku = ?",
        (amount, to_sku),
    )
    if cur2.rowcount != 1:
        conn.rollback()
        return False
    conn.commit()
    return True
```

## Restored

Queries jump straight into the depot index, and stock transfers commit atomically — never losing a canister if the destination is missing.
