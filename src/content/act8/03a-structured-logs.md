---
id: structured-logs
kind: predict
title: Structured logs
system: Telemetry bus
symbol: instrument
scene: console
skills: observability, reading-code
---

## Briefing

Plain text logs like `"Order failed"` are nearly useless when 50 requests are running at once: which user? which endpoint? which request? **Structured JSON-lines logging** writes one JSON object per line with a **correlation ID (`request_id`)**, so you can filter every event belonging to one failing request in a single pass. Trace what this log filter pulls out.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

Each JSON line is self-contained and machine-readable:

```json
{"level":"ERROR","request_id":"req-2","event":"db_error","sku":"FUEL"}
```

When an incoming HTTP request arrives, the server either reads its `X-Request-Id` header or generates a fresh ID, attaches it to every log line emitted during that request, and returns it in the response. When an operator reports an error with `req-2`, you immediately get the complete timeline for `req-2` without noise from `req-1` or `req-3`.

## Hints

1. Filter the parsed lines to those whose `"request_id"` equals `"req-2"`.
2. Notice `"req-1"` and `"req-2"` interleave in the raw log, and filtering by `"req-2"` pulls out its exact sequence of events in order.

## Program

```python
import json

raw_logs = [
    '{"request_id": "req-1", "level": "INFO", "event": "start"}',
    '{"request_id": "req-2", "level": "INFO", "event": "start"}',
    '{"request_id": "req-1", "level": "INFO", "event": "done"}',
    '{"request_id": "req-2", "level": "WARN", "event": "retry"}',
    '{"request_id": "req-2", "level": "ERROR", "event": "timeout"}',
]

events = []
for line in raw_logs:
    entry = json.loads(line)
    if entry["request_id"] == "req-2":
        events.append(f"{entry['level']}:{entry['event']}")

print(len(events))
for e in events:
    print(e)
```

## Output

```text
3
INFO:start
WARN:retry
ERROR:timeout
```

## Restored

You traced how a single `request_id` separates one failing request's story from interleaved traffic.
