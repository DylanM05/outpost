---
id: maintenance-parse-query
title: Parse URL query parameters
system: Client desk
symbol: instrument
scene: tests
skills: http
reviewSkill: http
prerequisite: retry-the-wire
---

## Briefing

Incoming relay URLs carry URL-encoded query parameters, sometimes repeating the same key (`?tag=north&tag=ice&q=relay%20one`). Parse them cleanly.

## Objective

Write `parse_query(url)` that parses the query string of `url` and returns a dictionary mapping each parameter name to:
- a single `str` if that key appears once, or
- a `list[str]` in order if that key appears multiple times.

Return `{}` if there is no query string.

```python
parse_query("https://ridge.local/search?q=north%20mast&tag=a&tag=b")
# {"q": "north mast", "tag": ["a", "b"]}
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `urllib.parse.urlsplit(url).query` and `urllib.parse.parse_qs(query, keep_blank_values=True)`.
2. `parse_qs` always maps each key to a list of values — unwrap single-element lists to `values[0]`.

## Starter

```python
```

## Checks

```python
expect(
    "decodes spaces and preserves repeated keys",
    lambda: get("parse_query")("https://ridge.local/search?q=north%20mast&tag=a&tag=b"),
    {"q": "north mast", "tag": ["a", "b"]},
)
expect(
    "URL without query returns {}",
    lambda: get("parse_query")("https://ridge.local/status"),
    {},
)
```

## Hidden checks

```python
expect(
    "ignores fragment after #",
    lambda: get("parse_query")("https://ridge.local/logs?level=WARN#top"),
    {"level": "WARN"},
)
expect(
    "preserves blank parameter value",
    lambda: get("parse_query")("https://ridge.local/logs?filter=&limit=5"),
    {"filter": "", "limit": "5"},
)
```

## Solution

```python
from urllib.parse import parse_qs, urlsplit


def parse_query(url):
    raw = parse_qs(urlsplit(url).query, keep_blank_values=True)
    return {k: (v[0] if len(v) == 1 else v) for k, v in raw.items()}
```

## Restored

Query strings with spaces, repeated filters, and fragments decode cleanly every time.
