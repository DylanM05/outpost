---
id: maintenance-header-lookup
title: Case-insensitive HTTP headers
system: Client desk
symbol: instrument
scene: tests
skills: http
reviewSkill: http
prerequisite: retry-the-wire
---

## Briefing

HTTP header names are case-insensitive (`Content-Type`, `content-type`, and `CONTENT-TYPE` all mean the same thing), and `Content-Type` often includes parameters like `; charset=utf-8`.

## Objective

Write two functions:

1. `get_header(headers, name, default=None)` — returns the header's value matching `name` regardless of casing, or `default` if absent.
2. `media_type(headers)` — reads `Content-Type` case-insensitively, strips any `; ...` parameters and surrounding whitespace, and returns it lowercased (or `""` if missing).

```python
h = {"Content-Type": "Application/JSON; charset=utf-8", "X-Relay": "KR-1"}
get_header(h, "x-relay")  # "KR-1"
media_type(h)             # "application/json"
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Lowercase `name` and compare against `k.lower()` for each `k, v` in `headers.items()`.
2. For `media_type`, split the `Content-Type` value on `";"` and `.strip().lower()` the first part.

## Starter

```python
```

## Checks

```python
h = {"Content-Type": "Application/JSON; charset=utf-8", "X-Relay": "KR-1"}
expect("get_header case-insensitive hit", lambda: get("get_header")(h, "x-relay"), "KR-1")
expect("get_header default on miss", lambda: get("get_header")(h, "Authorization", "none"), "none")
expect("media_type strips charset and lowercases", lambda: get("media_type")(h), "application/json")
```

## Hidden checks

```python
expect("media_type missing header returns empty string", lambda: get("media_type")({"Accept": "*/*"}), "")
expect("get_header with uppercase lookup", lambda: get("get_header")({"etag": '"abc"'}, "ETAG"), '"abc"')
```

## Solution

```python
def get_header(headers, name, default=None):
    target = name.lower()
    for key, value in headers.items():
        if key.lower() == target:
            return value
    return default


def media_type(headers):
    raw = get_header(headers, "Content-Type")
    if not raw:
        return ""
    return raw.split(";", 1)[0].strip().lower()
```

## Restored

Header checks stop breaking whenever a proxy lowercases or re-cases header names.
