---
id: maintenance-sql-fix-index-order
language: sql
title: Fix a composite index whose leading range column prevented equality prefix seeks
system: Index bench
symbol: instrument
scene: tests
skills: sql-indexes-transactions
reviewSkill: sql-indexes-transactions
prerequisite: sql-json-and-fts
---

## Briefing

The query planner needs to satisfy:
```sql
SELECT bytes FROM uplink_packets WHERE channel = 'deep-space' AND ts >= 1000 ORDER BY ts ASC;
```
using a covering index without a separate `USE TEMP B-TREE FOR ORDER BY` sort step. The existing index `idx_uplink_covering` was defined on `(ts, channel, bytes)` — putting the range column `ts` before the equality column `channel`, which forces SQLite to scan across channels or sort manually!

## Objective

Drop and recreate `idx_uplink_covering` on `uplink_packets(channel, ts, bytes)` so the equality predicate `channel = 'deep-space'` is the leading column, `ts` provides pre-sorted range traversal, and `bytes` is covered.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Run `DROP INDEX IF EXISTS idx_uplink_covering;` followed by `CREATE INDEX idx_uplink_covering ON uplink_packets(channel, ts, bytes);`.

## Setup

```sql
CREATE TABLE uplink_packets (
  pkt_id INTEGER PRIMARY KEY,
  channel TEXT NOT NULL,
  ts INTEGER NOT NULL,
  bytes INTEGER NOT NULL
);

CREATE INDEX idx_uplink_covering ON uplink_packets(ts, channel, bytes);

INSERT INTO uplink_packets (pkt_id, channel, ts, bytes) VALUES
  (1, 'deep-space', 1020, 512),
  (2, 'local',      1050, 256),
  (3, 'deep-space', 1100, 1024);
```

## Starter

```sql
-- Replace idx_uplink_covering so (channel, ts, bytes) is the column order
DROP INDEX IF EXISTS idx_uplink_covering;
CREATE INDEX idx_uplink_covering ON uplink_packets(ts, channel, bytes);
```

## Checks

```python
expect(
    "idx_uplink_covering orders columns as (channel, ts, bytes)",
    lambda: [r[2] for r in query("SELECT * FROM pragma_index_info('idx_uplink_covering') ORDER BY seqno ASC")],
    ["channel", "ts", "bytes"],
)

def _check_no_temp_btree():
    plan = query(
        "EXPLAIN QUERY PLAN SELECT bytes FROM uplink_packets WHERE channel = 'deep-space' AND ts >= 1000 ORDER BY ts ASC"
    )
    details = " | ".join(str(r[-1]) for r in plan)
    return "USING COVERING INDEX idx_uplink_covering" in details and "TEMP B-TREE" not in details

check(
    "query plan uses covering index without a TEMP B-TREE sort",
    _check_no_temp_btree,
    "Order idx_uplink_covering columns as (channel, ts, bytes) so ORDER BY ts ASC is already satisfied.",
)
```

## Hidden checks

```python
expect(
    "target query still returns expected bytes in ts ASC order",
    lambda: query("SELECT bytes FROM uplink_packets WHERE channel = 'deep-space' AND ts >= 1000 ORDER BY ts ASC"),
    [[512], [1024]],
)
```

## Solution

```sql
DROP INDEX IF EXISTS idx_uplink_covering;

CREATE INDEX idx_uplink_covering
ON uplink_packets(channel, ts, bytes);
```

## Restored

Index bench column order fixed — placing equality column `channel` before range/sort column `ts` eliminates the temporary B-tree sort.
