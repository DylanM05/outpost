---
id: cohort-retention
title: Build a user cohort retention matrix from activity logs
system: Forecast rail
symbol: controller
scene: tests
skills: forecasting-cohorts
---

## Briefing

Total active users can look flat even while new signups churn out immediately. Product analysts build **cohort retention matrices**: grouping users by the **first period** they appeared (`cohort_period`) and measuring what percentage returned at period offsets `0, 1, 2, ...`!

## Concept

Write `cohort_retention(events)` where `events` is a list of `(user_id, period_int)` tuples (may contain duplicate visits by the same user in the same period!):
1. Find each user's **cohort period**: `cohort[user] = min(period for all events of user)`.
2. For each cohort `c` (in sorted ascending order):
   - Let `cohort_size = count of unique users whose cohort == c`.
   - Find the maximum offset `max_off = max(period - c for users in cohort c)`.
   - For every integer offset `k` from `0` to `max_off` inclusive:
     - `retained_k = count of unique users in cohort c who have an event at period == c + k`.
     - `pct_k = round(retained_k / cohort_size, 4)`.
   - Store `result[c] = {"size": cohort_size, "rates": [pct_0, pct_1, ..., pct_max_off]}`.
3. Return `result` (empty dict if `events` is empty).

## Objective

Implement `cohort_retention(events)` returning `{cohort_period: {"size": int, "rates": list[float]}}`.

## Hints

1. Deduplicate `(user_id, period)` pairs with a `set` (or store `user_periods[user].add(period)`) so a user visiting five times in period 1 is only counted once!
2. Notice `rates[0]` is ALWAYS `1.0` because every user in cohort `c` was active in period `c`.

## Starter: guided

```python
def cohort_retention(events):
    if not events:
        return {}
    user_periods = {}
    for user, period in events:
        user_periods.setdefault(user, set()).add(period)
    # Assign each user to min(periods), then compute retention rates per offset 0..max_off.
    pass
```

## Starter: standard

```python
def cohort_retention(events):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
_EVENTS = [
    ("u1", 1), ("u1", 1), ("u1", 2), ("u1", 3),
    ("u2", 1), ("u2", 3),  # skipped period 2, returned period 3!
    ("u3", 2), ("u3", 3),
    ("u4", 2),
]
expect("builds deduplicated cohort retention rates including skipped periods", lambda: get("cohort_retention")(_EVENTS), {
    1: {"size": 2, "rates": [1.0, 0.5, 1.0]},
    2: {"size": 2, "rates": [1.0, 0.5]},
})
```

## Hidden checks

```python
expect("empty events returns {}", lambda: get("cohort_retention")([]), {})
expect("single-period cohort has [1.0]", lambda: get("cohort_retention")([("a", 5), ("b", 5)]), {5: {"size": 2, "rates": [1.0]}})
```

## Solution

```python
def cohort_retention(events):
    if not events:
        return {}
    user_periods = {}
    for user, period in events:
        user_periods.setdefault(user, set()).add(period)

    cohorts = {}
    for user, periods in user_periods.items():
        first = min(periods)
        cohorts.setdefault(first, []).append(periods)

    result = {}
    for c in sorted(cohorts):
        members = cohorts[c]
        size = len(members)
        max_off = max(max(p) - c for p in members)
        rates = []
        for k in range(max_off + 1):
            retained = sum(1 for p in members if (c + k) in p)
            rates.append(round(retained / size, 4))
        result[c] = {"size": size, "rates": rates}
    return result
```

## Restored

The forecast rail now tracks real cohort retention curves without double-counting repeat sessions.
