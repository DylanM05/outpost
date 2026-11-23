---
id: sql-ddl-constraints
kind: code
language: sql
title: Design normalized storage tables with CHECK, UNIQUE, DEFAULT, and ON DELETE CASCADE
system: Schema forge
symbol: equipment
scene: tests
skills: sql-schema-dml
---

## Briefing

Application bugs corrupt databases when schemas lack declarative integrity constraints. In the schema forge, define the `containers` and `inventory_items` tables so the database engine itself rejects duplicate container codes, negative item quantities, non-positive capacities, or orphaned inventory rows.

## Objective

Write `CREATE TABLE` statements for two tables:
1. `containers`:
   - `container_id TEXT PRIMARY KEY`
   - `code TEXT NOT NULL UNIQUE`
   - `max_capacity INTEGER NOT NULL DEFAULT 100 CHECK (max_capacity > 0)`
2. `inventory_items`:
   - `item_id INTEGER PRIMARY KEY`
   - `container_id TEXT NOT NULL REFERENCES containers(container_id) ON DELETE CASCADE`
   - `sku TEXT NOT NULL`
   - `quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0)`

## Concept

- `PRIMARY KEY` uniquely identifies each row and implies `NOT NULL` (and in SQLite, `INTEGER PRIMARY KEY` auto-generates row IDs if omitted).
- `UNIQUE` prevents duplicate values across rows; `NOT NULL` rejects `NULL`.
- `DEFAULT val` supplies a fallback value when an `INSERT` omits that column.
- `CHECK (expr)` rejects any `INSERT` or `UPDATE` where `expr` evaluates to false (`0`).
- `REFERENCES parent(id) ON DELETE CASCADE` enforces foreign-key integrity and automatically deletes child rows when their parent row is deleted.

## Hints

1. Define `containers` first so `inventory_items` can reference `containers(container_id)`.
2. Put `DEFAULT 100 CHECK (max_capacity > 0)` on `max_capacity` and `DEFAULT 0 CHECK (quantity >= 0)` on `quantity`.
3. Include `ON DELETE CASCADE` on the `container_id` foreign key in `inventory_items`.

## Setup

```sql
-- Foreign keys are enabled in the harness connection (PRAGMA foreign_keys = ON).
```

## Starter: guided

```sql
-- Create tables containers and inventory_items with PRIMARY KEY, NOT NULL,
-- UNIQUE, DEFAULT, CHECK, and FOREIGN KEY ... ON DELETE CASCADE constraints.
CREATE TABLE containers (
  container_id TEXT PRIMARY KEY,
  code TEXT NOT NULL
);
```

## Starter: standard

```sql
-- Define containers and inventory_items tables
```

## Starter: challenge

```sql
```

## Checks

```python
def _test_valid_and_defaults():
    conn.execute("INSERT INTO containers (container_id, code) VALUES ('C-1', 'ALPHA-01')")
    conn.execute("INSERT INTO inventory_items (item_id, container_id, sku) VALUES (1, 'C-1', 'SKU-A')")
    conn.execute("INSERT INTO inventory_items (item_id, container_id, sku, quantity) VALUES (2, 'C-1', 'SKU-B', 25)")
    c_rows = query("SELECT container_id, code, max_capacity FROM containers")
    i_rows = query("SELECT item_id, container_id, sku, quantity FROM inventory_items ORDER BY item_id ASC")
    return [c_rows, i_rows]

expect(
    "inserts valid rows and applies DEFAULT 100 on max_capacity and DEFAULT 0 on quantity",
    _test_valid_and_defaults,
    [
        [["C-1", "ALPHA-01", 100]],
        [
            [1, "C-1", "SKU-A", 0],
            [2, "C-1", "SKU-B", 25],
        ],
    ],
)

def _test_constraints():
    errors = []
    for label, sql in [
        ("dup_code", "INSERT INTO containers (container_id, code) VALUES ('C-2', 'ALPHA-01')"),
        ("bad_cap", "INSERT INTO containers (container_id, code, max_capacity) VALUES ('C-3', 'BETA-01', 0)"),
        ("neg_qty", "INSERT INTO inventory_items (item_id, container_id, sku, quantity) VALUES (3, 'C-1', 'SKU-C', -1)"),
        ("bad_fk", "INSERT INTO inventory_items (item_id, container_id, sku, quantity) VALUES (4, 'NO-SUCH', 'SKU-D', 5)"),
    ]:
        try:
            conn.execute(sql)
        except Exception:
            errors.append(label)
    return errors

expect(
    "enforces UNIQUE code, CHECK max_capacity > 0, CHECK quantity >= 0, and FOREIGN KEY reference",
    _test_constraints,
    ["dup_code", "bad_cap", "neg_qty", "bad_fk"],
)
```

## Hidden checks

```python
def _test_cascade_delete():
    conn.execute("DELETE FROM containers WHERE container_id = 'C-1'")
    return query("SELECT COUNT(*) FROM inventory_items")

expect(
    "ON DELETE CASCADE removes child inventory_items when parent container is deleted",
    _test_cascade_delete,
    [[0]],
)
```

## Solution

```sql
CREATE TABLE containers (
  container_id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  max_capacity INTEGER NOT NULL DEFAULT 100 CHECK (max_capacity > 0)
);

CREATE TABLE inventory_items (
  item_id INTEGER PRIMARY KEY,
  container_id TEXT NOT NULL REFERENCES containers(container_id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0)
);
```

## Restored

Schema forge constraints locked in — invalid capacities, negative quantities, duplicate codes, and orphaned child rows are blocked at the storage layer.
