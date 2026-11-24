---
id: sql-strict-generated-tables
kind: code
language: sql
title: Enforce rigid column types with STRICT tables and GENERATED ALWAYS columns
system: Migration bay
symbol: equipment
scene: tests
skills: sql-transactions
---

## Briefing

By default, SQLite uses dynamic type affinity — it will happily store `'not-a-number'` inside an `INTEGER` column! Modern SQLite (3.37+) solves this with **`STRICT` tables**, and eliminates stale derived totals using **`GENERATED ALWAYS AS (...) STORED`** columns.

## Objective

Create a `STRICT` table named `power_bills` with columns:
1. `bill_id INT PRIMARY KEY`
2. `sector TEXT NOT NULL`
3. `kwh INT NOT NULL CHECK (kwh >= 0)`
4. `rate_cents INT NOT NULL CHECK (rate_cents > 0)`
5. `total_cents INT GENERATED ALWAYS AS (kwh * rate_cents) STORED`

Be sure to include the trailing `STRICT` table option!

## Concept

- Adding `STRICT` after the closing parenthesis of `CREATE TABLE (...) STRICT;` makes SQLite reject type mismatches (like inserting `'abc'` into an `INT` column) with an `IntegrityError`.
- In `STRICT` tables, every column must declare one of SQLite's strict types (`INT`, `INTEGER`, `REAL`, `TEXT`, `BLOB`, or `ANY`).
- `total_cents INT GENERATED ALWAYS AS (kwh * rate_cents) STORED` automatically computes and persists `kwh * rate_cents` on every `INSERT` and `UPDATE` — and rejects direct writes to `total_cents`!

## Hints

1. Define `total_cents INT GENERATED ALWAYS AS (kwh * rate_cents) STORED` inside the column list.
2. End the table definition with `) STRICT;`.

## Setup

```sql
-- Fresh database ready for power_bills table creation.
```

## Starter: guided

```sql
CREATE TABLE power_bills (
  bill_id INT PRIMARY KEY,
  sector TEXT NOT NULL,
  kwh INT NOT NULL CHECK (kwh >= 0),
  rate_cents INT NOT NULL CHECK (rate_cents > 0)
  -- Add GENERATED ALWAYS AS (kwh * rate_cents) STORED column total_cents and trailing STRICT
);
```

## Starter: standard

```sql
-- Create STRICT table power_bills with computed STORED column total_cents
```

## Starter: challenge

```sql
```

## Checks

```python
def _test_strict_and_generated():
    conn.execute("INSERT INTO power_bills (bill_id, sector, kwh, rate_cents) VALUES (1, 'north', 40, 15)")
    conn.execute("UPDATE power_bills SET kwh = 50 WHERE bill_id = 1")
    row = query("SELECT bill_id, sector, kwh, rate_cents, total_cents FROM power_bills WHERE bill_id = 1")
    rejected_str = False
    try:
        conn.execute("INSERT INTO power_bills (bill_id, sector, kwh, rate_cents) VALUES (2, 'east', 'oops', 15)")
    except Exception:
        rejected_str = True
    return [row, rejected_str]

expect(
    "auto-computes total_cents on insert/update and rejects non-integer kwh in STRICT mode",
    _test_strict_and_generated,
    [[[1, "north", 50, 15, 750]], True],
)
```

## Hidden checks

```python
def _test_constraints():
    direct_write_blocked = False
    try:
        conn.execute("INSERT INTO power_bills (bill_id, sector, kwh, rate_cents, total_cents) VALUES (3, 'west', 10, 10, 999)")
    except Exception:
        direct_write_blocked = True
    neg_blocked = False
    try:
        conn.execute("INSERT INTO power_bills (bill_id, sector, kwh, rate_cents) VALUES (4, 'west', -5, 10)")
    except Exception:
        neg_blocked = True
    return [direct_write_blocked, neg_blocked]

expect(
    "blocks direct writes to generated column total_cents and enforces CHECK (kwh >= 0)",
    _test_constraints,
    [True, True],
)
```

## Solution

```sql
CREATE TABLE power_bills (
  bill_id INT PRIMARY KEY,
  sector TEXT NOT NULL,
  kwh INT NOT NULL CHECK (kwh >= 0),
  rate_cents INT NOT NULL CHECK (rate_cents > 0),
  total_cents INT GENERATED ALWAYS AS (kwh * rate_cents) STORED
) STRICT;
```

## Restored

Migration bay schema hardened — `STRICT` type enforcement and stored generated columns guarantee every power bill stays consistent.
