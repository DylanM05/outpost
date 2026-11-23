---
id: sql-upsert-on-conflict
kind: code
language: sql
title: Ingest telemetry idempotently with INSERT ... ON CONFLICT DO UPDATE
system: Mutation gate
symbol: equipment
scene: tests
skills: sql-schema-dml
---

## Briefing

Packets from field sensors sometimes arrive out of order. When ingesting rows from `incoming_telemetry` into `telemetry`, a new `sensor_id` should be inserted with `sample_count = 1`, while an existing `sensor_id` should update its `reading`, `ts`, and increment `sample_count = telemetry.sample_count + 1` **only if** the incoming timestamp is at least as recent (`excluded.ts >= telemetry.ts`).

## Objective

Write an upsert script that:
1. Inserts all rows from `incoming_telemetry (sensor_id, reading, ts)` into `telemetry (sensor_id, reading, ts, sample_count)` (with initial `sample_count = 1`, using `WHERE true` before `ON CONFLICT`).
2. `ON CONFLICT(sensor_id) DO UPDATE SET`:
   - `reading = excluded.reading`
   - `ts = excluded.ts`
   - `sample_count = telemetry.sample_count + 1`
   - guarded by `WHERE excluded.ts >= telemetry.ts` so stale packets are ignored!
3. Ends with `SELECT sensor_id, reading, ts, sample_count FROM telemetry ORDER BY sensor_id ASC;`.

## Concept

- In SQLite, `INSERT INTO target (cols...) SELECT ..., 1 FROM source WHERE true ON CONFLICT(key_col) DO UPDATE SET ... WHERE ...` performs an atomic **upsert** (note that `WHERE true` on the `SELECT` disambiguates the parser before `ON CONFLICT`).
- Inside `DO UPDATE`, the special table qualifier `excluded.<col>` refers to the row that was proposed for insertion, while `telemetry.<col>` refers to the existing row already in the table.
- Adding `WHERE excluded.ts >= telemetry.ts` to `DO UPDATE` turns a conflicting row with an older timestamp into a safe no-op!

## Hints

1. Use `INSERT INTO telemetry (sensor_id, reading, ts, sample_count) SELECT sensor_id, reading, ts, 1 FROM incoming_telemetry WHERE true ON CONFLICT(sensor_id) DO UPDATE SET ...`.
2. In `DO UPDATE SET`, update `reading = excluded.reading, ts = excluded.ts, sample_count = telemetry.sample_count + 1 WHERE excluded.ts >= telemetry.ts`.
3. Finish with `SELECT sensor_id, reading, ts, sample_count FROM telemetry ORDER BY sensor_id ASC;`.

## Setup

```sql
CREATE TABLE telemetry (
  sensor_id TEXT PRIMARY KEY,
  reading INTEGER NOT NULL,
  ts INTEGER NOT NULL,
  sample_count INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE incoming_telemetry (
  batch_seq INTEGER PRIMARY KEY,
  sensor_id TEXT NOT NULL,
  reading INTEGER NOT NULL,
  ts INTEGER NOT NULL
);

INSERT INTO telemetry (sensor_id, reading, ts, sample_count) VALUES
  ('SN-01', 400, 100, 2),
  ('SN-02', 550, 200, 4);

INSERT INTO incoming_telemetry (batch_seq, sensor_id, reading, ts) VALUES
  (1, 'SN-01', 425, 150),
  (2, 'SN-02', 999, 120),
  (3, 'SN-03', 310, 180);
```

## Starter: guided

```sql
-- Upsert from incoming_telemetry into telemetry using ON CONFLICT(sensor_id) DO UPDATE,
-- updating only when excluded.ts >= telemetry.ts, then SELECT all rows ordered by sensor_id ASC.
SELECT sensor_id, reading, ts, sample_count
FROM telemetry
ORDER BY sensor_id ASC;
```

## Starter: standard

```sql
SELECT sensor_id, reading, ts, sample_count
FROM telemetry;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects sensor_id, reading, ts, sample_count",
    lambda: columns,
    ["sensor_id", "reading", "ts", "sample_count"],
)

expect(
    "updates SN-01 (newer ts), ignores stale packet for SN-02 (older ts), and inserts SN-03",
    lambda: rows,
    [
        ["SN-01", 425, 150, 3],
        ["SN-02", 550, 200, 4],
        ["SN-03", 310, 180, 1],
    ],
)

check(
    "uses ON CONFLICT upsert syntax",
    lambda: sql_uses("CONFLICT"),
    "Use INSERT ... ON CONFLICT(sensor_id) DO UPDATE.",
)
```

## Hidden checks

```python
def _test_second_batch():
    conn.execute("DELETE FROM incoming_telemetry")
    conn.execute(
        """
        INSERT INTO incoming_telemetry (batch_seq, sensor_id, reading, ts) VALUES
          (4, 'SN-02', 575, 200),
          (5, 'SN-03', 100, 179)
        """
    )
    return run_user_sql()

expect(
    "accepts equal-timestamp update (excluded.ts == telemetry.ts) on SN-02 and rejects ts 179 on SN-03",
    _test_second_batch,
    [
        ["SN-01", 425, 150, 3],
        ["SN-02", 575, 200, 5],
        ["SN-03", 310, 180, 1],
    ],
)
```

## Solution

```sql
INSERT INTO telemetry (sensor_id, reading, ts, sample_count)
SELECT sensor_id, reading, ts, 1
FROM incoming_telemetry
WHERE true
ON CONFLICT(sensor_id) DO UPDATE SET
  reading = excluded.reading,
  ts = excluded.ts,
  sample_count = telemetry.sample_count + 1
WHERE excluded.ts >= telemetry.ts;

SELECT
  sensor_id,
  reading,
  ts,
  sample_count
FROM telemetry
ORDER BY sensor_id ASC;
```

## Restored

Mutation gate upsert pipeline online — fresh telemetry packets update readings and counters atomically while out-of-order stale packets are discarded.
