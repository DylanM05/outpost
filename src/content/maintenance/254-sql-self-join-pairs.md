---
id: maintenance-sql-self-join-pairs
language: sql
title: Find co-located relay pairs in the same sector using an ordered self-join
system: Join bridge
symbol: equipment
scene: tests
skills: sql-joins
reviewSkill: sql-joins
prerequisite: sql-multi-join-rollup
---

## Briefing

To configure peer-to-peer failover, the join bridge needs every unique pair of distinct relays located in the **same** `sector`. A self-join with `r1.relay_id < r2.relay_id` avoids pairing a relay with itself (`(A, A)`) and avoids duplicate mirror pairs (`(B, A)` when `(A, B)` is already listed).

## Objective

Write a self-join query on `sector_relays` (`r1` and `r2`) that returns `(sector, primary_relay, peer_relay)` for all pairs in the same `sector` with `r1.relay_id < r2.relay_id`, ordered by `sector ASC, primary_relay ASC, peer_relay ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Join `sector_relays r1 JOIN sector_relays r2 ON r1.sector = r2.sector AND r1.relay_id < r2.relay_id`.

## Setup

```sql
CREATE TABLE sector_relays (
  relay_id TEXT PRIMARY KEY,
  sector TEXT NOT NULL
);

INSERT INTO sector_relays (relay_id, sector) VALUES
  ('R-1', 'north'),
  ('R-2', 'north'),
  ('R-3', 'north'),
  ('R-4', 'south'),
  ('R-5', 'east'),
  ('R-6', 'east');
```

## Starter

```sql
SELECT
  r1.sector,
  r1.relay_id AS primary_relay,
  r2.relay_id AS peer_relay
FROM sector_relays r1
JOIN sector_relays r2 ON r1.sector = r2.sector;
```

## Checks

```python
expect(
    "projects sector, primary_relay, peer_relay",
    lambda: columns,
    ["sector", "primary_relay", "peer_relay"],
)

expect(
    "returns unique ordered co-located relay pairs without self-pairs or mirror duplicates",
    lambda: rows,
    [
        ["east", "R-5", "R-6"],
        ["north", "R-1", "R-2"],
        ["north", "R-1", "R-3"],
        ["north", "R-2", "R-3"],
    ],
)
```

## Hidden checks

```python
def _test_south_peer():
    conn.execute("INSERT INTO sector_relays VALUES ('R-7', 'south')")
    return run_user_sql()

expect(
    "pairs R-4 with newly added R-7 in south sector",
    _test_south_peer,
    [
        ["east", "R-5", "R-6"],
        ["north", "R-1", "R-2"],
        ["north", "R-1", "R-3"],
        ["north", "R-2", "R-3"],
        ["south", "R-4", "R-7"],
    ],
)
```

## Solution

```sql
SELECT
  r1.sector,
  r1.relay_id AS primary_relay,
  r2.relay_id AS peer_relay
FROM sector_relays r1
JOIN sector_relays r2
  ON r1.sector = r2.sector
 AND r1.relay_id < r2.relay_id
ORDER BY r1.sector ASC, primary_relay ASC, peer_relay ASC;
```

## Restored

Join bridge failover pairing online — ordered self-join predicates generate unique peer pairs per sector.
