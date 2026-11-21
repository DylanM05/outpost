---
id: maintenance-etag-check
title: Conditional ETag caching
system: Route switchboard
symbol: controller
scene: tests
skills: api-design
reviewSkill: api-design
prerequisite: validate-the-body
---

## Briefing

Sending the entire station catalog on every poll burns link bandwidth. Compute a strong `ETag` from the response body and return `304` whenever the client already has that version.

## Objective

Write two functions:

1. `make_etag(body)` — accepts a `str` (encode as UTF-8) or `bytes`, computes its SHA-256 hex digest, and returns the quoted first 16 hex characters: `f'"{digest[:16]}"'`.
2. `conditional_status(headers, etag)` — looks up `If-None-Match` case-insensitively in `headers`. Return `304` if the header value is `"*"` or contains `etag` (splitting comma-separated values and stripping whitespace); otherwise return `200`.

```python
tag = make_etag('{"ok":true}')
conditional_status({"if-none-match": tag}, tag)  # 304
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `hashlib.sha256(data).hexdigest()[:16]` wrapped in double quotes `f'"{...}"'`.
2. Look up `if-none-match` case-insensitively, split on `","`, strip each candidate, and check if `"*"` or `etag` is in the resulting set.

## Starter

```python
```

## Checks

```python
tag = get("make_etag")('{"ok":true}')
check("make_etag returns quoted 16-hex-char string", lambda: isinstance(tag, str) and len(tag) == 18 and tag.startswith('"') and tag.endswith('"'))
expect("matching If-None-Match returns 304", lambda: get("conditional_status")({"if-none-match": tag}, tag), 304)
expect("non-matching If-None-Match returns 200", lambda: get("conditional_status")({"If-None-Match": '"deadbeefdeadbeef"'}, tag), 200)
```

## Hidden checks

```python
tag = get("make_etag")(b"binary-manifest")
expect("comma-separated ETag list hits 304", lambda: get("conditional_status")({"If-None-Match": f'"0000000000000000", {tag}'}, tag), 304)
expect("wildcard * hits 304", lambda: get("conditional_status")({"If-None-Match": "*"}, tag), 304)
expect("missing header returns 200", lambda: get("conditional_status")({}, tag), 200)
```

## Solution

```python
import hashlib


def make_etag(body):
    raw = body.encode("utf-8") if isinstance(body, str) else body
    return f'"{hashlib.sha256(raw).hexdigest()[:16]}"'


def conditional_status(headers, etag):
    for key, value in headers.items():
        if key.lower() == "if-none-match":
            tags = {part.strip() for part in value.split(",")}
            if "*" in tags or etag in tags:
                return 304
    return 200
```

## Restored

Clients holding a fresh copy now get lightweight `304` replies instead of re-downloading the full payload.
