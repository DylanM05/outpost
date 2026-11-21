---
id: maintenance-unshipped-skus
title: Items never shipped
system: Query desk
symbol: equipment
scene: tests
skills: sql
reviewSkill: sql
prerequisite: normalize-shipments
---

## Briefing

Identify every SKU in the `supplies` catalog that has never appeared in a single shipment row, using a `LEFT JOIN` filter (`WHERE s.sku IS NULL`).

## Objective

Given `supplies(sku TEXT PRIMARY KEY, name TEXT)` and `shipments(id INTEGER PRIMARY KEY, sku TEXT)`, write `unshipped_skus(conn)` returning a sorted list of `sku` strings present in `supplies` that have zero matching rows in `shipments`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. `SELECT p.sku FROM supplies p LEFT JOIN shipments s ON s.sku = p.sku WHERE s.sku IS NULL ORDER BY p.sku ASC`.

## Starter

```python
```

## Checks

```python
import sqlite3 as _sq
c = _sq.connect(":memory:")
c.execute("CREATE TABLE supplies (sku TEXT PRIMARY KEY, name TEXT)")
c.execute("CREATE TABLE shipments (id INTEGER PRIMARY KEY, sku TEXT)")
c.executemany("INSERT INTO supplies VALUES (?, ?)", [("FUEL", "Fuel"), ("ROPE", "Rope"), ("AXE", "Axe")])
c.execute("INSERT INTO shipments VALUES (1, 'FUEL')")
expect("finds AXE and ROPE sorted", lambda: get("unshipped_skus")(c), ["AXE", "ROPE"])
```

## Hidden checks

```python
c.execute("INSERT INTO shipments VALUES (2, NULL)")
expect("handles NULL sku in shipments safely", lambda: get("unshipped_skus")(c), ["AXE", "ROPE"])
```

## Solution

```python
def unshipped_skus(conn):
    rows = conn.execute(
        """
        SELECT p.sku
        FROM supplies p
        LEFT JOIN shipments s ON s.sku = p.sku
        WHERE s.sku IS NULL
        ORDER BY p.sku ASC
        """
    ).fetchall()
    return [r[0] for r in rows]
```

## Restored

Unshipped catalog items show up immediately without falling for the `NULL` subquery trap.
