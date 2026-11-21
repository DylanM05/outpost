---
id: build-stream-pipeline
title: Build an end-to-end telemetry stream pipeline
system: Telemetry audit
symbol: controller
scene: tests
assessment: true
skills: stream-processing, analytical-storage, data-pipelines
---

## Briefing

Wire every stage of the telemetry lab into one unified `TelemetryPipeline`: schema validation & DLQ routing, monotonic watermark enforcement, tumbling-window rollups stored in zone-map-indexed row groups, and rolling Z-score anomaly detection!

## Concept

When `pipeline.ingest(raw_records)` processes a list of raw dicts (each expected to have `"ts"` as `int`, `"sensor"` as `str`, `"value"` as finite `float`):
1. **Schema gate:** Coerce `"ts"` (`int`, not `bool`), `"sensor"` (non-empty `str`), `"value"` (finite `float`, not `bool`). Bad rows go to `self.dlq` (`{"row": raw, "error": reason}`).
2. **Watermark gate:** Track a global `self.watermark` (starts at `0`). If `ts < self.watermark`, increment `self.late_dropped += 1` and skip! Otherwise update `self.watermark = max(self.watermark, ts - self.allowed_lateness)` and accept the row.
3. **Storage:** Append accepted rows into fixed-size **row groups** of `row_group_size` rows, keeping per-group min/max zone-map stats for `"ts"` and `"value"` (`{"rows": [...], "stats": {"ts": (lo, hi), "value": (lo, hi)}}`)!

Methods:
- `ingest(self, raw_records)` -> returns `{"accepted": int, "dlq": int, "late_dropped": int}` for this call.
- `query_range(self, min_ts, max_ts, min_value=None)` -> uses row-group zone maps to skip non-overlapping row groups, counts how many row groups were scanned (`groups_scanned`), and returns `{"rows": matching_rows, "groups_scanned": groups_scanned}` (rows in ingestion order where `min_ts <= r["ts"] <= max_ts` and if `min_value is not None`, `r["value"] >= min_value`).
- `window_summary(self, sensor, window_size)` -> computes tumbling windows (`[{"start", "end", "count", "avg"}, ...]`, sorted by `"start"`) over accepted rows for `sensor`.
- `anomalies(self, sensor, window=4, threshold=3.0)` -> runs rolling Z-score anomaly detection over accepted values for `sensor` (in ingestion order), returning the list of anomalous row dicts!

## Objective

Implement `TelemetryPipeline(allowed_lateness=10, row_group_size=4)` with the four methods above (`ingest`, `query_range`, `window_summary`, `anomalies`).

## Hints

1. Keep `self.row_groups = []`: when appending an accepted row, open a new row group if `not self.row_groups or len(self.row_groups[-1]["rows"]) >= self.row_group_size`, and update that group's `(min, max)` stats for `"ts"` and `"value"`.
2. In `query_range`, skip a row group immediately if `hi_ts < min_ts or lo_ts > max_ts` or (`min_value is not None and hi_val < min_value`) BEFORE incrementing `groups_scanned`!

## Starter: guided

```python
import math


class TelemetryPipeline:
    def __init__(self, allowed_lateness=10, row_group_size=4):
        if allowed_lateness < 0 or row_group_size < 1:
            raise ValueError("invalid pipeline config")
        self.allowed_lateness = allowed_lateness
        self.row_group_size = row_group_size
        self.watermark = 0
        self.dlq = []
        self.late_dropped = 0
        self.row_groups = []

    def ingest(self, raw_records):
        return {"accepted": 0, "dlq": 0, "late_dropped": 0}

    def query_range(self, min_ts, max_ts, min_value=None):
        return {"rows": [], "groups_scanned": 0}

    def window_summary(self, sensor, window_size):
        return []

    def anomalies(self, sensor, window=4, threshold=3.0):
        return []
```

## Starter: standard

```python
import math


class TelemetryPipeline:
    def __init__(self, allowed_lateness=10, row_group_size=4):
        pass

    def ingest(self, raw_records):
        pass

    def query_range(self, min_ts, max_ts, min_value=None):
        pass

    def window_summary(self, sensor, window_size):
        pass

    def anomalies(self, sensor, window=4, threshold=3.0):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _e2e():
    p = get("TelemetryPipeline")(allowed_lateness=5, row_group_size=3)
    r = p.ingest([
        {"ts": "10", "sensor": "t1", "value": "20.0"},
        {"ts": "12", "sensor": "t1", "value": "21.0"},
        {"ts": "15", "sensor": "t1", "value": "19.0"},
        {"ts": "bad", "sensor": "t1", "value": "20.0"},
        {"ts": "4", "sensor": "t1", "value": "20.0"},
        {"ts": "22", "sensor": "t1", "value": "20.0"},
        {"ts": "24", "sensor": "t1", "value": "95.0"},
        {"ts": "28", "sensor": "t1", "value": "20.0"},
    ])
    q = p.query_range(20, 30, min_value=50.0)
    wins = p.window_summary("t1", 10)
    anoms = p.anomalies("t1", window=4, threshold=3.0)
    return (
        r,
        q["groups_scanned"],
        [row["value"] for row in q["rows"]],
        [(w["start"], w["count"], round(w["avg"], 2)) for w in wins],
        [a["ts"] for a in anoms],
    )
expect("runs full ETL, watermark, zone-map pruning, tumbling rollup, and anomaly detection", _e2e, (
    {"accepted": 6, "dlq": 1, "late_dropped": 1},
    1,
    [95.0],
    [(10, 3, 20.0), (20, 3, 45.0)],
    [24],
))
```

