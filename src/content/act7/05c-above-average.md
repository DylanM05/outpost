---
id: above-average
title: Above average
system: Summary counter
symbol: instrument
scene: tests
skills: sql
---

## Briefing

Sometimes one question depends on the answer to another: "which items have more stock than the average item across the whole depot?" or "which depots have never received a shipment?" A SQL **subquery** nests one `SELECT` inside another so the database answers both halves in a single statement.

## Objective

Write two functions:

1. `above_average_skus(conn)`: given `supplies(sku, quantity)`, returns a list of `sku` strings whose `quantity` is strictly greater than the average `quantity` across all rows in `supplies`, ordered by `sku ASC`.
2. `depots_without_shipments(conn)`: given `depots(id, name)` and `shipments(id, depot_id, sku)`, returns a sorted list of depot `name`s whose `id` does **not** appear as `depot_id` in `shipments` (using `NOT IN (SELECT ...)` or `NOT EXISTS`), ordered by `name ASC`.

```python
# Average quantity is 10 -> returns SKUs with quantity > 10:
above_average_skus(conn)        # ["FUEL-1", "ROPE-2"]
depots_without_shipments(conn)  # ["South Pass"]
```

## Concept

A **subquery** is a `SELECT` wrapped in parentheses inside another query:

```sql
SELECT sku
FROM supplies
WHERE quantity > (SELECT AVG(quantity) FROM supplies)
ORDER BY sku ASC
```

And to check membership against another table:

```sql
SELECT name
FROM depots
WHERE id NOT IN (SELECT depot_id FROM shipments WHERE depot_id IS NOT NULL)
ORDER BY name ASC
```

Watch the subtle SQL trap with `NOT IN`: if the subquery ever returns a `NULL`, `x NOT IN (1, NULL)` evaluates to `UNKNOWN` (not true) for *every* row! Filtering `WHERE depot_id IS NOT NULL` (or using `NOT EXISTS`) avoids that trap completely.

## Hints

1. In `above_average_skus`, compare `quantity > (SELECT AVG(quantity) FROM supplies)` and return `[r[0] for r in rows]`.
2. In `depots_without_shipments`, use `WHERE id NOT IN (SELECT depot_id FROM shipments WHERE depot_id IS NOT NULL)` (or `WHERE NOT EXISTS (SELECT 1 FROM shipments WHERE shipments.depot_id = depots.id)`).

## Starter: guided

```python
def above_average_skus(conn):
    rows = conn.execute(
        """
        SELECT sku
        FROM supplies
        -- Filter where quantity > (SELECT AVG(quantity) FROM supplies)
        ORDER BY sku ASC
        """
    ).fetchall()
    return [r[0] for r in rows]


def depots_without_shipments(conn):
    # Return sorted names of depots whose id is not in shipments.depot_id.
    return []
```

## Starter: standard

```python
def above_average_skus(conn):
    return []


def depots_without_shipments(conn):
    return []
```

## Starter: challenge

```python
```

## Checks

```python
import sqlite3 as _sq

conn = _sq.connect(":memory:")
conn.execute("CREATE TABLE supplies (sku TEXT, quantity INTEGER)")
conn.executemany("INSERT INTO supplies VALUES (?, ?)", [("A", 10), ("B", 20), ("C", 30), ("D", 20)])
conn.execute("CREATE TABLE depots (id INTEGER PRIMARY KEY, name TEXT)")
conn.execute("CREATE TABLE shipments (id INTEGER PRIMARY KEY, depot_id INTEGER, sku TEXT)")
conn.executemany("INSERT INTO depots VALUES (?, ?)", [(1, "Ridge"), (2, "Valley"), (3, "South Pass")])
conn.executemany("INSERT INTO shipments VALUES (?, ?, ?)", [(1, 1, "A"), (2, 2, "B")])

expect("above_average_skus (avg is 20 -> only C is > 20)", lambda: get("above_average_skus")(conn), ["C"])
expect("depots_without_shipments finds South Pass", lambda: get("depots_without_shipments")(conn), ["South Pass"])
```

## Hidden checks

```python
# Test NULL depot_id trap in shipments!
conn.execute("INSERT INTO shipments VALUES (3, NULL, 'C')")
expect(
    "depots_without_shipments handles NULL depot_id safely",
    lambda: get("depots_without_shipments")(conn),
    ["South Pass"],
    "Filter `WHERE depot_id IS NOT NULL` in a NOT IN subquery, or use NOT EXISTS.",
)

empty = _sq.connect(":memory:")
empty.execute("CREATE TABLE supplies (sku TEXT, quantity INTEGER)")
expect("empty supplies returns []", lambda: get("above_average_skus")(empty), [])
```

## Solution

```python
def above_average_skus(conn):
    rows = conn.execute(
        """
        SELECT sku
        FROM supplies
        WHERE quantity > (SELECT AVG(quantity) FROM supplies)
        ORDER BY sku ASC
        """
    ).fetchall()
    return [r[0] for r in rows]


def depots_without_shipments(conn):
    rows = conn.execute(
        """
        SELECT name
        FROM depots
        WHERE id NOT IN (
            SELECT depot_id FROM shipments WHERE depot_id IS NOT NULL
        )
        ORDER BY name ASC
        """
    ).fetchall()
    return [r[0] for r in rows]
```

## Restored

Subqueries let the summary counter compare items against depot averages and spot unserved outposts in a single statement.
