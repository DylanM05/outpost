---
id: validate-the-body
title: Validate the body
system: Route switchboard
symbol: controller
scene: tests
skills: api-design, http
---

## Briefing

Handlers shouldn't each repeat 20 lines of `try/except json.loads` and field-type checking. Write a single request-body validator that checks the `Content-Type` header, parses the JSON object, verifies required fields and their types, and returns the exact HTTP error status (`415` or `400`) when something is wrong.

## Objective

Write `parse_json_body(request, schema)`.

- `request` is a dict with `"headers"` (dict, case-insensitive keys) and `"body"` (`str`).
- `schema` is a dict mapping each required field name to its expected Python type (`str`, `int`, `float`, `bool`, `list`, `dict`), e.g. `{"sku": str, "quantity": int}`.
- Checks, in order:
  1. The `Content-Type` header (case-insensitive) must contain `"application/json"`. If not, return `(415, {"error": "content-type must be application/json"})`.
  2. Parse `request.get("body", "")` with `json.loads`. If invalid JSON or not a JSON object (`dict`), return `(400, {"error": "invalid json object"})`.
  3. For each `field, expected_type` in `schema.items()`:
     - If `field` is missing from the object, return `(400, {"error": f"missing field: {field}"})`.
     - Check the type: reject `bool` when `expected_type is int` (and reject `int` when `expected_type is bool`). If wrong type, return `(400, {"error": f"invalid field: {field}"})`.
  4. If everything passes, return `(200, data)`.

```python
parse_json_body(
    {"headers": {"Content-Type": "application/json"}, "body": '{"sku": "FUEL", "qty": 3}'},
    {"sku": str, "qty": int},
)
# (200, {"sku": "FUEL", "qty": 3})
```

## Concept

Consistent error handling is what separates a trustworthy API from a frustrating one:

- **`415 Unsupported Media Type`**: the client sent plain text or forgot `Content-Type: application/json`.
- **`400 Bad Request`**: the syntax is broken JSON, or required fields are missing or have the wrong type.
- Every error returns a predictable JSON envelope `{"error": "..."}` so clients never have to guess how to read failures.

## Hints

1. Normalize headers with `{k.lower(): v for k, v in request.get("headers", {}).items()}`. Check `"application/json" in headers.get("content-type", "").lower()`.
2. Catch `(json.JSONDecodeError, TypeError)` around `json.loads(request.get("body", ""))` and check `isinstance(data, dict)`.
3. For each `field, expected_type` in `schema.items()`, check `field not in data`, then check types carefully: for `int`, require `type(val) is int`; for `bool`, require `type(val) is bool`; for other types, `isinstance(val, expected_type)`.

## Starter: guided

```python
import json


def parse_json_body(request, schema):
    headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
    if "application/json" not in headers.get("content-type", "").lower():
        return (415, {"error": "content-type must be application/json"})
    try:
        data = json.loads(request.get("body", ""))
    except (json.JSONDecodeError, TypeError):
        return (400, {"error": "invalid json object"})
    if not isinstance(data, dict):
        return (400, {"error": "invalid json object"})
    # Validate every required field and type in schema.
    return (200, data)
```

## Starter: standard

```python
import json


def parse_json_body(request, schema):
    return (400, {"error": "not implemented"})
```

## Starter: challenge

```python
```

## Checks

```python
req = lambda body, ct="application/json": {"headers": {"Content-Type": ct}, "body": body}

expect(
    "valid body passes",
    lambda: get("parse_json_body")(req('{"sku": "FUEL", "qty": 3}'), {"sku": str, "qty": int}),
    (200, {"sku": "FUEL", "qty": 3}),
)
expect(
    "wrong Content-Type returns 415",
    lambda: get("parse_json_body")(req('{"sku": "FUEL"}', "text/plain"), {"sku": str})[0],
    415,
)
expect(
    "malformed JSON returns 400",
    lambda: get("parse_json_body")(req('{"sku": '), {"sku": str})[0],
    400,
)
expect(
    "missing field returns 400",
    lambda: get("parse_json_body")(req('{"sku": "FUEL"}'), {"sku": str, "qty": int})[0],
    400,
)
expect(
    "wrong type returns 400",
    lambda: get("parse_json_body")(req('{"sku": "FUEL", "qty": "three"}'), {"sku": str, "qty": int})[0],
    400,
)
```

## Hidden checks

```python
expect(
    "case-insensitive header and charset parameter accepted",
    lambda: get("parse_json_body")({"headers": {"content-type": "application/json; charset=utf-8"}, "body": '{"ok": true}'}, {"ok": bool}),
    (200, {"ok": True}),
)
expect(
    "bool rejected where int expected",
    lambda: get("parse_json_body")(req('{"qty": true}'), {"qty": int})[0],
    400,
    "Reject bool values when expected_type is int.",
)
expect(
    "JSON array body returns 400",
    lambda: get("parse_json_body")(req('[1, 2, 3]'), {})[0],
    400,
)
```

## Solution

```python
import json


def parse_json_body(request, schema):
    headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
    if "application/json" not in headers.get("content-type", "").lower():
        return (415, {"error": "content-type must be application/json"})
    try:
        data = json.loads(request.get("body", ""))
    except (json.JSONDecodeError, TypeError):
        return (400, {"error": "invalid json object"})
    if not isinstance(data, dict):
        return (400, {"error": "invalid json object"})
    for field, expected_type in schema.items():
        if field not in data:
            return (400, {"error": f"missing field: {field}"})
        value = data[field]
        if expected_type is int:
            ok = isinstance(value, int) and not isinstance(value, bool)
        elif expected_type is bool:
            ok = isinstance(value, bool)
        else:
            ok = isinstance(value, expected_type)
        if not ok:
            return (400, {"error": f"invalid field: {field}"})
    return (200, data)
```

## Restored

Every write endpoint now speaks clean `415` and `400` JSON errors before a single handler touches the database.
