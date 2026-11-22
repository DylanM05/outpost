---
id: schema-coercion
title: Coerce ETL schemas and route bad rows to a DLQ
system: Schema gate
symbol: controller
scene: tests
skills: data-pipelines
---

## Briefing

Upstream sensor exports arrive as messy string dictionaries (`{"ts": "1700", "temp": "23.5", "ok": "true"}`), and every batch contains a few corrupted records (`"temp": "N/A"`). Coerce valid rows into typed records and divert malformed rows into a **Dead-Letter Queue (DLQ)** without halting the pipeline.

## Concept

`schema` maps each required field name to `"int"`, `"float"`, `"str"`, or `"bool"`:
- `"int"`: accept `int` (not `bool`!) or integer strings like `"42"` / `"-5"`.
- `"float"`: accept `int`/`float` (not `bool`!, not NaN/inf!) or numeric strings like `"23.5"`.
- `"str"`: accept non-`None` values converted via `str(v)` (Wait: reject `None` or missing required field!).
- `"bool"`: accept `bool`, or strings `"true"`/`"1"` (`True`) and `"false"`/`"0"` (`False`) case-insensitively.

If ANY required field is missing, `None`, or fails coercion, append `(row, reason)` to `dlq` instead of crashing! Extra fields not in `schema` are dropped cleanly so downstream tables always see exact columns.

## Objective

Write `ingest_batch(rows, schema)` returning `{"valid": [...], "dlq": [...]}` where:
- `"valid"` is the list of coerced dicts containing only keys from `schema`.
- `"dlq"` is a list of `{"row": row, "error": reason_str}` dicts for rejected rows (preserving original order).

## Hints

1. Write a helper `_coerce(value, kind)` raising `ValueError` when coercion fails (remember `isinstance(True, int)` is True in Python, and `math.isfinite(x)` catches `"nan"` and `"inf"`!).
2. Loop over each `row`: try coercing every `field, kind` in `schema.items()`; on `KeyError`/`ValueError`/`TypeError`, record in `dlq`.

## Starter: guided

```python
import math


def _coerce(value, kind):
    if value is None:
        raise ValueError("null value")
    if kind == "bool":
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            low = value.strip().lower()
            if low in ("true", "1"):
                return True
            if low in ("false", "0"):
                return False
        raise ValueError("invalid bool")
    # Handle "int", "float", and "str"
    raise ValueError(f"unsupported kind: {kind}")


def ingest_batch(rows, schema):
    valid = []
    dlq = []
    for row in rows:
        # Coerce all fields in schema or append {"row": row, "error": str(exc)} to dlq
        pass
    return {"valid": valid, "dlq": dlq}
```

## Starter: standard

```python
import math


def ingest_batch(rows, schema):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _batch():
    schema = {"ts": "int", "temp": "float", "ok": "bool", "node": "str"}
    rows = [
        {"ts": "100", "temp": "21.5", "ok": "TRUE", "node": "s1", "extra": 99},
        {"ts": "bad", "temp": "21.5", "ok": "true", "node": "s2"},
        {"ts": 102, "temp": "NaN", "ok": False, "node": "s3"},
    ]
    res = get("ingest_batch")(rows, schema)
    return (res["valid"], len(res["dlq"]), [d["row"]["node"] for d in res["dlq"]])
expect("coerces valid rows, drops extra columns, and routes bad rows to DLQ", _batch, (
    [{"ts": 100, "temp": 21.5, "ok": True, "node": "s1"}],
    2,
    ["s2", "s3"],
))
```

## Hidden checks

```python
def _bool_and_missing():
    schema = {"n": "int"}
    res = get("ingest_batch")([{"n": True}, {}, {"n": None}, {"n": "-7"}], schema)
    return (res["valid"], len(res["dlq"]))
expect("rejects bool-for-int, missing key, and None while accepting negative int strings", _bool_and_missing, ([{"n": -7}], 3))
```

## Solution

```python
import math


def _coerce(value, kind):
    if value is None:
        raise ValueError("missing or null value")
    if kind == "bool":
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            low = value.strip().lower()
            if low in ("true", "1"):
                return True
            if low in ("false", "0"):
                return False
        raise ValueError(f"invalid bool: {value!r}")
    if kind == "int":
        if isinstance(value, bool):
            raise ValueError("bool is not int")
        if isinstance(value, int):
            return value
        if isinstance(value, str):
            return int(value.strip())
        raise ValueError(f"invalid int: {value!r}")
    if kind == "float":
        if isinstance(value, bool):
            raise ValueError("bool is not float")
        f = float(value)
        if not math.isfinite(f):
            raise ValueError("non-finite float")
        return f
    if kind == "str":
        return str(value)
    raise ValueError(f"unknown type: {kind}")


def ingest_batch(rows, schema):
    valid = []
    dlq = []
    for row in rows:
        try:
            if not isinstance(row, dict):
                raise ValueError("row must be a dict")
            clean = {}
            for field, kind in schema.items():
                if field not in row:
                    raise ValueError(f"missing field: {field}")
                clean[field] = _coerce(row[field], kind)
            valid.append(clean)
        except (ValueError, TypeError) as exc:
            dlq.append({"row": row, "error": str(exc)})
    return {"valid": valid, "dlq": dlq}
```

## Restored

Schema coercion now strips unexpected columns, guards against `NaN` and `bool`-as-`int`, and isolates bad rows in the DLQ.
