---
id: maintenance-parse-bearer
title: Parse a Bearer token header
system: Gatehouse
symbol: controller
scene: tests
skills: auth
reviewSkill: auth
prerequisite: who-may-change-it
---

## Briefing

Protected endpoints read tokens from `Authorization: Bearer <token>`. Malformed headers (`Basic ...`, missing token, extra spaces) must return `None` instead of crashing or letting bad credentials slip through.

## Objective

Write `extract_bearer(headers)`:

- Find the `Authorization` header case-insensitively.
- Accept only the exact scheme `Bearer` (case-insensitive) followed by whitespace and a single non-empty token with no internal whitespace.
- Return the token string, or `None` if the header is missing or malformed.

```python
extract_bearer({"authorization": "Bearer tok_123"})  # "tok_123"
extract_bearer({"Authorization": "Basic abc"})       # None
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Look up `authorization` case-insensitively.
2. `parts = value.strip().split()` — it's valid iff `len(parts) == 2 and parts[0].lower() == "bearer"`.

## Starter

```python
```

## Checks

```python
expect("standard Bearer header", lambda: get("extract_bearer")({"Authorization": "Bearer tok_abc"}), "tok_abc")
expect("lowercase header and scheme", lambda: get("extract_bearer")({"authorization": "bearer tok_xyz"}), "tok_xyz")
expect("Basic auth rejected", lambda: get("extract_bearer")({"Authorization": "Basic dXNlcjpwYXNz"}), None)
```

## Hidden checks

```python
expect("missing header returns None", lambda: get("extract_bearer")({}), None)
expect("Bearer with no token returns None", lambda: get("extract_bearer")({"Authorization": "Bearer   "}), None)
expect("extra token segment rejected", lambda: get("extract_bearer")({"Authorization": "Bearer a b"}), None)
```

## Solution

```python
def extract_bearer(headers):
    for key, value in headers.items():
        if key.lower() == "authorization":
            if not isinstance(value, str):
                return None
            parts = value.strip().split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                return parts[1]
            return None
    return None
```

## Restored

The gatehouse extracts clean Bearer tokens and turns away malformed headers before verification even starts.
