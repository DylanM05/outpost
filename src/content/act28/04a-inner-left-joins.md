---
id: sql-inner-left-joins
kind: code
language: sql
title: Join crews, assignments, and sectors while preserving unassigned crew
system: Join bridge
symbol: equipment
scene: tests
skills: sql-joins
---

## Briefing

The join bridge correlates personnel records in `crews` with shift logs in `assignments` and location metadata in `sectors`. An `INNER JOIN` drops crew members who haven't been assigned a shift yet. Command wants a complete roster showing every crew member, their home sector's zone name, how many shifts they have worked, and their total hours (`0` if unassigned).

## Objective

Write a `SELECT` query that joins `crews`, `sectors`, and `assignments` to return:
1. `crew_id` (`crews.crew_id`)
2. `name` (`crews.name`)
3. `zone` (`sectors.zone`)
4. `shift_count` — number of assignments for this crew member (`0` if none)
5. `total_hours` — sum of `assignments.hours` for this crew member (`0` if none)

Order the result by `total_hours DESC, crew_id ASC`.

## Concept

- `INNER JOIN sectors s ON c.sector_id = s.sector_id` pairs each crew member with their required home sector.
- `LEFT JOIN assignments a ON c.crew_id = a.crew_id` keeps every row from `crews` even when there are no matching rows in `assignments` (producing `NULL` for `a.*` columns).
- With a `LEFT JOIN`, `COUNT(a.assign_id)` returns `0` for unmatched rows (whereas `COUNT(*)` would return `1`!), and `COALESCE(SUM(a.hours), 0)` turns a `NULL` sum into `0`.

## Hints

1. Join `crews c` to `sectors s` on `c.sector_id = s.sector_id`, and `LEFT JOIN assignments a ON c.crew_id = a.crew_id`.
2. Use `COUNT(a.assign_id) AS shift_count` and `COALESCE(SUM(a.hours), 0) AS total_hours`.
3. Group by `c.crew_id, c.name, s.zone` and order by `total_hours DESC, c.crew_id ASC`.

## Setup

```sql
CREATE TABLE sectors (
  sector_id TEXT PRIMARY KEY,
  zone TEXT NOT NULL
);

CREATE TABLE crews (
  crew_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sector_id TEXT NOT NULL REFERENCES sectors(sector_id)
);

CREATE TABLE assignments (
  assign_id INTEGER PRIMARY KEY,
  crew_id TEXT NOT NULL REFERENCES crews(crew_id),
  hours INTEGER NOT NULL
);

INSERT INTO sectors (sector_id, zone) VALUES
  ('S-1', 'North Ridge'),
  ('S-2', 'Solar Flats'),
  ('S-3', 'Deep Vault');

INSERT INTO crews (crew_id, name, sector_id) VALUES
  ('CR-01', 'Vera', 'S-1'),
  ('CR-02', 'Lin',  'S-2'),
  ('CR-03', 'Mira', 'S-1'),
  ('CR-04', 'Kade', 'S-3');

INSERT INTO assignments (assign_id, crew_id, hours) VALUES
  (1, 'CR-01', 6),
  (2, 'CR-01', 8),
  (3, 'CR-03', 10),
  (4, 'CR-04', 4),
  (5, 'CR-04', 6);
```

## Starter: guided

```sql
-- Join crews, sectors, and LEFT JOIN assignments so unassigned crew
-- appear with shift_count = 0 and total_hours = 0.
SELECT
  c.crew_id,
  c.name,
  s.zone
FROM crews c
JOIN sectors s ON c.sector_id = s.sector_id;
```

## Starter: standard

```sql
SELECT crew_id, name FROM crews;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects crew_id, name, zone, shift_count, total_hours",
    lambda: columns,
    ["crew_id", "name", "zone", "shift_count", "total_hours"],
)

expect(
    "includes unassigned crew member Lin with 0 shifts and 0 hours",
    lambda: rows,
    [
        ["CR-01", "Vera", "North Ridge", 2, 14],
        ["CR-03", "Mira", "North Ridge", 1, 10],
        ["CR-04", "Kade", "Deep Vault", 2, 10],
        ["CR-02", "Lin", "Solar Flats", 0, 0],
    ],
)
```

## Hidden checks

```python
def _test_new_unassigned_crew():
    conn.execute("INSERT INTO crews (crew_id, name, sector_id) VALUES ('CR-00', 'Sora', 'S-3')")
    return run_user_sql()

expect(
    "newly added unassigned crew member appears with 0 shifts and 0 total_hours",
    _test_new_unassigned_crew,
    [
        ["CR-01", "Vera", "North Ridge", 2, 14],
        ["CR-03", "Mira", "North Ridge", 1, 10],
        ["CR-04", "Kade", "Deep Vault", 2, 10],
        ["CR-00", "Sora", "Deep Vault", 0, 0],
        ["CR-02", "Lin", "Solar Flats", 0, 0],
    ],
)
```

## Solution

```sql
SELECT
  c.crew_id,
  c.name,
  s.zone,
  COUNT(a.assign_id) AS shift_count,
  COALESCE(SUM(a.hours), 0) AS total_hours
FROM crews c
JOIN sectors s
  ON c.sector_id = s.sector_id
LEFT JOIN assignments a
  ON c.crew_id = a.crew_id
GROUP BY c.crew_id, c.name, s.zone
ORDER BY total_hours DESC, c.crew_id ASC;
```

## Restored

Join bridge roster feed online — every crew member is paired with their sector zone and shift totals without dropping unassigned personnel.
