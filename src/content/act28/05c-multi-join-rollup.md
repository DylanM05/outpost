---
id: sql-multi-join-rollup
kind: code
language: sql
title: Build a multi-table incident response summary with conditional aggregation
system: Subquery loom
symbol: controller
scene: tests
skills: sql-aggregations, sql-joins
---

## Briefing

Incident records are normalized across three tables: `stations`, `systems`, and `incidents`. Command needs a single station-level scorecard that counts every incident across all systems belonging to each station, broken down into critical incidents, unresolved incidents, and total downtime minutes — including stations with zero incidents.

## Objective

Write a `SELECT` query joining `stations`, `systems`, and `incidents` that returns one row per station ordered by `open_incidents DESC, station_id ASC`:
1. `station_id` (`stations.station_id`)
2. `station_name` (`stations.name`)
3. `total_incidents` — total number of incidents at the station (`0` if none)
4. `critical_incidents` — count of incidents where `severity = 'critical'` (`0` if none)
5. `open_incidents` — count of incidents where `resolved = 0` (`0` if none)
6. `downtime_mins` — sum of `downtime_min` across all incidents at the station (`0` if none)

## Concept

- Chain `LEFT JOIN systems sy ON st.station_id = sy.station_id` and `LEFT JOIN incidents i ON sy.system_id = i.system_id` so stations without systems or incidents are still preserved.
- **Conditional aggregation** pivots filtered counts inside a single `GROUP BY` pass:
  ```sql
  SUM(CASE WHEN i.severity = 'critical' THEN 1 ELSE 0 END) AS critical_incidents,
  SUM(CASE WHEN i.resolved = 0 THEN 1 ELSE 0 END) AS open_incidents
  ```

## Hints

1. Start from `stations st`, `LEFT JOIN systems sy ON st.station_id = sy.station_id`, and `LEFT JOIN incidents i ON sy.system_id = i.system_id`.
2. Use `COUNT(i.inc_id) AS total_incidents` so unmatched `LEFT JOIN` rows count as `0`.
3. Use `SUM(CASE WHEN i.severity = 'critical' THEN 1 ELSE 0 END) AS critical_incidents`, `SUM(CASE WHEN i.resolved = 0 THEN 1 ELSE 0 END) AS open_incidents`, and `COALESCE(SUM(i.downtime_min), 0) AS downtime_mins`.

## Setup

```sql
CREATE TABLE stations (
  station_id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE systems (
  system_id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL REFERENCES stations(station_id),
  subsystem TEXT NOT NULL
);

CREATE TABLE incidents (
  inc_id INTEGER PRIMARY KEY,
  system_id TEXT NOT NULL REFERENCES systems(system_id),
  severity TEXT NOT NULL,
  resolved INTEGER NOT NULL,
  downtime_min INTEGER NOT NULL
);

INSERT INTO stations (station_id, name) VALUES
  ('ST-1', 'Apex Relay'),
  ('ST-2', 'Basalt Core'),
  ('ST-3', 'Cryo Dock');

INSERT INTO systems (system_id, station_id, subsystem) VALUES
  ('SYS-10', 'ST-1', 'Antenna'),
  ('SYS-11', 'ST-1', 'Power'),
  ('SYS-20', 'ST-2', 'Turbine'),
  ('SYS-30', 'ST-3', 'Coolant');

INSERT INTO incidents (inc_id, system_id, severity, resolved, downtime_min) VALUES
  (1, 'SYS-10', 'critical', 0, 45),
  (2, 'SYS-10', 'warning',  1, 15),
  (3, 'SYS-11', 'critical', 0, 60),
  (4, 'SYS-20', 'critical', 1, 30),
  (5, 'SYS-20', 'warning',  0, 20);
```

## Starter: guided

```sql
-- Join stations, systems, and incidents with conditional aggregation.
-- Project station_id, station_name, total_incidents, critical_incidents, open_incidents, downtime_mins.
SELECT
  st.station_id,
  st.name AS station_name,
  COUNT(i.inc_id) AS total_incidents
FROM stations st
LEFT JOIN systems sy ON st.station_id = sy.station_id
LEFT JOIN incidents i ON sy.system_id = i.system_id
GROUP BY st.station_id, st.name;
```

## Starter: standard

```sql
SELECT station_id, name FROM stations;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects expected 6 summary columns",
    lambda: columns,
    [
        "station_id",
        "station_name",
        "total_incidents",
        "critical_incidents",
        "open_incidents",
        "downtime_mins",
    ],
)

expect(
    "aggregates multi-table incident counts and preserves zero-incident Cryo Dock",
    lambda: rows,
    [
        ["ST-1", "Apex Relay", 3, 2, 2, 120],
        ["ST-2", "Basalt Core", 2, 1, 1, 50],
        ["ST-3", "Cryo Dock", 0, 0, 0, 0],
    ],
)
```

## Hidden checks

```python
def _test_new_incident():
    conn.execute(
        "INSERT INTO incidents (inc_id, system_id, severity, resolved, downtime_min) VALUES (6, 'SYS-30', 'critical', 0, 90)"
    )
    return run_user_sql()

expect(
    "updates Cryo Dock rollup when a new critical unresolved incident is logged",
    _test_new_incident,
    [
        ["ST-1", "Apex Relay", 3, 2, 2, 120],
        ["ST-2", "Basalt Core", 2, 1, 1, 50],
        ["ST-3", "Cryo Dock", 1, 1, 1, 90],
    ],
)
```

## Solution

```sql
SELECT
  st.station_id,
  st.name AS station_name,
  COUNT(i.inc_id) AS total_incidents,
  SUM(CASE WHEN i.severity = 'critical' THEN 1 ELSE 0 END) AS critical_incidents,
  SUM(CASE WHEN i.resolved = 0 THEN 1 ELSE 0 END) AS open_incidents,
  COALESCE(SUM(i.downtime_min), 0) AS downtime_mins
FROM stations st
LEFT JOIN systems sy
  ON st.station_id = sy.station_id
LEFT JOIN incidents i
  ON sy.system_id = i.system_id
GROUP BY st.station_id, st.name
ORDER BY open_incidents DESC, st.station_id ASC;
```

## Restored

Subquery loom multi-join rollup online — conditional aggregation summarizes severity and resolution metrics across all three tables in a single pass.
