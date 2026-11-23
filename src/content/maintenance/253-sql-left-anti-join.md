---
id: maintenance-sql-left-anti-join
language: sql
title: Find silent transponders with a LEFT JOIN anti-join
system: Join bridge
symbol: equipment
scene: tests
skills: sql-joins
reviewSkill: sql-joins
prerequisite: sql-multi-join-rollup
---

## Briefing

`transponders` lists every registered transponder on the ridge, while `heartbeats` logs recent check-in pings. Dispatch needs a relational **anti-join** (`LEFT JOIN ... WHERE ... IS NULL`) to find all transponders that have **zero** rows in `heartbeats`.

## Objective

Write a `SELECT` query joining `transponders` and `heartbeats` that returns `tx_id` and `location` for transponders with no matching heartbeat rows, ordered by `tx_id ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `FROM transponders t LEFT JOIN heartbeats h ON t.tx_id = h.tx_id WHERE h.tx_id IS NULL ORDER BY t.tx_id ASC;`.

## Setup

```sql
CREATE TABLE transponders (
  tx_id TEXT PRIMARY KEY,
  location TEXT NOT NULL
);

CREATE TABLE heartbeats (
  hb_id INTEGER PRIMARY KEY,
  tx_id TEXT NOT NULL REFERENCES transponders(tx_id),
  ts INTEGER NOT NULL
);

INSERT INTO transponders (tx_id, location) VALUES
  ('TX-01', 'North Tower'),
  ('TX-02', 'East Gate'),
  ('TX-03', 'South Crater'),
  ('TX-04', 'West Rim');

INSERT INTO heartbeats (hb_id, tx_id, ts) VALUES
  (1, 'TX-01', 100),
  (2, 'TX-01', 120),
  (3, 'TX-03', 110);
```

## Starter

```sql
SELECT
  t.tx_id,
  t.location
FROM transponders t
JOIN heartbeats h ON t.tx_id = h.tx_id;
```

## Checks

```python
expect(
    "projects tx_id and location",
    lambda: columns,
    ["tx_id", "location"],
)

expect(
    "returns only silent transponders with no heartbeats",
    lambda: rows,
    [
        ["TX-02", "East Gate"],
        ["TX-04", "West Rim"],
    ],
)
```

## Hidden checks

```python
def _test_tx02_checkin():
    conn.execute("INSERT INTO heartbeats VALUES (4, 'TX-02', 150)")
    return run_user_sql()

expect(
    "removes TX-02 from silent list once a heartbeat arrives",
    _test_tx02_checkin,
    [
        ["TX-04", "West Rim"],
    ],
)
```

## Solution

```sql
SELECT
  t.tx_id,
  t.location
FROM transponders t
LEFT JOIN heartbeats h
  ON t.tx_id = h.tx_id
WHERE h.tx_id IS NULL
ORDER BY t.tx_id ASC;
```

## Restored

Join bridge anti-join detector online — silent transponders without heartbeat records are isolated immediately.
