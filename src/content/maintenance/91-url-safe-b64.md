---
id: maintenance-url-safe-b64
title: Unpadded URL-safe Base64
system: Byte decoder
symbol: instrument
scene: tests
skills: encoding
reviewSkill: encoding
prerequisite: bitwise-mask
---

## Briefing

JWT tokens and URL parameters use **unpadded URL-safe Base64** (`-` and `_` instead of `+` and `/`, with trailing `=` stripped). Implement clean encoding and decoding.

## Objective

Write two functions:

1. `encode_b64url(data)` — accepts `bytes` (or UTF-8 `str`), encodes with `base64.urlsafe_b64encode`, strips trailing `"="`, and returns an ASCII `str`.
2. `decode_b64url(text)` — restores the required `=` padding (`(-len(text)) % 4`) and decodes back to `bytes` (raising `ValueError` on invalid characters).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. `base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")`.
2. Before decoding, append `"=" * ((-len(text)) % 4)` and validate that only `[A-Za-z0-9_-=]` appear.

## Starter

```python
```

## Checks

```python
expect("strips padding and uses URL-safe alphabet", lambda: get("encode_b64url")(b"\xfb\xff\xfe"), "-__-")
expect("round-trips arbitrary lengths (0, 1, 2, 3, 4)", lambda: [get("decode_b64url")(get("encode_b64url")(b"a" * n)) for n in range(5)], [b"a" * n for n in range(5)])
```

## Hidden checks

```python
expect("encodes UTF-8 str cleanly", lambda: get("decode_b64url")(get("encode_b64url")("ridge-4°")), "ridge-4°".encode("utf-8"))
def bad_char():
    try:
        get("decode_b64url")("abc+def!")
        return False
    except ValueError:
        return True
check("invalid characters raise ValueError", bad_char)
```

## Solution

```python
import base64
import re


def encode_b64url(data):
    raw = data.encode("utf-8") if isinstance(data, str) else data
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def decode_b64url(text):
    if not isinstance(text, str) or not re.fullmatch(r"[A-Za-z0-9_-]*", text):
        raise ValueError("invalid base64url string")
    padded = text + ("=" * ((-len(text)) % 4))
    return base64.urlsafe_b64decode(padded.encode("ascii"))
```

## Restored

URL-safe tokens now pack and unpack cleanly without `=` padding or `+`/`/` escaping issues.
