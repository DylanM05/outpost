---
id: scrub-the-secrets
title: Scrub the secrets
system: Control panel
symbol: instrument
scene: tests
skills: config, security
---

## Briefing

Logs are read by operators, copied into bug reports, and archived in shared folders — which makes them one of the most common places secrets leak. Before any request context or config dump hits a log file, pass it through a recursive scrubber that replaces sensitive fields with `"[REDACTED]"` without mutating the live data.

## Objective

Write `redact(data)`.

- A dictionary key is **sensitive** if its lowercase string contains any of these substrings: `"password"`, `"secret"`, `"token"`, `"authorization"`, `"api_key"`, `"cookie"`.
- Return a **new** copy of `data` (never mutating `data` or any nested dict/list inside it!):
  - For a `dict`: for each `k, v`, if `str(k).lower()` is sensitive, map `k` to `"[REDACTED]"`; otherwise recursively `redact(v)`.
  - For a `list`: return `[redact(item) for item in data]`.
  - For any other value: return it unchanged.

```python
redact({
    "user": "mara",
    "headers": {"Authorization": "Bearer abc", "Accept": "application/json"},
    "nested": [{"api_key": "k-123", "ok": True}],
})
# {
#   "user": "mara",
#   "headers": {"Authorization": "[REDACTED]", "Accept": "application/json"},
#   "nested": [{"api_key": "[REDACTED]", "ok": True}],
# }
```

## Concept

Preventing **sensitive data exposure** in logs (Boot.dev *Learn Web Security*, Data Leaks) takes two habits:

1. Redact **recursively**, because tokens hide inside nested `"headers"` dicts or lists of webhook payloads.
2. Stay **pure** (never mutate the caller's request dict in place — otherwise your own auth middleware would receive `"[REDACTED]"` instead of the real token!).

## Hints

1. Keep `SENSITIVE = ("password", "secret", "token", "authorization", "api_key", "cookie")`.
2. Write a helper `is_sensitive(key)`: `lower = str(key).lower(); return any(word in lower for word in SENSITIVE)`.
3. Recurse on `isinstance(data, dict)` and `isinstance(data, list)`, returning all other values as-is.

## Starter: guided

```python
SENSITIVE = ("password", "secret", "token", "authorization", "api_key", "cookie")


def _is_sensitive(key):
    lower = str(key).lower()
    return any(word in lower for word in SENSITIVE)


def redact(data):
    if isinstance(data, dict):
        # Build a new dict redacting sensitive keys and recursing on others.
        return {}
    if isinstance(data, list):
        return [redact(item) for item in data]
    return data
```

## Starter: standard

```python
def redact(data):
    return data
```

## Starter: challenge

```python
```

## Checks

```python
sample = {
    "user": "mara",
    "password_hash": "abc$123",
    "headers": {"Authorization": "Bearer xyz", "Accept": "application/json"},
    "items": [{"api_key": "k-9", "sku": "FUEL"}],
}
expect(
    "redacts sensitive keys at every nesting level",
    lambda: get("redact")(sample),
    {
        "user": "mara",
        "password_hash": "[REDACTED]",
        "headers": {"Authorization": "[REDACTED]", "Accept": "application/json"},
        "items": [{"api_key": "[REDACTED]", "sku": "FUEL"}],
    },
)
expect(
    "does not mutate the original dictionary",
    lambda: (sample["headers"]["Authorization"], sample["items"][0]["api_key"]),
    ("Bearer xyz", "k-9"),
    "Return new dicts and lists instead of modifying data in place.",
)
```

## Hidden checks

```python
expect(
    "matches case-insensitively and catches cookie/secret/token",
    lambda: get("redact")({"X-Refresh-Token": "r1", "Set-Cookie": "s=1", "WEBHOOK_SECRET": "shh", "port": 8080}),
    {"X-Refresh-Token": "[REDACTED]", "Set-Cookie": "[REDACTED]", "WEBHOOK_SECRET": "[REDACTED]", "port": 8080},
)
expect("primitives pass through unchanged", lambda: (get("redact")("hello"), get("redact")(42), get("redact")(None)), ("hello", 42, None))
```

## Solution

```python
SENSITIVE = ("password", "secret", "token", "authorization", "api_key", "cookie")


def _is_sensitive(key):
    lower = str(key).lower()
    return any(word in lower for word in SENSITIVE)


def redact(data):
    if isinstance(data, dict):
        out = {}
        for k, v in data.items():
            out[k] = "[REDACTED]" if _is_sensitive(k) else redact(v)
        return out
    if isinstance(data, list):
        return [redact(item) for item in data]
    return data
```

## Restored

Tokens, cookies, and passwords are scrubbed automatically before any log line leaves the control panel.
