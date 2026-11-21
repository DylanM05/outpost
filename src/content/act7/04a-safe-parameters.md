---
id: safe-parameters
kind: predict
title: Safe parameters
system: Query desk
symbol: equipment
scene: console
skills: sql, reading-code
---

## Briefing

Building a SQL query with an f-string looks harmless until an untrusted string contains a single quote. When someone types `' OR '1'='1` into a search box, string interpolation turns their text into SQL syntax — a **SQL injection** attack that leaks private rows. Trace what the vulnerable query returns versus the parameterized one.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

Never interpolate user input into a SQL string:

```python
# VULNERABLE: attacker input changes the SQL structure!
conn.execute(f"SELECT sku FROM supplies WHERE sku = '{user_input}'")

# SAFE: SQLite treats the ? value purely as data, never as SQL code.
conn.execute("SELECT sku FROM supplies WHERE sku = ?", (user_input,))
```

With `?` placeholders, even `' OR '1'='1` is searched literally as a SKU string, matches nothing, and can never alter the `WHERE` clause.

## Hints

1. The table holds `"FUEL-1"` and `"SECRET-KEY"`.
2. In the f-string query, `WHERE sku = '' OR '1'='1'` is true for **every** row!
3. In the parameterized query, SQLite looks for a SKU literally equal to `"' OR '1'='1"`, which matches zero rows.

## Program

```python
import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE vault (sku TEXT)")
conn.execute("INSERT INTO vault VALUES ('FUEL-1'), ('SECRET-KEY')")

bad_input = "' OR '1'='1"

unsafe = conn.execute(f"SELECT sku FROM vault WHERE sku = '{bad_input}'").fetchall()
safe = conn.execute("SELECT sku FROM vault WHERE sku = ?", (bad_input,)).fetchall()

print([r[0] for r in unsafe])
print([r[0] for r in safe])
```

## Output

```text
['FUEL-1', 'SECRET-KEY']
[]
```

## Restored

You saw firsthand how one quote turns an f-string query into a full-table leak, and how `?` parameters neutralize it completely.
