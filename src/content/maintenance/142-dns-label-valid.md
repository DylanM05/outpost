---
id: maintenance-dns-label-valid
title: Validate RFC 1035 DNS hostnames
system: Name resolver
symbol: equipment
scene: tests
skills: transport-protocols
reviewSkill: transport-protocols
prerequisite: tcp-aimd-cwnd
---

## Briefing

Before dispatching an upstream DNS query, reject malformed hostnames containing spaces, underscores, empty labels, or leading/trailing hyphens.

## Objective

Write `is_valid_hostname(name)` returning `True` iff `name` (after stripping one optional trailing `"."`) is a valid hostname:
- Total length between `1` and `253` characters.
- Split on `"."`, every label has length `1..63`.
- Every label contains only ASCII letters, digits, or `"-"` (`[A-Za-z0-9-]`), and does NOT start or end with `"-"`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Strip one trailing `"."` if `name.endswith(".")`, then reject `not text or len(text) > 253`.
2. For each label in `text.split(".")`, check `1 <= len(label) <= 63`, `not label.startswith("-")`, `not label.endswith("-")`, and `all(c.isascii() and (c.isalnum() or c == "-") for c in label)`.

## Starter

```python
```

## Checks

```python
expect("accepts standard multi-label hostname", lambda: get("is_valid_hostname")("relay-01.kestrel.local."), True)
expect("rejects leading or trailing hyphen in label", lambda: (get("is_valid_hostname")("-bad.local"), get("is_valid_hostname")("bad-.local")), (False, False))
expect("rejects empty label and underscore", lambda: (get("is_valid_hostname")("a..b"), get("is_valid_hostname")("my_host.local")), (False, False))
```

## Hidden checks

```python
expect("rejects label over 63 chars", lambda: get("is_valid_hostname")("a" * 64 + ".local"), False)
expect("rejects empty or dot-only hostname", lambda: (get("is_valid_hostname")(""), get("is_valid_hostname")(".")), (False, False))
```

## Solution

```python
def is_valid_hostname(name):
    if not isinstance(name, str):
        return False
    text = name[:-1] if name.endswith(".") else name
    if not text or len(text) > 253:
        return False
    for label in text.split("."):
        if not (1 <= len(label) <= 63):
            return False
        if label.startswith("-") or label.endswith("-"):
            return False
        if not all(c.isascii() and (c.isalnum() or c == "-") for c in label):
            return False
    return True
```

## Restored

Invalid hostnames are filtered out before ever reaching the DNS wire encoder.
