---
id: sql-audit-query-vault
kind: code
language: sql
title: Produce an end-to-end outpost supply and depot readiness report
system: Query audit
symbol: controller
scene: tests
assessment: true
skills: sql-queries, sql-aggregations, sql-joins
---

## Briefing

For the **SQL I (*The query vault*)** assessment, synthesize projection, filtering, `COALESCE`, `CASE` classification, multi-table `LEFT JOIN`s, conditional aggregation, and `HAVING` into a comprehensive depot readiness query across `depots`, `shipments`, and `parts`.

## Objective

Write a single `SELECT` query that produces a supply readiness report for **active depots** (`depots.active = 1`) across `depots`, `shipments`, and `parts`:
1. Only include depots where `depots.active = 1`.
2. Only count **delivered** shipments (`shipments.status = 'delivered'`) toward delivered units and delivered value; cancelled or in-transit shipments must contribute `0`.
3. Filter the grouped depots with `HAVING` so only depots that have **at least 1 total shipment of any status** (`COUNT(sh.shipment_id) >= 1`) are included.
4. Project six columns:
   - `depot_id` (`depots.depot_id`)
   - `depot_name` (`depots.name`)
   - `region` (`COALESCE(depots.region, 'UNASSIGNED')`)
   - `delivered_units` — sum of `sh.qty` for shipments where `sh.status = 'delivered'` (`0` if none)
   - `delivered_value` — sum of `sh.qty * p.unit_cost` for shipments where `sh.status = 'delivered'` (`0` if none)
   - `readiness` — `'READY'` when `delivered_value >= depots.target_value`, `'LOW'` when `delivered_value > 0` (and `< depots.target_value`), or `'EMPTY'` when `delivered_value = 0`
5. Order rows by `delivered_value DESC, depot_id ASC`.

## Concept

- Filter active depots in `WHERE d.active = 1`.
- Join `LEFT JOIN shipments sh ON d.depot_id = sh.depot_id` and `LEFT JOIN parts p ON sh.part_id = p.part_id`.
- Use conditional aggregation inside `SUM(CASE WHEN sh.status = 'delivered' THEN sh.qty ELSE 0 END)` and `SUM(CASE WHEN sh.status = 'delivered' THEN sh.qty * p.unit_cost ELSE 0 END)` so non-delivered shipments don't inflate delivered totals while still being counted by `HAVING COUNT(sh.shipment_id) >= 1`.

## Hints

1. Filter `WHERE d.active = 1`, group by `d.depot_id, d.name, d.region, d.target_value`, and filter groups with `HAVING COUNT(sh.shipment_id) >= 1`.
2. Compute `delivered_value` with `SUM(CASE WHEN sh.status = 'delivered' THEN sh.qty * p.unit_cost ELSE 0 END)`.
3. Build `readiness` with a `CASE` expression comparing the `delivered_value` sum against `d.target_value` (`>= d.target_value` -> `'READY'`, `> 0` -> `'LOW'`, `ELSE 'EMPTY'`).

## Setup

```sql
CREATE TABLE depots (
  depot_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  target_value INTEGER NOT NULL,
  active INTEGER NOT NULL
);

CREATE TABLE parts (
  part_id TEXT PRIMARY KEY,
  part_name TEXT NOT NULL,
  unit_cost INTEGER NOT NULL
);

CREATE TABLE shipments (
  shipment_id INTEGER PRIMARY KEY,
  depot_id TEXT NOT NULL REFERENCES depots(depot_id),
  part_id TEXT NOT NULL REFERENCES parts(part_id),
  qty INTEGER NOT NULL,
  status TEXT NOT NULL
);

INSERT INTO depots (depot_id, name, region, target_value, active) VALUES
  ('D-01', 'North Vault',  'Ridge', 1000, 1),
  ('D-02', 'East Bunker',  NULL,     800, 1),
  ('D-03', 'South Hangar', 'Flats',  500, 1),
  ('D-04', 'West Cache',   'Canyon', 400, 1),
  ('D-05', 'Old Silo',     'Ridge',  200, 0);

INSERT INTO parts (part_id, part_name, unit_cost) VALUES
  ('P-1', 'Solar Cell', 100),
  ('P-2', 'Relay Coil',  50),
  ('P-3', 'Cryo Valve', 200);

INSERT INTO shipments (shipment_id, depot_id, part_id, qty, status) VALUES
  (1, 'D-01', 'P-1', 6, 'delivered'),
  (2, 'D-01', 'P-3', 3, 'delivered'),
  (3, 'D-01', 'P-2', 4, 'transit'),
  (4, 'D-02', 'P-1', 5, 'delivered'),
  (5, 'D-02', 'P-2', 4, 'cancelled'),
  (6, 'D-03', 'P-3', 2, 'transit'),
  (7, 'D-05', 'P-3', 5, 'delivered');
```

