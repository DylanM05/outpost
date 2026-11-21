---
id: maintenance-top-stocked
title: Top stocked items
system: Query desk
symbol: equipment
scene: tests
skills: sql
reviewSkill: sql
prerequisite: normalize-shipments
---

## Briefing

Pull the top `n` highest-quantity items in a given category from the `supplies` table using parameterized SQL.

## Objective

Given `supplies(sku TEXT, category TEXT, quantity INTEGER)`, write `top_in_category(conn, category, limit)` returning up to `limit` `(sku, quantity)` tuples in that `category`, ordered by `quantity DESC, sku ASC`.

```python
top_in_category(conn, "fuel", 2)  # [("F-1", 30), ("F-2", 12)]
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `SELECT sku, quantity FROM supplies WHERE category = ? ORDER BY quantity DESC, sku ASC LIMIT ?` with `(category, limit)`.

## Starter

```python
```

## Checks

```python
import sqlite3 as _sq
c = _sq.connect(":memory:")
c.execute("CREATE TABLE supplies (sku TEXT, category TEXT, quantity INTEGER)")
c.executemany("INSERT INTO supplies VALUES (?, ?, ?)", [("F-2", "fuel", 12), ("F-1", "fuel", 30), ("F-3", "fuel", 5), ("G-1", "gear", 99)])
expect("top 2 in fuel", lambda: get("top_in_category")(c, "fuel", 2), [("F-1", 30), ("F-2", 12)])
```

## Hidden checks

```python
expect("unknown category returns []", lambda: get("top_in_category")(c, "none", 5), [])
expect("SQL injection attempt returns [] safely", lambda: get("top_in_category")(c, "' OR '1'='1", 5), [])
```

## Solution

```python
def top_in_category(conn, category, limit):
    return conn.execute(
        """
        SELECT sku, quantity
        FROM supplies
        WHERE category = ?
        ORDER BY quantity DESC, sku ASC
        LIMIT ?
        """,
        (category, limit),
    ).fetchall()
```

## Restored

The query desk pulls top-stocked items per category cleanly and safely.
