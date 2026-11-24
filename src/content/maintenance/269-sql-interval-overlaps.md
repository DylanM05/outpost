---
id: maintenance-sql-interval-overlaps
language: sql
title: Find overlapping radio slot bookings using half-open interval bounds
system: Time ledger
symbol: equipment
scene: tests
skills: sql-time-series
reviewSkill: sql-time-series
prerequisite: sql-temporal-overlap-guard
---

## Briefing

Transmissions in `radio_slots` book half-open time windows `[start_min, end_min)` on a `channel`. Find every pair of overlapping bookings on the same channel.

## Objective

Write a `SELECT` query returning `channel`, `slot_a` (smaller `slot_id`), and `slot_b` (larger `slot_id`) for every overlapping pair (`a.start_min < b.end_min AND b.start_min < a.end_min`), ordered by `channel ASC, slot_a ASC, slot_b ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Self-join `radio_slots a JOIN radio_slots b ON a.channel = b.channel AND a.slot_id < b.slot_id AND a.start_min < b.end_min AND b.start_min < a.end_min`.

## Setup

```sql
CREATE TABLE radio_slots (
  slot_id INTEGER PRIMARY KEY,
  channel TEXT NOT NULL,
  start_min INTEGER NOT NULL,
  end_min INTEGER NOT NULL
);

INSERT INTO radio_slots (slot_id, channel, start_min, end_min) VALUES
  (1, 'ch-1',  0, 30),
  (2, 'ch-1', 30, 60),
  (3, 'ch-1', 15, 45),
  (4, 'ch-2', 10, 20),
  (5, 'ch-2', 20, 40);
```

## Starter

```sql
-- Return channel, slot_a, slot_b for overlapping half-open bookings
```

## Checks

```python
expect(
    "finds exact overlapping slot pairs without flagging back-to-back bookings",
    lambda: [columns, rows],
    [
        ["channel", "slot_a", "slot_b"],
        [
            ["ch-1", 1, 3],
            ["ch-1", 2, 3],
        ],
    ],
)
```

## Hidden checks

```python
def _test_new_overlap():
    conn.execute("INSERT INTO radio_slots VALUES (6, 'ch-2', 15, 25)")
    return [r for r in run_user_sql() if r[0] == "ch-2"]

expect(
    "detects new channel overlaps dynamically",
    _test_new_overlap,
    [["ch-2", 4, 6], ["ch-2", 5, 6]],
)
```

## Solution

```sql
SELECT
  a.channel,
  a.slot_id AS slot_a,
  b.slot_id AS slot_b
FROM radio_slots a
JOIN radio_slots b
  ON a.channel = b.channel
  AND a.slot_id < b.slot_id
  AND a.start_min < b.end_min
  AND b.start_min < a.end_min
ORDER BY a.channel ASC, slot_a ASC, slot_b ASC;
```

## Restored

Time ledger radio slot collision check restored.
