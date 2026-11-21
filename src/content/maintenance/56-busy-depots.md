---
id: maintenance-busy-depots
title: Busy depots
system: Query desk
symbol: equipment
scene: tests
skills: sql
reviewSkill: sql
prerequisite: normalize-shipments
---

## Briefing

Find every depot whose total shipped units across all shipments reaches at least `min_units`, joining `depots` and `shipments` with `GROUP BY` and `HAVING`.

## Objective

Given `depots(id INTEGER PRIMARY KEY, name TEXT)` and `shipments(id INTEGER PRIMARY KEY, depot_id INTEGER, quantity INTEGER)`, write `busy_depots(conn, min_units)` returning a list of `(depot_name, total_units)` tuples for depots with `SUM(quantity) >= min_units`, ordered by `total_units DESC, depot_name ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Join `depots d INNER JOIN shipments s ON s.depot_id = d.id`, `GROUP BY d.id, d.name`, `HAVING SUM(s.quantity) >= ?`, and `ORDER BY total DESC, d.name ASC`.

## Starter

```python
```

## Checks

```python
import sqlite3 as _sq
c = _sq.connect(":memory:")
c.execute("CREATE TABLE depots (id INTEGER PRIMARY KEY, name TEXT)")
c.execute("CREATE TABLE shipments (id INTEGER PRIMARY KEY, depot_id INTEGER, quantity INTEGER)")
c.executemany("INSERT INTO depots VALUES (?, ?)", [(1, "Ridge"), (2, "Valley"), (3, "Pass")])
c.executemany("INSERT INTO shipments VALUES (?, ?, ?)", [(1, 1, 10), (2, 1, 15), (3, 2, 20), (4, 3, 5)])
expect("busy_depots(conn, 20)", lambda: get("busy_depots")(c, 20), [("Ridge", 25), ("Valley", 20)])
```

## Hidden checks

```python
expect("busy_depots(conn, 50) returns []", lambda: get("busy_depots")(c, 50), [])
```

## Solution

```python
def busy_depots(conn, min_units):
    return conn.execute(
        """
        SELECT d.name, SUM(s.quantity) AS total
        FROM depots d
        INNER JOIN shipments s ON s.depot_id = d.id
        GROUP BY d.id, d.name
        HAVING SUM(s.quantity) >= ?
        ORDER BY total DESC, d.name ASC
        """,
        (min_units,),
    ).fetchall()
```

## Restored

The summary report flags high-volume depots in a single grouped join.
