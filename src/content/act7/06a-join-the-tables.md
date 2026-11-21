---
id: join-the-tables
kind: predict
title: Join the tables
system: Relational vault
symbol: equipment
scene: console
skills: sql, reading-code
---

## Briefing

Instead of repeating a depot's full name and coordinates on every single shipment row, relational databases **normalize** data into separate tables linked by IDs — and combine them on demand with `JOIN`. The choice between `INNER JOIN` and `LEFT JOIN` decides whether rows with no match stay in the result or disappear. Trace both joins on the same two tables.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

- **`INNER JOIN`**: returns only pairs of rows where both tables match on the `ON` condition. A depot with no shipments disappears.
- **`LEFT JOIN`**: keeps **every** row from the left table (`depots`), filling columns from the right table (`shipments`) with `NULL` (`None` in Python) when there is no match.

Watch `COUNT(*)` vs `COUNT(s.id)` with a `LEFT JOIN`: `COUNT(*)` counts the `NULL`-padded row as `1`, whereas `COUNT(s.id)` ignores `NULL`s and rightly reports `0`!

## Hints

1. `"South"` (id 2) has no shipments.
2. The `INNER JOIN` drops `"South"` and returns only `"North"`'s shipment.
3. The `LEFT JOIN` keeps `"South"` with `None` for the shipment SKU.

## Program

```python
import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE depots (id INTEGER PRIMARY KEY, name TEXT)")
conn.execute("CREATE TABLE shipments (id INTEGER PRIMARY KEY, depot_id INTEGER, sku TEXT)")
conn.executemany("INSERT INTO depots VALUES (?, ?)", [(1, "North"), (2, "South")])
conn.execute("INSERT INTO shipments VALUES (10, 1, 'FUEL')")

inner = conn.execute(
    """
    SELECT d.name, s.sku
    FROM depots d
    INNER JOIN shipments s ON s.depot_id = d.id
    ORDER BY d.name
    """
).fetchall()

left = conn.execute(
    """
    SELECT d.name, s.sku
    FROM depots d
    LEFT JOIN shipments s ON s.depot_id = d.id
    ORDER BY d.name
    """
).fetchall()

print(inner)
print(left)
```

## Output

```text
[('North', 'FUEL')]
[('North', 'FUEL'), ('South', None)]
```

## Restored

You traced how `INNER JOIN` drops unmatched rows while `LEFT JOIN` preserves them with `None`.
