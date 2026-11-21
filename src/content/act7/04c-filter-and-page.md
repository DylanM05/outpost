---
id: filter-and-page
title: Filter and page
system: Query desk
symbol: equipment
scene: tests
skills: sql
---

## Briefing

The exchange catalog grows every week, and operators search it by category, name substring, and minimum stock — one page at a time. Let SQLite do the filtering, sorting, and pagination directly instead of loading every row into Python first.

## Objective

Write `search_supplies(conn, category=None, query=None, min_qty=0, page=1, page_size=5)`.

Given `supplies(id, sku, name, category, quantity)`:

- Filter to rows where `quantity >= min_qty`.
- If `category is not None`, also require `category = ?`.
- If `query is not None`, also require `name LIKE ?` matching anywhere inside `name` (`f"%{query}%"`, case-insensitive in SQLite for ASCII).
- Order results by `quantity DESC, sku ASC` (highest stock first, breaking ties alphabetically by `sku`).
- Return only page `page` (1-indexed) of size `page_size` using `LIMIT ? OFFSET ?`, as a list of `(sku, name, quantity)` tuples.

```python
search_supplies(conn, category="fuel", min_qty=5, page=1, page_size=2)
# [("FUEL-A", "Jet fuel", 20), ("FUEL-B", "Lamp oil", 8)]
```

## Concept

Combining optional filters dynamically while keeping every value parameterized is a daily backend pattern:

```python
clauses = ["quantity >= ?"]
params = [min_qty]
if category is not None:
    clauses.append("category = ?")
    params.append(category)
where = " AND ".join(clauses)
sql = f"SELECT sku, name, quantity FROM supplies WHERE {where} ORDER BY quantity DESC, sku ASC LIMIT ? OFFSET ?"
params.extend([page_size, (page - 1) * page_size])
```

Notice what's interpolated into `sql`: **only hardcoded column/clause strings** (`"category = ?"`), never user data! Every value still goes through `params`.

And `OFFSET` for 1-indexed `page` is `(page - 1) * page_size`: page 1 skips `0` rows, page 2 skips `page_size` rows.

## Hints

1. Start `clauses = ["quantity >= ?"]` and `params = [min_qty]`.
2. Append `"category = ?"` / `category` when `category is not None`, and `"name LIKE ?"` / `f"%{query}%"` when `query is not None`.
3. Add `ORDER BY quantity DESC, sku ASC LIMIT ? OFFSET ?` with `page_size` and `(page - 1) * page_size`.

## Starter: guided

```python
def search_supplies(conn, category=None, query=None, min_qty=0, page=1, page_size=5):
    clauses = ["quantity >= ?"]
    params = [min_qty]
    if category is not None:
        clauses.append("category = ?")
        params.append(category)
    # Add optional name LIKE ? filter, then build SELECT ... ORDER BY ... LIMIT ? OFFSET ?.
    return []
```

## Starter: standard

```python
def search_supplies(conn, category=None, query=None, min_qty=0, page=1, page_size=5):
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
        ("F-3", "Reserve oil", "fuel", 2),
        ("G-1", "Ice rope", "gear", 8),
        ("G-2", "Climbing rope", "gear", 15),
        ("G-3", "Spare bulb", "gear", 0),
    ],
)

expect(
    "filter by category='fuel' and min_qty=5",
    lambda: get("search_supplies")(conn, category="fuel", min_qty=5),
    [("F-1", "Winter fuel", 20), ("F-2", "Lamp fuel", 8)],
)
expect(
    "substring search query='rope' sorted by quantity DESC",
    lambda: get("search_supplies")(conn, query="rope"),
    [("G-2", "Climbing rope", 15), ("G-1", "Ice rope", 8)],
)
expect(
    "pagination page 1 and page 2 (page_size=2)",
    lambda: (
        get("search_supplies")(conn, page=1, page_size=2),
        get("search_supplies")(conn, page=2, page_size=2),
    ),
    (
        [("F-1", "Winter fuel", 20), ("G-2", "Climbing rope", 15)],
        [("F-2", "Lamp fuel", 8), ("G-1", "Ice rope", 8)],
    ),
)
```

## Hidden checks

```python
expect("page beyond end returns []", lambda: get("search_supplies")(conn, page=5, page_size=2), [])
expect("tie-break by sku ASC when quantities equal", lambda: get("search_supplies")(conn, min_qty=8, page=1, page_size=4), [("F-1", "Winter fuel", 20), ("G-2", "Climbing rope", 15), ("F-2", "Lamp fuel", 8), ("G-1", "Ice rope", 8)])
expect("combined category + query + min_qty", lambda: get("search_supplies")(conn, category="fuel", query="fuel", min_qty=10), [("F-1", "Winter fuel", 20)])
```

## Solution

```python
def search_supplies(conn, category=None, query=None, min_qty=0, page=1, page_size=5):
    clauses = ["quantity >= ?"]
    params = [min_qty]
    if category is not None:
        clauses.append("category = ?")
        params.append(category)
    if query is not None:
        clauses.append("name LIKE ?")
        params.append(f"%{query}%")
    where = " AND ".join(clauses)
    offset = (page - 1) * page_size
    sql = (
        f"SELECT sku, name, quantity FROM supplies "
        f"WHERE {where} "
        f"ORDER BY quantity DESC, sku ASC "
        f"LIMIT ? OFFSET ?"
    )
    params.extend([page_size, offset])
    return conn.execute(sql, params).fetchall()
```

## Restored

Search, category filters, and pagination now run inside SQLite in a single indexed pass.
