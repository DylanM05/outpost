---
id: maintenance-json-log-line
title: Emit structured JSON log lines
system: Telemetry bus
symbol: instrument
scene: tests
skills: observability
reviewSkill: observability
prerequisite: latency-and-errors
---

## Briefing

Plain-text logs break whenever a message contains a space or newline. Emit one-line structured JSON logs with consistent top-level fields.

## Objective

Write `format_log(level, event, request_id, **fields)`:

- Return a single-line JSON string (using `json.dumps(..., sort_keys=True, separators=(",", ":"))`) representing a dict that contains:
  - Any extra `**fields` passed in
  - `"level"`: `level.upper()`
  - `"event"`: `event`
  - `"request_id"`: `request_id`
- The core keys (`level`, `event`, `request_id`) must never be overwritten if also present in `fields`, and the output must contain no unescaped newline characters.

```python
format_log("warn", "retry", "req-9", attempt=2)
# '{"attempt":2,"event":"retry","level":"WARN","request_id":"req-9"}'
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Build `record = dict(fields)` first, then set `record["level"] = level.upper()`, `record["event"] = event`, and `record["request_id"] = request_id`.
2. Serialize with `json.dumps(record, sort_keys=True, separators=(",", ":"))`.

## Starter

```python
```

## Checks

```python
expect(
    "formats compact sorted JSON",
    lambda: get("format_log")("warn", "retry", "req-9", attempt=2),
    '{"attempt":2,"event":"retry","level":"WARN","request_id":"req-9"}',
)
check(
    "embedded newline is JSON-escaped (stays single line)",
    lambda: "\n" not in get("format_log")("error", "bad\ninput", "req-10"),
)
```

## Hidden checks

```python
expect(
    "extra kwargs work alongside core fields",
    lambda: get("format_log")("info", "served", "req-1", status=200, ms=14),
    '{"event":"served","level":"INFO","ms":14,"request_id":"req-1","status":200}',
)
```

## Solution

```python
import json


def format_log(level, event, request_id, **fields):
    record = dict(fields)
    record["level"] = level.upper()
    record["event"] = event
    record["request_id"] = request_id
    return json.dumps(record, sort_keys=True, separators=(",", ":"))
```

## Restored

Every log line parses cleanly as single-line JSON with a trace ID ready for log aggregation.
