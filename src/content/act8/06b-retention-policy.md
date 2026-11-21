---
id: retention-policy
title: Retention policy
system: Backup vault
symbol: equipment
scene: tests
skills: reliability
---

## Briefing

Taking nightly backups is easy — until a year of snapshots fills the disk and crashes the database. A **Grandfather-Father-Son retention policy** keeps the most recent daily backups (for fast recent recovery) plus one backup per week for older weeks (so you can still recover from a bug discovered weeks later), and prunes the rest.

## Objective

Write `plan_retention(dates, keep_daily, keep_weekly)`.

- `dates` is a list of `"YYYY-MM-DD"` date strings (may be unsorted, unique).
- Working from **newest to oldest**:
  1. Keep the newest `keep_daily` backups (daily tier).
  2. Also keep the **newest** backup from each of the newest `keep_weekly` distinct ISO calendar weeks (`date.fromisoformat(d).isocalendar()[:2]`, i.e., `(iso_year, iso_week)`). Note: a backup already kept in the daily tier still counts for its ISO week!
- Return `(keep, delete)` where both `keep` and `delete` are sorted ascending (`"YYYY-MM-DD"` oldest first).

```python
# 10 daily backups across 2 ISO weeks, keep_daily=3, keep_weekly=2:
# Keeps the newest 3 days, plus the newest backup of the earlier ISO week; deletes the rest.
```

## Concept

Good backup retention balances **recovery granularity** against **disk space**:

- `datetime.date.fromisoformat("2026-11-20")` parses ISO dates safely.
- `.isocalendar()[:2]` returns `(iso_year, iso_week)` — handling year boundaries accurately (unlike `strftime("%W")`).
- Returning `(keep, delete)` as a **dry-run plan** before deleting anything is a core operations habit: inspect what would be removed before touching disk!

## Hints

1. Sort `newest_first = sorted(dates, reverse=True)`.
2. Put `newest_first[:keep_daily]` into `kept = set(...)`.
3. Walk `newest_first` in order, tracking `seen_weeks = set()`: for each `d`, get `wk = date.fromisoformat(d).isocalendar()[:2]`. If `wk not in seen_weeks` and `len(seen_weeks) < keep_weekly`, add `wk` to `seen_weeks` and add `d` to `kept`.
4. Return `(sorted(kept), sorted(d for d in dates if d not in kept))`.

## Starter: guided

```python
from datetime import date


def plan_retention(dates, keep_daily, keep_weekly):
    newest_first = sorted(dates, reverse=True)
    kept = set(newest_first[:keep_daily])
    seen_weeks = set()
    # Walk newest_first and keep the newest backup from each of the newest keep_weekly ISO weeks.
    keep = sorted(kept)
    delete = sorted(d for d in dates if d not in kept)
    return (keep, delete)
```

## Starter: standard

```python
from datetime import date


def plan_retention(dates, keep_daily, keep_weekly):
    return ([], [])
```

## Starter: challenge

```python
```

## Checks

```python
# Week 46 (Nov 9-15, 2026) and Week 47 (Nov 16-20, 2026)
days = [
    "2026-11-11", "2026-11-13", "2026-11-15",  # week 46 (newest is Nov 15)
    "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20",  # week 47
]
expect(
    "keeps newest 2 dailies + newest backup from each of the 2 newest weeks",
    lambda: get("plan_retention")(days, keep_daily=2, keep_weekly=2),
    (
        ["2026-11-15", "2026-11-19", "2026-11-20"],
        ["2026-11-11", "2026-11-13", "2026-11-17", "2026-11-18"],
    ),
)
expect(
    "empty list returns ([], [])",
    lambda: get("plan_retention")([], 3, 2),
    ([], []),
)
```

## Hidden checks

```python
# 4 distinct weeks, keep_daily=1, keep_weekly=3
weeks = [
    "2026-10-28",  # W44
    "2026-11-04", "2026-11-06",  # W45 -> keep Nov 06
    "2026-11-12", "2026-11-14",  # W46 -> keep Nov 14
    "2026-11-18", "2026-11-20",  # W47 -> keep Nov 20
]
expect(
    "keeps newest 3 weeks and prunes week 44",
    lambda: get("plan_retention")(weeks, keep_daily=1, keep_weekly=3),
    (
        ["2026-11-06", "2026-11-14", "2026-11-20"],
        ["2026-10-28", "2026-11-04", "2026-11-12", "2026-11-18"],
    ),
)
expect(
    "keep_daily=0, keep_weekly=0 deletes all",
    lambda: get("plan_retention")(["2026-11-20", "2026-11-19"], 0, 0),
    ([], ["2026-11-19", "2026-11-20"]),
)
```

## Solution

```python
from datetime import date


def plan_retention(dates, keep_daily, keep_weekly):
    newest_first = sorted(dates, reverse=True)
    kept = set(newest_first[:keep_daily])
    seen_weeks = set()
    for d in newest_first:
        wk = date.fromisoformat(d).isocalendar()[:2]
        if wk not in seen_weeks and len(seen_weeks) < keep_weekly:
            seen_weeks.add(wk)
            kept.add(d)
    keep = sorted(kept)
    delete = sorted(d for d in dates if d not in kept)
    return (keep, delete)
```

## Restored

The backup vault keeps recent dailies and older weeklies automatically, preventing full-disk outages across the winter.
