---
id: log-formatter
title: Log formatter
system: Telemetry bus
symbol: instrument
scene: tests
skills: observability, config
---

## Briefing

Wire up Kestrel Ridge's `StructuredLogger`: it writes compact JSON lines with severity filtering (`DEBUG < INFO < WARN < ERROR`) and scrubs sensitive keys automatically so a developer can't accidentally log a password or token.

## Objective

Write a `StructuredLogger(min_level="INFO", clock=lambda: "2026-11-20T00:00:00Z")` class with:

- `self.lines`: a list of formatted JSON strings emitted so far.
- `log(self, level, event, **fields)`:
  - Severity order: `DEBUG` (10) < `INFO` (20) < `WARN` (30) < `ERROR` (40).
  - Normalize `level = level.upper()`. If its severity is below `min_level`, ignore it and return `None`.
  - Redact any key in `fields` (recursively in dicts/lists) whose lowercase name contains `"password"`, `"secret"`, `"token"`, `"authorization"`, or `"api_key"` with `"[REDACTED]"`.
  - Build a dict `{"ts": self.clock(), "level": level, "event": event, **redacted_fields}` and encode it with `json.dumps(..., sort_keys=True, separators=(",", ":"))`.
  - Append the string to `self.lines` and return it.
- Convenience methods `debug(event, **fields)`, `info(event, **fields)`, `warn(event, **fields)`, `error(event, **fields)` that delegate to `log(...)`.

```python
logger = StructuredLogger(min_level="INFO", clock=lambda: "2026-11-20T12:00:00Z")
logger.debug("verbose")                               # ignored (returns None)
logger.error("login_failed", user="mara", password="pw")
# '{"event":"login_failed","level":"ERROR","password":"[REDACTED]","ts":"2026-11-20T12:00:00Z","user":"mara"}'
```

## Concept

Putting **redaction inside the logger itself** is defense in depth: even when a hurried engineer passes `headers=request["headers"]` to `logger.info(...)`, the `Authorization` header is scrubbed before a single byte hits disk.

## Hints

1. Keep `LEVELS = {"DEBUG": 10, "INFO": 20, "WARN": 30, "ERROR": 40}`.
2. Store `self.min_rank = LEVELS[min_level.upper()]`.
3. Reuse the recursive redactor helper from the control panel on `fields` before building the record dict and serializing with `json.dumps(record, sort_keys=True, separators=(",", ":"))`.

## Starter: guided

```python
import json

LEVELS = {"DEBUG": 10, "INFO": 20, "WARN": 30, "ERROR": 40}
SENSITIVE = ("password", "secret", "token", "authorization", "api_key")


def _redact(value):
    if isinstance(value, dict):
        return {
            k: ("[REDACTED]" if any(w in str(k).lower() for w in SENSITIVE) else _redact(v))
            for k, v in value.items()
        }
    if isinstance(value, list):
        return [_redact(item) for item in value]
    return value


class StructuredLogger:
    def __init__(self, min_level="INFO", clock=lambda: "2026-11-20T00:00:00Z"):
        self.min_rank = LEVELS[min_level.upper()]
        self.clock = clock
        self.lines = []

    def log(self, level, event, **fields):
        # Skip below min_rank; redact fields; serialize compact sorted JSON; append and return.
        return None

    def debug(self, event, **fields):
        return self.log("DEBUG", event, **fields)

    def info(self, event, **fields):
        return self.log("INFO", event, **fields)

    def warn(self, event, **fields):
        return self.log("WARN", event, **fields)

    def error(self, event, **fields):
        return self.log("ERROR", event, **fields)
```

## Starter: standard

```python
import json


class StructuredLogger:
    def __init__(self, min_level="INFO", clock=lambda: "2026-11-20T00:00:00Z"):
        self.lines = []

    def log(self, level, event, **fields):
        return None

    def debug(self, event, **fields):
        return self.log("DEBUG", event, **fields)

    def info(self, event, **fields):
        return self.log("INFO", event, **fields)

    def warn(self, event, **fields):
        return self.log("WARN", event, **fields)

    def error(self, event, **fields):
        return self.log("ERROR", event, **fields)
```

## Starter: challenge

```python
```

## Checks

```python
import json as _json

lg = get("StructuredLogger")(min_level="INFO", clock=lambda: "2026-11-20T12:00:00Z")
expect("DEBUG skipped at INFO threshold", lambda: (lg.debug("noise"), len(lg.lines)), (None, 0))
line = lg.error("login_failed", user="mara", password="pw", headers={"Authorization": "Bearer abc"})
expect(
    "emits compact sorted JSON with redacted secrets",
    lambda: line,
    '{"event":"login_failed","headers":{"Authorization":"[REDACTED]"},"level":"ERROR","password":"[REDACTED]","ts":"2026-11-20T12:00:00Z","user":"mara"}',
)
expect("stored in self.lines", lambda: lg.lines, [line])
```

## Hidden checks

```python
lg2 = get("StructuredLogger")(min_level="WARN", clock=lambda: "T1")
expect("INFO skipped at WARN threshold", lambda: lg2.info("ok"), None)
expect("WARN emitted at WARN threshold", lambda: _json.loads(lg2.warn("slow", ms=420))["level"], "WARN")
expect("lowercase level argument accepted", lambda: _json.loads(lg2.log("error", "boom"))["level"], "ERROR")
```

## Solution

```python
import json

LEVELS = {"DEBUG": 10, "INFO": 20, "WARN": 30, "ERROR": 40}
SENSITIVE = ("password", "secret", "token", "authorization", "api_key")


def _redact(value):
    if isinstance(value, dict):
        return {
            k: ("[REDACTED]" if any(w in str(k).lower() for w in SENSITIVE) else _redact(v))
            for k, v in value.items()
        }
    if isinstance(value, list):
        return [_redact(item) for item in value]
    return value


class StructuredLogger:
    def __init__(self, min_level="INFO", clock=lambda: "2026-11-20T00:00:00Z"):
        self.min_rank = LEVELS[min_level.upper()]
        self.clock = clock
        self.lines = []

    def log(self, level, event, **fields):
        norm = level.upper()
        if LEVELS[norm] < self.min_rank:
            return None
        record = _redact(fields)
        record["ts"] = self.clock()
        record["level"] = norm
        record["event"] = event
        line = json.dumps(record, sort_keys=True, separators=(",", ":"))
        self.lines.append(line)
        return line

    def debug(self, event, **fields):
        return self.log("DEBUG", event, **fields)

    def info(self, event, **fields):
        return self.log("INFO", event, **fields)

    def warn(self, event, **fields):
        return self.log("WARN", event, **fields)

    def error(self, event, **fields):
        return self.log("ERROR", event, **fields)
```

## Restored

Every service on the grid now emits clean, filtered, secret-free JSON lines.
