---
id: sql-case-coalesce
kind: code
language: sql
title: Classify sensor readings into alert tiers with CASE and COALESCE
system: Filter rack
symbol: equipment
scene: tests
skills: sql-queries
---

## Briefing

Some battery cells in `cell_monitors` fail to report their primary voltage (`primary_mv IS NULL`), falling back to a backup telemetry line (`backup_mv`) — or if both lines are dark, a safe default of `0`. The dashboard also expects an alert `tier` label derived from the effective voltage.

## Objective

Write a `SELECT` query against `cell_monitors` that projects four columns ordered by `cell_id ASC`:
1. `cell_id`
2. `label` — `COALESCE(location_tag, 'UNASSIGNED')`
3. `effective_mv` — `COALESCE(primary_mv, backup_mv, 0)`
4. `tier` — a `CASE` expression based on the effective voltage:
   - `'CRITICAL'` when effective voltage `< 3000`
   - `'WARNING'` when effective voltage `< 3600` (and `>= 3000`)
   - `'NOMINAL'` otherwise (`>= 3600`)

## Concept

- `COALESCE(a, b, c)` evaluates its arguments left to right and returns the first non-`NULL` value (or `NULL` if all arguments are `NULL`).
- `CASE WHEN cond1 THEN res1 WHEN cond2 THEN res2 ELSE res3 END` evaluates conditions top-down and returns the result for the first branch that matches.

## Hints

1. Use `COALESCE(location_tag, 'UNASSIGNED') AS label` for the second column.
2. Use `COALESCE(primary_mv, backup_mv, 0) AS effective_mv` for the third column.
3. In your `CASE` expression, test `COALESCE(primary_mv, backup_mv, 0) < 3000` first, then `< 3600`, then `ELSE 'NOMINAL'`.

## Setup

```sql
CREATE TABLE cell_monitors (
  cell_id TEXT PRIMARY KEY,
  location_tag TEXT,
  primary_mv INTEGER,
  backup_mv INTEGER
);

INSERT INTO cell_monitors (cell_id, location_tag, primary_mv, backup_mv) VALUES
  ('C-01', 'Rack-A', 3850, 3840),
  ('C-02', 'Rack-A', NULL, 3420),
  ('C-03', NULL,     2950, 3100),
  ('C-04', 'Rack-B', NULL, NULL),
  ('C-05', 'Rack-B', 3600, 3200),
  ('C-06', NULL,     NULL, 3000);
```

## Starter: guided

```sql
-- Project cell_id, label, effective_mv, and tier from cell_monitors
-- ordered by cell_id ASC.
SELECT
  cell_id,
  COALESCE(location_tag, 'UNASSIGNED') AS label
FROM cell_monitors
ORDER BY cell_id ASC;
```

## Starter: standard

```sql
SELECT cell_id, location_tag, primary_mv, backup_mv
FROM cell_monitors
ORDER BY cell_id ASC;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects cell_id, label, effective_mv, tier",
    lambda: columns,
    ["cell_id", "label", "effective_mv", "tier"],
)

expect(
    "computes COALESCE fallbacks and CASE status tiers accurately",
    lambda: rows,
    [
        ["C-01", "Rack-A", 3850, "NOMINAL"],
        ["C-02", "Rack-A", 3420, "WARNING"],
        ["C-03", "UNASSIGNED", 2950, "CRITICAL"],
        ["C-04", "Rack-B", 0, "CRITICAL"],
        ["C-05", "Rack-B", 3600, "NOMINAL"],
        ["C-06", "UNASSIGNED", 3000, "WARNING"],
    ],
)
```

## Hidden checks

```python
def _test_extra_cells():
    conn.execute(
        "INSERT INTO cell_monitors (cell_id, location_tag, primary_mv, backup_mv) VALUES ('C-00', NULL, NULL, 3900)"
    )
    return run_user_sql()[0]

expect(
    "evaluates newly inserted cell with NULL primary_mv and non-NULL backup_mv",
    _test_extra_cells,
    ["C-00", "UNASSIGNED", 3900, "NOMINAL"],
)
```

## Solution

```sql
SELECT
  cell_id,
  COALESCE(location_tag, 'UNASSIGNED') AS label,
  COALESCE(primary_mv, backup_mv, 0) AS effective_mv,
  CASE
    WHEN COALESCE(primary_mv, backup_mv, 0) < 3000 THEN 'CRITICAL'
    WHEN COALESCE(primary_mv, backup_mv, 0) < 3600 THEN 'WARNING'
    ELSE 'NOMINAL'
  END AS tier
FROM cell_monitors
ORDER BY cell_id ASC;
```

## Restored

Filter rack tier classifier restored — missing primary telemetry now falls back cleanly through backup channels into deterministic alert tiers.
