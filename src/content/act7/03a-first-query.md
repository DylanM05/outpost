---
id: first-query
kind: predict
title: First query
system: Ledger schema
symbol: equipment
scene: console
skills: sql, reading-code
---

## Briefing

Keeping the supply exchange's inventory in plain JSON files breaks as soon as two requests write at once or you need to filter and total thousands of records. A **relational database** stores structured rows in tables and answers questions in **SQL**. Python ships with **SQLite** (`import sqlite3`) built in, so you can run real SQL right here. Trace this first SQLite script.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

A SQL table has named columns with types (`INTEGER`, `TEXT`, `REAL`). In Python's `sqlite3`:

- `conn = sqlite3.connect(":memory:")` opens a fresh database in memory.
- `conn.execute(sql, params)` runs a SQL statement and returns a cursor whose `.fetchall()` gives a list of row tuples.
- `SELECT name, qty FROM items WHERE qty >= 5 ORDER BY qty DESC` picks columns, filters rows, and sorts the result highest first.

## Hints

1. Three rows are inserted: `("fuel", 12)`, `("rope", 3)`, and `("flare", 8)`.
2. `WHERE qty >= 5` keeps `"fuel"` (12) and `"flare"` (8), skipping `"rope"` (3).
3. `ORDER BY qty DESC` puts the larger quantity first; each row is returned as a tuple.

## Program

```python
import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE items (name TEXT, qty INTEGER)")
conn.execute("INSERT INTO items (name, qty) VALUES (?, ?)", ("fuel", 12))
conn.execute("INSERT INTO items (name, qty) VALUES (?, ?)", ("rope", 3))
conn.execute("INSERT INTO items (name, qty) VALUES (?, ?)", ("flare", 8))

rows = conn.execute(
    "SELECT name, qty FROM items WHERE qty >= 5 ORDER BY qty DESC"
).fetchall()
for row in rows:
    print(row)
```

## Output

```text
('fuel', 12)
('flare', 8)
```

## Restored

You traced your first SQLite query from table creation to sorted tuple results.
