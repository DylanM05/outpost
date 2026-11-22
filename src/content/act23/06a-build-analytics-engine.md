---
id: build-analytics-engine
title: Build an end-to-end experiment and cohort analytics workbench
system: Analytics audit
symbol: controller
scene: tests
assessment: true
skills: tabular-wrangling, applied-statistics, forecasting-cohorts
---

## Briefing

Tie the entire analytics hall together into `AnalyticsReport(users, events)` — joining user metadata with activity logs, cleaning outlier spend with IQR filtering, evaluating stratified A/B experiments (so Simpson's paradox never fools you!), fitting spend trends with OLS, and generating cohort retention curves!

## Concept

Implement `AnalyticsReport(users, events)`:
- `users`: list of dicts `{"user_id": str, "variant": "A"|"B", "segment": str}`.
- `events`: list of dicts `{"user_id": str, "period": int, "converted": bool, "spend": float|None}`.
- **`join_events()`:** Left-joins `events` onto `users` by `"user_id"` (ignoring events for unknown users? Better: **inner** hash join on `"user_id"` so only valid assigned users enter experiment analysis, preserving `events` order and merging `"variant"` and `"segment"` into each event copy).
- **`ab_summary(segment=None, alpha=0.05)`:**
  - Evaluates user-level conversion (a user counts as converted iff ANY of their events has `converted=True`; denominator `n` is the number of assigned users in that variant, optionally filtered to `user["segment"] == segment`!).
  - Runs the exact two-proportion Z-test (`math.erfc(abs(z) / math.sqrt(2.0))`) comparing Variant `"A"` (control) vs. Variant `"B"` (treatment).
  - Returns `{"n_a": n_a, "n_b": n_b, "rate_a": round(pa, 4), "rate_b": round(pb, 4), "lift": round(pb - pa, 4), "p_value": round(p_val, 6), "significant": p_val < alpha}`.
- **`clean_spend_trend()`:**
  - Collects all non-`None` `(period, spend)` pairs from joined events.
  - Computes Tukey IQR fences (`[Q1 - 1.5*IQR, Q3 + 1.5*IQR]`) over all non-`None` spend values and drops outlier events outside those fences!
  - Fits OLS linear regression `spend ~ period` over the surviving clean `(period, spend)` points.
  - Returns `{"dropped_outliers": int, "slope": round(m, 4), "intercept": round(b, 4), "r2": round(r2, 4)}`.
- **`cohorts()`:**
  - Computes cohort retention over `(user_id, period)` for all joined events, returning `{cohort_period: {"size": int, "rates": list[float]}}`.

## Objective

Implement `AnalyticsReport(users, events)` with `join_events`, `ab_summary`, `clean_spend_trend`, and `cohorts`.

## Hints

1. For `ab_summary(segment=...)`, build `converted_users = {e["user_id"] for e in joined if e.get("converted")}` first, then filter `users` by `segment` (if given) and count total users + converted users in `"A"` and `"B"` — that way users with zero events still count accurately in the denominator!
2. Reuse linear-interpolated `quantile` for `Q1` and `Q3` before computing `lower = q1 - 1.5 * iqr` and `upper = q3 + 1.5 * iqr`.

## Starter: guided

```python
import math


class AnalyticsReport:
    def __init__(self, users, events):
        self.users = list(users)
        self.events = list(events)

    def join_events(self):
        pass

    def ab_summary(self, segment=None, alpha=0.05):
        pass

    def clean_spend_trend(self):
        pass

    def cohorts(self):
        pass
```

## Starter: standard

```python
import math


class AnalyticsReport:
    def __init__(self, users, events):
        pass

    def join_events(self):
        pass

    def ab_summary(self, segment=None, alpha=0.05):
        pass

    def clean_spend_trend(self):
        pass

    def cohorts(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _report_e2e():
    users = (
        [{"user_id": f"a{i}", "variant": "A", "segment": "web"} for i in range(100)]
        + [{"user_id": f"b{i}", "variant": "B", "segment": "web"} for i in range(100)]
    )
    events = []
    # 10/100 convert in A, 30/100 convert in B -> significant lift!
    for i in range(10):
        events.append({"user_id": f"a{i}", "period": 1, "converted": True, "spend": 10.0})
        events.append({"user_id": f"a{i}", "period": 2, "converted": False, "spend": 20.0})
    for i in range(20):
        events.append({"user_id": f"b{i}", "period": 1, "converted": True, "spend": 10.0})
        events.append({"user_id": f"b{i}", "period": 2, "converted": False, "spend": 20.0})
        events.append({"user_id": f"b{i}", "period": 3, "converted": False, "spend": 30.0})
    for i in range(20, 30):
        events.append({"user_id": f"b{i}", "period": 1, "converted": True, "spend": 10.0})
    # Add a huge corrupted outlier spend at period 2 and an unknown user event!
    events.append({"user_id": "b0", "period": 2, "converted": False, "spend": 9999.0})
    events.append({"user_id": "ghost", "period": 1, "converted": True, "spend": 50.0})

    rep = get("AnalyticsReport")(users, events)
    joined = rep.join_events()
    ab = rep.ab_summary(segment="web")
    trend = rep.clean_spend_trend()
    coh = rep.cohorts()
    return (
        len(joined),
        (ab["n_a"], ab["n_b"], ab["rate_a"], ab["rate_b"], ab["significant"]),
        trend,
        coh,
    )
expect("joins valid users, runs A/B Z-test, filters IQR spend outlier before OLS, and builds cohorts", _report_e2e, (
    91,
    (100, 100, 0.1, 0.3, True),
    {"dropped_outliers": 1, "slope": 10.0, "intercept": 0.0, "r2": 1.0},
    {1: {"size": 40, "rates": [1.0, 0.75, 0.5]}},
))
```

## Hidden checks

```python
def _stratified():
    users = [
        {"user_id": "u1", "variant": "A", "segment": "mob"},
        {"user_id": "u2", "variant": "A", "segment": "mob"},
        {"user_id": "u3", "variant": "B", "segment": "mob"},
        {"user_id": "u4", "variant": "B", "segment": "desk"},
    ]
    events = [
        {"user_id": "u1", "period": 0, "converted": True, "spend": 5.0},
        {"user_id": "u4", "period": 0, "converted": True, "spend": 5.0},
    ]
    rep = get("AnalyticsReport")(users, events)
    mob = rep.ab_summary(segment="mob")
    return (mob["n_a"], mob["n_b"], mob["rate_a"], mob["rate_b"], mob["significant"])
expect("stratifies A/B summary by segment cleanly", _stratified, (2, 1, 0.5, 0.0, False))
```

## Solution

```python
import math


def _quantile(sorted_vals, q):
    pos = q * (len(sorted_vals) - 1)
    lo = math.floor(pos)
    hi = math.ceil(pos)
    return float(sorted_vals[lo] + (pos - lo) * (sorted_vals[hi] - sorted_vals[lo]))


class AnalyticsReport:
    def __init__(self, users, events):
        self.users = list(users)
        self.events = list(events)

    def join_events(self):
        user_map = {u["user_id"]: u for u in self.users}
        out = []
        for e in self.events:
            u = user_map.get(e["user_id"])
            if u is None:
                continue
            merged = dict(e)
            merged["variant"] = u["variant"]
            merged["segment"] = u["segment"]
            out.append(merged)
        return out

    def ab_summary(self, segment=None, alpha=0.05):
        joined = self.join_events()
        converted_ids = {e["user_id"] for e in joined if e.get("converted")}
        scoped = [u for u in self.users if segment is None or u["segment"] == segment]
        a_users = [u["user_id"] for u in scoped if u["variant"] == "A"]
        b_users = [u["user_id"] for u in scoped if u["variant"] == "B"]
        n_a, n_b = len(a_users), len(b_users)
        if n_a == 0 or n_b == 0:
            raise ValueError("both variants must have at least one user")
        w_a = sum(1 for uid in a_users if uid in converted_ids)
        w_b = sum(1 for uid in b_users if uid in converted_ids)
        pa, pb = w_a / n_a, w_b / n_b
        lift = pb - pa
        p_pool = (w_a + w_b) / (n_a + n_b)
        se = math.sqrt(p_pool * (1.0 - p_pool) * (1.0 / n_a + 1.0 / n_b))
        p_val = 1.0 if se == 0.0 else math.erfc(abs(lift / se) / math.sqrt(2.0))
        return {
            "n_a": n_a,
            "n_b": n_b,
            "rate_a": round(pa, 4),
            "rate_b": round(pb, 4),
            "lift": round(lift, 4),
            "p_value": round(p_val, 6),
            "significant": p_val < alpha,
        }

    def clean_spend_trend(self):
        joined = self.join_events()
        pairs = [(e["period"], float(e["spend"])) for e in joined if e.get("spend") is not None]
        if len(pairs) < 2:
            raise ValueError("need at least 2 spend observations")
        spends = sorted(s for _, s in pairs)
        q1 = _quantile(spends, 0.25)
        q3 = _quantile(spends, 0.75)
        iqr = q3 - q1
        lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        clean = [(p, s) for p, s in pairs if lo <= s <= hi]
        dropped = len(pairs) - len(clean)
        xs = [p for p, _ in clean]
        ys = [s for _, s in clean]
        mx = sum(xs) / len(xs)
        my = sum(ys) / len(ys)
        ssx = sum((x - mx) ** 2 for x in xs)
        if ssx == 0:
            raise ValueError("periods cannot all be identical")
        slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / ssx
        intercept = my - slope * mx
        ss_res = sum((y - (slope * x + intercept)) ** 2 for x, y in zip(xs, ys))
        ss_tot = sum((y - my) ** 2 for y in ys)
        r2 = 1.0 if ss_tot == 0 else 1.0 - (ss_res / ss_tot)
        return {
            "dropped_outliers": dropped,
            "slope": round(slope, 4),
            "intercept": round(intercept, 4),
            "r2": round(r2, 4),
        }

    def cohorts(self):
        joined = self.join_events()
        if not joined:
            return {}
        user_periods = {}
        for e in joined:
            user_periods.setdefault(e["user_id"], set()).add(e["period"])
        groups = {}
        for periods in user_periods.values():
            first = min(periods)
            groups.setdefault(first, []).append(periods)
        out = {}
        for c in sorted(groups):
            members = groups[c]
            size = len(members)
            max_off = max(max(p) - c for p in members)
            rates = [
                round(sum(1 for p in members if (c + k) in p) / size, 4)
                for k in range(max_off + 1)
            ]
            out[c] = {"size": size, "rates": rates}
        return out
```

## Restored

The analytics hall now joins user telemetry, filters IQR outliers, validates A/B experiments, and tracks cohort retention end to end.
