---
id: maintenance-sql-composite-index
language: sql
title: Create a covering composite index for filtered and sorted alert queries
system: Index bench
symbol: instrument
scene: tests
skills: sql-indexes-transactions
reviewSkill: sql-indexes-transactions
prerequisite: sql-json-and-fts
---

## Briefing

The alert dashboard runs this query thousands of times per minute:
```sql
SELECT code FROM alert_stream WHERE severity = 'critical' AND ts >= 500 ORDER BY ts DESC;
```
Without an index, SQLite scans the entire `alert_stream` table and sorts in memory. Create a composite covering index `idx_alerts_sev_ts_code` so `EXPLAIN QUERY PLAN` uses `SEARCH alert_stream USING COVERING INDEX idx_alerts_sev_ts_code`.

## Objective

Write a `CREATE INDEX idx_alerts_sev_ts_code ON alert_stream(...)` statement with the columns ordered so the query seeks by `severity`, scans by `ts`, and covers `code`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Put the equality column first (`severity`), the range/sort column second (`ts`), and the projected column third (`code`): `CREATE INDEX idx_alerts_sev_ts_code ON alert_stream(severity, ts, code);`.

## Setup

```sql
CREATE TABLE alert_stream (
  alert_id INTEGER PRIMARY KEY,
  severity TEXT NOT NULL,
  ts INTEGER NOT NULL,
  code TEXT NOT NULL,
  detail TEXT NOT NULL
);

INSERT INTO alert_stream (alert_id, severity, ts, code, detail) VALUES
  (1, 'critical', 510, 'E-10', 'bus overvolt'),
  (2, 'warning',  520, 'W-04', 'fan slow'),
  (3, 'critical', 640, 'E-22', 'cryo leak');
```

## Starter

```sql
-- Create covering index idx_alerts_sev_ts_code on alert_stream
```

## Checks

```python
def _check_plan():
    plan = query(
        "EXPLAIN QUERY PLAN SELECT code FROM alert_stream WHERE severity = 'critical' AND ts >= 500 ORDER BY ts DESC"
    )
    return any("USING COVERING INDEX idx_alerts_sev_ts_code" in str(r[-1]) for r in plan)

check(
    "query plan uses SEARCH alert_stream USING COVERING INDEX idx_alerts_sev_ts_code",
    _check_plan,
    "Create idx_alerts_sev_ts_code on alert_stream(severity, ts, code).",
)
```

## Hidden checks

```python
expect(
    "index has exact column sequence (severity, ts, code)",
    lambda: [r[2] for r in query("SELECT * FROM pragma_index_info('idx_alerts_sev_ts_code') ORDER BY seqno ASC")],
    ["severity", "ts", "code"],
)
```

## Solution

```sql
CREATE INDEX idx_alerts_sev_ts_code
ON alert_stream(severity, ts, code);
```

## Restored

Index bench composite covering index online — critical alert lookups now execute as index-only B-tree seeks without temp sorts.
