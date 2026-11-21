---
id: latency-and-errors
title: Latency and errors
system: Telemetry bus
symbol: instrument
scene: tests
skills: observability
---

## Briefing

Averages lie about latency: if 19 requests take 10 ms and 1 request stalls for 4,000 ms, the average looks calm (~210 ms) while 5% of your users are timing out. Production dashboards track **error rate** (fraction of `5xx` responses) and **tail latency** (`p50` median and `p95` 95th percentile). Build the grid's metrics aggregator over JSON-lines access logs.

## Objective

Write `summarize_metrics(log_lines)`.

Each entry in `log_lines` is a JSON string like `'{"path": "/orders", "status": 201, "duration_ms": 42}'`.

Return a dictionary:
- `"total"`: total number of requests (`int`).
- `"error_rate"`: fraction of requests with `500 <= status < 600`, rounded to 4 decimal places (`0.0` if empty).
- `"p50_ms"`: 50th percentile of `duration_ms` (`0` if empty).
- `"p95_ms"`: 95th percentile of `duration_ms` (`0` if empty).
- `"slowest_path"`: the `"path"` with the highest average `duration_ms` (breaking ties alphabetically by path, or `None` if empty).

Use the nearest-rank percentile formula on the sorted durations `s` of length `n`:
`index = max(0, math.ceil(p * n) - 1)` where `p` is `0.50` for p50 and `0.95` for p95.

```python
# Durations [10, 20, 30, 40, 500] (n=5):
# p50 -> ceil(2.5)-1 = index 2 -> 30
# p95 -> ceil(4.75)-1 = index 4 -> 500
```

## Concept

The **RED metrics** (Rate, Errors, Duration) are the foundation of service monitoring:

- **Rate**: how many requests are arriving (`total`).
- **Errors**: `5xx` server failures (separate from `4xx` user typos!).
- **Duration**: `p50` (typical experience) and `p95` (tail latency experienced by the slowest 5% of requests).

Grouping durations by `path` immediately points you to which endpoint is dragging down the service.

## Hints

1. Handle `if not log_lines:` first, returning `{"total": 0, "error_rate": 0.0, "p50_ms": 0, "p95_ms": 0, "slowest_path": None}`.
2. Parse each line with `json.loads`, count `500 <= status < 600`, collect all `duration_ms` in a list, and group durations by `path` in a dict.
3. Sort `durations` once, then use `durations[max(0, math.ceil(p * n) - 1)]`.
4. For `slowest_path`, compare `(-sum(ds) / len(ds), path)` with `min(...)` so higher average comes first and ties break alphabetically!

## Starter: guided

```python
import json
import math


def _percentile(sorted_vals, p):
    idx = max(0, math.ceil(p * len(sorted_vals)) - 1)
    return sorted_vals[idx]


def summarize_metrics(log_lines):
    if not log_lines:
        return {"total": 0, "error_rate": 0.0, "p50_ms": 0, "p95_ms": 0, "slowest_path": None}
    # Parse entries, compute error_rate, p50_ms, p95_ms, and slowest_path.
    return {}
```

## Starter: standard

```python
import json
import math


def summarize_metrics(log_lines):
    return {}
```

## Starter: challenge

```python
```

## Checks

```python
import json as _json

logs = [
    _json.dumps({"path": "/healthz", "status": 200, "duration_ms": 5}),
    _json.dumps({"path": "/catalog", "status": 200, "duration_ms": 20}),
    _json.dumps({"path": "/catalog", "status": 404, "duration_ms": 15}),
    _json.dumps({"path": "/orders", "status": 201, "duration_ms": 40}),
    _json.dumps({"path": "/orders", "status": 500, "duration_ms": 500}),
]
expect(
    "computes total, 5xx error_rate (ignoring 404), p50, p95, and slowest_path",
    lambda: get("summarize_metrics")(logs),
    {
        "total": 5,
        "error_rate": 0.2,
        "p50_ms": 20,
        "p95_ms": 500,
        "slowest_path": "/orders",
    },
)
expect(
    "empty logs return clean zero summary",
    lambda: get("summarize_metrics")([]),
    {"total": 0, "error_rate": 0.0, "p50_ms": 0, "p95_ms": 0, "slowest_path": None},
)
```

## Hidden checks

```python
# 20 requests: 19 fast (10ms) and 1 slow (900ms), 2 with 503
twenty = [_json.dumps({"path": "/a", "status": 200, "duration_ms": 10}) for _ in range(18)]
twenty.append(_json.dumps({"path": "/b", "status": 503, "duration_ms": 10}))
twenty.append(_json.dumps({"path": "/c", "status": 502, "duration_ms": 900}))
expect(
    "20-request p50 vs p95 and 5xx rate",
    lambda: get("summarize_metrics")(twenty),
    {"total": 20, "error_rate": 0.1, "p50_ms": 10, "p95_ms": 10, "slowest_path": "/c"},
)

# Tie-break slowest_path alphabetically
tied = [
    _json.dumps({"path": "/z", "status": 200, "duration_ms": 50}),
    _json.dumps({"path": "/a", "status": 200, "duration_ms": 50}),
]
expect("slowest_path breaks ties alphabetically", lambda: get("summarize_metrics")(tied)["slowest_path"], "/a")
```

## Solution

```python
import json
import math


def _percentile(sorted_vals, p):
    idx = max(0, math.ceil(p * len(sorted_vals)) - 1)
    return sorted_vals[idx]


def summarize_metrics(log_lines):
    if not log_lines:
        return {
            "total": 0,
            "error_rate": 0.0,
            "p50_ms": 0,
            "p95_ms": 0,
            "slowest_path": None,
        }

    durations = []
    by_path = {}
    errors = 0
    for line in log_lines:
        entry = json.loads(line)
        dur = entry["duration_ms"]
        durations.append(dur)
        by_path.setdefault(entry["path"], []).append(dur)
        if 500 <= entry["status"] < 600:
            errors += 1

    durations.sort()
    total = len(durations)
    slowest_path = min(by_path, key=lambda p: (-sum(by_path[p]) / len(by_path[p]), p))
    return {
        "total": total,
        "error_rate": round(errors / total, 4),
        "p50_ms": _percentile(durations, 0.50),
        "p95_ms": _percentile(durations, 0.95),
        "slowest_path": slowest_path,
    }
```

## Restored

The telemetry bus turns raw JSON access logs into instant `5xx` error rates, `p50`/`p95` latencies, and culprit endpoints.
