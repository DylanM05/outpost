---
id: depot-totals
title: Depot totals
system: Summary counter
symbol: instrument
scene: tests
skills: sql
---

## Briefing

Morning reports at the exchange need summary numbers across the whole `supplies` table: total stock and average quantity per category, plus a shortlist of categories running low. Write both reports in pure SQL aggregations.

## Objective

Given `supplies(id, sku, name, category, quantity)`, write two functions:

1. `category_summary(conn)`: returns a list of `(category, item_count, total_qty, avg_qty)` tuples — one per category — where `avg_qty` is rounded to 1 decimal place (`ROUND(AVG(quantity), 1)`), ordered by `total_qty DESC, category ASC`.
2. `low_categories(conn, threshold)`: returns a sorted list of category names (`list[str]`) whose total quantity across all their items is strictly less than `threshold` (`HAVING SUM(quantity) < ?`), ordered by `category ASC`.

```python
category_summary(conn)   # [("fuel", 2, 28, 14.0), ("gear", 3, 23, 7.7)]
low_categories(conn, 25) # ["gear"]
```

## Concept

SQL aggregate functions collapse each group into a single value:

- `COUNT(*)` — number of rows in the group.
- `SUM(col)` — total of non-NULL values.
- `AVG(col)` — mean of non-NULL values; `ROUND(AVG(col), 1)` rounds to 1 decimal place.
- `MIN(col)` / `MAX(col)` — smallest and largest values.

You can alias computed columns with `AS total_qty` and sort directly by that alias: `ORDER BY total_qty DESC, category ASC`.

## Hints

1. In `category_summary`, select `category, COUNT(*), SUM(quantity) AS total_qty, ROUND(AVG(quantity), 1)` with `GROUP BY category ORDER BY total_qty DESC, category ASC`.
2. In `low_categories`, use `SELECT category FROM supplies GROUP BY category HAVING SUM(quantity) < ? ORDER BY category ASC` and return `[row[0] for row in rows]`.

## Starter: guided

```python
def category_summary(conn):
    return conn.execute(
        """
        SELECT category, COUNT(*), SUM(quantity) AS total_qty, ROUND(AVG(quantity), 1)
        FROM supplies
        -- Group by category and order by total_qty DESC, category ASC.
        """
    ).fetchall()


def low_categories(conn, threshold):
    # Return a list of category names whose SUM(quantity) < threshold, ordered alphabetically.
    return []
```

## Starter: standard

```python
def category_summary(conn):
    return []


def low_categories(conn, threshold):
    return []
```

## Starter: challenge

```python
```

## Checks

```python
import sqlite3 as _sq

conn = _sq.connect(":memory:")
conn.execute("CREATE TABLE supplies (id INTEGER PRIMARY KEY, sku TEXT, name TEXT, category TEXT, quantity INTEGER)")
conn.executemany(
    "INSERT INTO supplies (sku, name, category, quantity) VALUES (?, ?, ?, ?)",
    [
        ("F-1", "Winter fuel", "fuel", 20),
        ("F-2", "Lamp fuel", "fuel", 8),
        ("G-1", "Rope", "gear", 10),
        ("G-2", "Axe", "gear", 8),
        ("G-3", "Lamp", "gear", 5),
        ("M-1", "Bandage", "medical", 6),
    ],
)

expect(
    "category_summary returns counts, sums, and rounded averages",
    lambda: get("category_summary")(conn),
    [("fuel", 2, 28, 14.0), ("gear", 3, 23, 7.7), ("medical", 1, 6, 6.0)],
)
expect(
    "low_categories(25) finds gear and medical",
    lambda: get("low_categories")(conn, 25),
    ["gear", "medical"],
)
expect(
    "low_categories(6) is strictly less than threshold",
    lambda: get("low_categories")(conn, 6),
    [],
)
```

## Hidden checks

```python
empty = _sq.connect(":memory:")
empty.execute("CREATE TABLE supplies (id INTEGER PRIMARY KEY, sku TEXT, name TEXT, category TEXT, quantity INTEGER)")
expect("empty table category_summary", lambda: get("category_summary")(empty), [])
expect("empty table low_categories", lambda: get("low_categories")(empty, 10), [])

tie = _sq.connect(":memory:")
tie.execute("CREATE TABLE supplies (id INTEGER PRIMARY KEY, sku TEXT, name TEXT, category TEXT, quantity INTEGER)")
tie.executemany(
    "INSERT INTO supplies (sku, name, category, quantity) VALUES (?, ?, ?, ?)",
    [("B-1", "b", "beta", 10), ("A-1", "a", "alpha", 10)],
)
expect("category_summary breaks total_qty ties alphabetically", lambda: get("category_summary")(tie), [("alpha", 1, 10, 10.0), ("beta", 1, 10, 10.0)])
```

## Solution

```python
def category_summary(conn):
    return conn.execute(
        """
        SELECT category, COUNT(*), SUM(quantity) AS total_qty, ROUND(AVG(quantity), 1)
        FROM supplies
        GROUP BY category
        ORDER BY total_qty DESC, category ASC
        """
    ).fetchall()


def low_categories(conn, threshold):
    rows = conn.execute(
        """
        SELECT category
        FROM supplies
        GROUP BY category
        HAVING SUM(quantity) < ?
        ORDER BY category ASC
        """,
        (threshold,),
    ).fetchall()
    return [row[0] for row in rows]
```

## Restored

The summary counter aggregates stock totals and flags low-inventory categories in one query each.
