---
id: sql-set-operations
kind: code
language: sql
title: Reconcile primary and backup manifests with EXCEPT and UNION
system: Subquery loom
symbol: controller
scene: tests
skills: sql-queries, sql-joins
---

## Briefing

After a failover drill, `primary_manifest` and `backup_manifest` drifted out of sync, and several part codes are listed in `quarantined_parts`. The subquery loom needs a single reconciliation query using SQL set operations (`EXCEPT`, `INTERSECT`, `UNION`) to label every active (non-quarantined) discrepancy between the two manifests.

## Objective

Write a query that returns `(part_code, discrepancy)` ordered by `part_code ASC` for all parts that appear in **only one** of `primary_manifest` or `backup_manifest`, excluding any `part_code` present in `quarantined_parts`:
- Parts in `primary_manifest` that are **not** in `backup_manifest` and **not** in `quarantined_parts` get `discrepancy = 'PRIMARY_ONLY'`.
- Parts in `backup_manifest` that are **not** in `primary_manifest` and **not** in `quarantined_parts` get `discrepancy = 'BACKUP_ONLY'`.

## Concept

- Set operations combine the result sets of two `SELECT` queries with matching column counts:
  - `A UNION B` — rows in `A` or `B` (deduplicated; `UNION ALL` keeps duplicates).
  - `A INTERSECT B` — rows present in both `A` and `B`.
  - `A EXCEPT B` — rows in `A` that are **not** in `B` (deduplicated).
- Combine the two `EXCEPT` differences with `UNION` / `UNION ALL` and end with `ORDER BY part_code ASC`.

## Hints

1. To find `PRIMARY_ONLY` part codes: `SELECT part_code FROM primary_manifest EXCEPT SELECT part_code FROM backup_manifest EXCEPT SELECT part_code FROM quarantined_parts`.
2. To find `BACKUP_ONLY` part codes: `SELECT part_code FROM backup_manifest EXCEPT SELECT part_code FROM primary_manifest EXCEPT SELECT part_code FROM quarantined_parts`.
3. Project `part_code, 'PRIMARY_ONLY' AS discrepancy` and `part_code, 'BACKUP_ONLY' AS discrepancy`, combine them with `UNION ALL`, and add `ORDER BY part_code ASC`.

## Setup

```sql
CREATE TABLE primary_manifest (
  part_code TEXT NOT NULL
);

CREATE TABLE backup_manifest (
  part_code TEXT NOT NULL
);

CREATE TABLE quarantined_parts (
  part_code TEXT PRIMARY KEY
);

INSERT INTO primary_manifest (part_code) VALUES
  ('PT-10'),
  ('PT-10'),
  ('PT-20'),
  ('PT-30'),
  ('PT-40');

INSERT INTO backup_manifest (part_code) VALUES
  ('PT-20'),
  ('PT-50'),
  ('PT-60');

INSERT INTO quarantined_parts (part_code) VALUES
  ('PT-40'),
  ('PT-60');
```

## Starter: guided

```sql
-- Reconcile primary_manifest and backup_manifest excluding quarantined_parts.
-- Return part_code, discrepancy ('PRIMARY_ONLY' or 'BACKUP_ONLY') ordered by part_code ASC.
SELECT part_code, 'PRIMARY_ONLY' AS discrepancy
FROM primary_manifest;
```

## Starter: standard

```sql
SELECT part_code FROM primary_manifest;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects part_code and discrepancy",
    lambda: columns,
    ["part_code", "discrepancy"],
)

expect(
    "identifies deduplicated non-quarantined manifest discrepancies",
    lambda: rows,
    [
        ["PT-10", "PRIMARY_ONLY"],
        ["PT-30", "PRIMARY_ONLY"],
        ["PT-50", "BACKUP_ONLY"],
    ],
)

check(
    "uses SQL set operations (UNION / EXCEPT)",
    lambda: sql_uses("UNION") and sql_uses("EXCEPT"),
    "Use UNION and EXCEPT to combine and diff the manifest tables.",
)
```

## Hidden checks

```python
def _test_manifest_sync():
    conn.execute("INSERT INTO backup_manifest (part_code) VALUES ('PT-30'), ('PT-70')")
    return run_user_sql()

expect(
    "updates discrepancies when PT-30 is synced and PT-70 is added to backup_manifest",
    _test_manifest_sync,
    [
        ["PT-10", "PRIMARY_ONLY"],
        ["PT-50", "BACKUP_ONLY"],
        ["PT-70", "BACKUP_ONLY"],
    ],
)
```

## Solution

```sql
SELECT part_code, 'PRIMARY_ONLY' AS discrepancy
FROM (
  SELECT part_code FROM primary_manifest
  EXCEPT
  SELECT part_code FROM backup_manifest
  EXCEPT
  SELECT part_code FROM quarantined_parts
)
UNION ALL
SELECT part_code, 'BACKUP_ONLY' AS discrepancy
FROM (
  SELECT part_code FROM backup_manifest
  EXCEPT
  SELECT part_code FROM primary_manifest
  EXCEPT
  SELECT part_code FROM quarantined_parts
)
ORDER BY part_code ASC;
```

## Restored

Subquery loom manifest reconciliation online — symmetric set differences now surface unquarantined drift between primary and backup catalogs.