## Hidden checks

```python
def _prune_all():
    p = get("TelemetryPipeline")(allowed_lateness=10, row_group_size=2)
    p.ingest([{"ts": 100, "sensor": "s", "value": 10.0}, {"ts": 105, "sensor": "s", "value": 12.0}])
    q = p.query_range(200, 300)
    return (q["groups_scanned"], q["rows"])
expect("prunes all row groups when query range does not overlap", _prune_all, (0, []))
```

## Solution

```python
import math


def _parse_int(val):
    if isinstance(val, bool) or val is None:
        raise ValueError("invalid int")
    if isinstance(val, int):
        return val
    if isinstance(val, str):
        return int(val.strip())
    raise ValueError("invalid int")


def _parse_float(val):
    if isinstance(val, bool) or val is None:
        raise ValueError("invalid float")
    f = float(val)
    if not math.isfinite(f):
        raise ValueError("non-finite float")
    return f


class TelemetryPipeline:
    def __init__(self, allowed_lateness=10, row_group_size=4):
        if allowed_lateness < 0 or row_group_size < 1:
            raise ValueError("invalid pipeline config")
        self.allowed_lateness = allowed_lateness
        self.row_group_size = row_group_size
        self.watermark = 0
        self.dlq = []
        self.late_dropped = 0
        self.row_groups = []

    def _append_row(self, row):
        if not self.row_groups or len(self.row_groups[-1]["rows"]) >= self.row_group_size:
            self.row_groups.append({
                "rows": [row],
                "stats": {"ts": (row["ts"], row["ts"]), "value": (row["value"], row["value"])},
            })
            return
        rg = self.row_groups[-1]
        rg["rows"].append(row)
        tlo, thi = rg["stats"]["ts"]
        vlo, vhi = rg["stats"]["value"]
        rg["stats"]["ts"] = (min(tlo, row["ts"]), max(thi, row["ts"]))
        rg["stats"]["value"] = (min(vlo, row["value"]), max(vhi, row["value"]))

    def ingest(self, raw_records):
        accepted = 0
        dlq_count = 0
        late_count = 0
        for raw in raw_records:
            try:
                if not isinstance(raw, dict):
                    raise ValueError("record must be a dict")
                ts = _parse_int(raw.get("ts"))
                sensor = raw.get("sensor")
                if not isinstance(sensor, str) or not sensor.strip():
                    raise ValueError("invalid sensor")
                value = _parse_float(raw.get("value"))
                row = {"ts": ts, "sensor": sensor.strip(), "value": value}
            except (ValueError, TypeError) as exc:
                self.dlq.append({"row": raw, "error": str(exc)})
                dlq_count += 1
                continue

            if row["ts"] < self.watermark:
                self.late_dropped += 1
                late_count += 1
                continue

            self.watermark = max(self.watermark, row["ts"] - self.allowed_lateness)
            self._append_row(row)
            accepted += 1

        return {"accepted": accepted, "dlq": dlq_count, "late_dropped": late_count}

    def query_range(self, min_ts, max_ts, min_value=None):
        matches = []
        scanned = 0
        for rg in self.row_groups:
            tlo, thi = rg["stats"]["ts"]
            _, vhi = rg["stats"]["value"]
            if thi < min_ts or tlo > max_ts:
                continue
            if min_value is not None and vhi < min_value:
                continue
            scanned += 1
            for row in rg["rows"]:
                if min_ts <= row["ts"] <= max_ts and (min_value is None or row["value"] >= min_value):
                    matches.append(row)
        return {"rows": matches, "groups_scanned": scanned}

    def window_summary(self, sensor, window_size):
        if window_size < 1:
            raise ValueError("window_size must be >= 1")
        buckets = {}
        for rg in self.row_groups:
            for row in rg["rows"]:
                if row["sensor"] != sensor:
                    continue
                start = (row["ts"] // window_size) * window_size
                if start not in buckets:
                    buckets[start] = [0, 0.0]
                buckets[start][0] += 1
                buckets[start][1] += row["value"]
        return [
            {"start": s, "end": s + window_size, "count": c, "avg": total / c}
            for s, (c, total) in sorted(buckets.items())
        ]

    def anomalies(self, sensor, window=4, threshold=3.0):
        if window < 2 or threshold <= 0:
            raise ValueError("invalid anomaly parameters")
        rows = [row for rg in self.row_groups for row in rg["rows"] if row["sensor"] == sensor]
        flagged = []
        for i in range(window, len(rows)):
            prev = [rows[j]["value"] for j in range(i - window, i)]
            mean = sum(prev) / window
            std = math.sqrt(sum((x - mean) ** 2 for x in prev) / window)
            val = rows[i]["value"]
            if std == 0.0:
                if val != mean:
                    flagged.append(rows[i])
            elif abs(val - mean) / std >= threshold:
                flagged.append(rows[i])
        return flagged
```

## Restored

The telemetry lab ingests messy streams safely, drops late arrivals via watermarks, prunes cold row groups with zone maps, and flags rolling anomalies automatically.
