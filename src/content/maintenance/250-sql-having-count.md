---
id: maintenance-sql-having-count
language: sql
title: Find overloaded relay channels using GROUP BY and HAVING COUNT
system: Rollup bay
symbol: instrument
scene: tests
skills: sql-aggregations
reviewSkill: sql-aggregations
prerequisite: sql-multi-join-rollup
---

## Briefing

The rollup bay monitors packet bursts in `packet_events`. Command wants a list of channels that have carried at least `3` packets (`COUNT(*) >= 3`), showing the channel name, packet count, and total payload bytes.

## Objective

Write a `SELECT` query against `packet_events` that groups by `channel`, keeps only groups with `COUNT(*) >= 3`, and projects `channel`, `packet_count` (`COUNT(*)`), and `total_bytes` (`SUM(bytes)`), ordered by `total_bytes DESC, channel ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Group with `GROUP BY channel` and filter the grouped counts with `HAVING COUNT(*) >= 3`.

## Setup

```sql
CREATE TABLE packet_events (
  pkt_id INTEGER PRIMARY KEY,
  channel TEXT NOT NULL,
  bytes INTEGER NOT NULL
);

INSERT INTO packet_events (pkt_id, channel, bytes) VALUES
  (1, 'ch-alpha', 200),
  (2, 'ch-alpha', 300),
  (3, 'ch-alpha', 250),
  (4, 'ch-beta',  900),
  (5, 'ch-beta',  800),
  (6, 'ch-gamma', 400),
  (7, 'ch-gamma', 350),
  (8, 'ch-gamma', 450);
```

## Starter

```sql
SELECT
  channel,
  COUNT(*) AS packet_count,
  SUM(bytes) AS total_bytes
FROM packet_events
GROUP BY channel;
```

## Checks

```python
expect(
    "projects channel, packet_count, total_bytes",
    lambda: columns,
    ["channel", "packet_count", "total_bytes"],
)

expect(
    "returns only channels with at least 3 packets ordered by total_bytes DESC",
    lambda: rows,
    [
        ["ch-gamma", 3, 1200],
        ["ch-alpha", 3, 750],
    ],
)
```

## Hidden checks

```python
def _test_beta_burst():
    conn.execute("INSERT INTO packet_events (pkt_id, channel, bytes) VALUES (9, 'ch-beta', 100)")
    return run_user_sql()

expect(
    "includes ch-beta once its 3rd packet arrives",
    _test_beta_burst,
    [
        ["ch-beta", 3, 1800],
        ["ch-gamma", 3, 1200],
        ["ch-alpha", 3, 750],
    ],
)
```

## Solution

```sql
SELECT
  channel,
  COUNT(*) AS packet_count,
  SUM(bytes) AS total_bytes
FROM packet_events
GROUP BY channel
HAVING COUNT(*) >= 3
ORDER BY total_bytes DESC, channel ASC;
```

## Restored

Rollup bay channel threshold query online — `HAVING COUNT(*) >= 3` filters out low-volume channels after aggregation.
