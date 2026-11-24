---
id: sql-explain-plan-trace
kind: predict
language: sql
title: Trace composite index columns with pragma_index_xinfo
system: Index bench
symbol: instrument
scene: console
skills: sql-indexes-transactions, reading-code
---

## Briefing

A composite B-tree index `idx_logs_sector_ts_level` on `logs(sector ASC, ts DESC, level ASC)` stores sorted key columns followed by SQLite's internal base-table `rowid` pointer. Tracing `pragma_index_xinfo('idx_logs_sector_ts_level')` reveals exact key positions (`seqno`), sort directions (`desc`), and which trailing slot points back to the table rather than holding an indexed key (`key = 0`).

## Objective

Trace the query in `## Program` against `pragma_index_xinfo('idx_logs_sector_ts_level')`, then predict **every line of output** (header plus all four rows).

## Concept

- Every column you declare in `CREATE INDEX` gets a sequential `seqno` starting at `0`, with `key = 1`:
  - `desc = 0` means ascending (`ASC`, the default); `desc = 1` means descending (`DESC`).
- Unlike `pragma_index_info` (which lists only the declared key columns), `pragma_index_xinfo` also reveals SQLite's implicit trailing base-table `rowid` entry:
  - Its `name` is `NULL`, `desc` is `0`, and `key` is `0`.
  - When a query reads only columns present in the index (`sector`, `ts`, `level`) plus the table `rowid` / `INTEGER PRIMARY KEY`, SQLite can satisfy it with a covering-index scan without looking up the base table row.
- In pipe-separated table output, SQLite `NULL` prints as `NULL`.

## Hints

1. Look at `CREATE INDEX idx_logs_sector_ts_level ON logs(sector ASC, ts DESC, level ASC)` in `## Setup`: `seqno` `0`, `1`, and `2` are `sector`, `ts`, and `level`, each with `key = 1`. Only `ts` is `DESC`, so its `desc` column is `1` while the others are `0`.
2. `pragma_index_xinfo` includes one extra hidden column after all declared index keys (`seqno = 3`) for the underlying table `rowid`.
3. For that hidden `rowid` row, `name` is `NULL`, `desc` is `0`, and `key` is `0` — so the fourth data row prints `3 | NULL | 0 | 0`.

## Setup

```sql
CREATE TABLE logs (
  log_id INTEGER PRIMARY KEY,
  sector TEXT NOT NULL,
  ts INTEGER NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL
);

CREATE INDEX idx_logs_sector_ts_level ON logs(sector ASC, ts DESC, level ASC);
```

## Program

```sql
SELECT seqno, name, desc, key
FROM pragma_index_xinfo('idx_logs_sector_ts_level')
ORDER BY seqno ASC;
```

## Output

```text
seqno | name | desc | key
0 | sector | 0 | 1
1 | ts | 1 | 1
2 | level | 0 | 1
3 | NULL | 0 | 0
```

## Restored

Index bench layout trace verified — `pragma_index_xinfo` exposes each key column's sort direction (`desc`) and the trailing `NULL` non-key `rowid` pointer (`key = 0`) that links index entries back to base rows.
