---
id: group-and-filter
kind: predict
title: Group and filter
system: Summary counter
symbol: instrument
scene: console
skills: sql, reading-code
---

## Briefing

When the supply officer asks "which categories have at least 15 units in stock, ignoring out-of-stock rows?", SQL has two different filtering clauses: `WHERE` filters individual rows *before* grouping, and `HAVING` filters whole groups *after* `GROUP BY`. Confusing them produces subtly different answers. Trace this query step by step.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

SQL evaluates a `SELECT` query in a fixed logical order:

1. `FROM` — pick the table.
2. `WHERE` — drop individual rows that don't match.
3. `GROUP BY` — collapse remaining rows into one group per distinct key.
4. `HAVING` — drop groups whose aggregate (`COUNT`, `SUM`, `AVG`) doesn't match.
5. `SELECT` & `ORDER BY` — compute output columns and sort them.

You can't put `SUM(qty) >= 15` inside `WHERE`, because sums don't exist until after `GROUP BY`!

## Hints

1. `WHERE qty > 0` drops the zero-qty row `("gear", 0)` before grouping — so `"gear"` only has `2` rows counted, not `3`!
2. Group sums after `WHERE`: `"fuel"` has `2` rows totaling `18`; `"gear"` has `2` rows totaling `15`; `"med"` has `1` row totaling `5`.
3. `HAVING SUM(qty) >= 15` drops `"med"`, and `ORDER BY category ASC` puts `"fuel"` before `"gear"`.

## Program

```python
import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE stock (category TEXT, qty INTEGER)")
conn.executemany(
    "INSERT INTO stock VALUES (?, ?)",
    [
        ("fuel", 10),
        ("fuel", 8),
        ("gear", 10),
        ("gear", 5),
        ("gear", 0),
        ("med", 5),
    ],
)

rows = conn.execute(
    """
    SELECT category, COUNT(*), SUM(qty)
    FROM stock
    WHERE qty > 0
    GROUP BY category
    HAVING SUM(qty) >= 15
    ORDER BY category ASC
    """
).fetchall()

for row in rows:
    print(row)
```

## Output

```text
('fuel', 2, 18)
('gear', 2, 15)
```

## Restored

You traced the exact boundary between `WHERE` (row filtering before grouping) and `HAVING` (group filtering after aggregation).