## Starter: guided

```sql
-- Build the depot readiness report across depots, shipments, and parts.
SELECT
  d.depot_id,
  d.name AS depot_name,
  COALESCE(d.region, 'UNASSIGNED') AS region
FROM depots d
WHERE d.active = 1;
```

## Starter: standard

```sql
SELECT depot_id, name, region, target_value
FROM depots;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects expected 6 assessment columns",
    lambda: columns,
    [
        "depot_id",
        "depot_name",
        "region",
        "delivered_units",
        "delivered_value",
        "readiness",
    ],
)

expect(
    "computes delivered units, delivered value, and readiness for active depots with shipments",
    lambda: rows,
    [
        ["D-01", "North Vault", "Ridge", 9, 1200, "READY"],
        ["D-02", "East Bunker", "UNASSIGNED", 5, 500, "LOW"],
        ["D-03", "South Hangar", "Flats", 0, 0, "EMPTY"],
    ],
)
```

## Hidden checks

```python
def _test_shipment_delivery():
    conn.execute("UPDATE shipments SET status = 'delivered' WHERE shipment_id = 6")
    conn.execute(
        "INSERT INTO shipments (shipment_id, depot_id, part_id, qty, status) VALUES (8, 'D-02', 'P-2', 6, 'delivered')"
    )
    return run_user_sql()

expect(
    "recomputes readiness tiers when transit shipment arrives and East Bunker hits target value",
    _test_shipment_delivery,
    [
        ["D-01", "North Vault", "Ridge", 9, 1200, "READY"],
        ["D-02", "East Bunker", "UNASSIGNED", 11, 800, "READY"],
        ["D-03", "South Hangar", "Flats", 2, 400, "LOW"],
    ],
)
```

## Solution

```sql
SELECT
  d.depot_id,
  d.name AS depot_name,
  COALESCE(d.region, 'UNASSIGNED') AS region,
  SUM(CASE WHEN sh.status = 'delivered' THEN sh.qty ELSE 0 END) AS delivered_units,
  SUM(CASE WHEN sh.status = 'delivered' THEN sh.qty * p.unit_cost ELSE 0 END) AS delivered_value,
  CASE
    WHEN SUM(CASE WHEN sh.status = 'delivered' THEN sh.qty * p.unit_cost ELSE 0 END) >= d.target_value THEN 'READY'
    WHEN SUM(CASE WHEN sh.status = 'delivered' THEN sh.qty * p.unit_cost ELSE 0 END) > 0 THEN 'LOW'
    ELSE 'EMPTY'
  END AS readiness
FROM depots d
LEFT JOIN shipments sh
  ON d.depot_id = sh.depot_id
LEFT JOIN parts p
  ON sh.part_id = p.part_id
WHERE d.active = 1
GROUP BY d.depot_id, d.name, d.region, d.target_value
HAVING COUNT(sh.shipment_id) >= 1
ORDER BY delivered_value DESC, d.depot_id ASC;
```

## Restored

The query vault audit is complete — your relational query pipeline reconciles depots, shipments, and part valuations into real-time readiness telemetry.
