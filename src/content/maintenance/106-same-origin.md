---
id: maintenance-same-origin
title: Check URL same-origin equivalence
system: Crawler desk
symbol: equipment
scene: tests
skills: crawling
reviewSkill: crawling
prerequisite: bounded-crawler
---

## Briefing

Before the crawler follows a discovered link, it must verify the link belongs to the same origin — taking default ports (`80` for `http`, `443` for `https`) and host casing into account.

## Objective

Write `is_same_origin(url_a, url_b)` returning `True` if both URLs share the same effective `(scheme, host, port)` tuple, and `False` otherwise.

Rules:
- Compare `scheme` and `hostname` case-insensitively.
- Use effective port: explicit port if present, otherwise `80` for `http` and `443` for `https`.
- Only `http` and `https` URLs with a non-empty hostname can match; return `False` for any other scheme or missing host.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `urllib.parse.urlsplit(url)` to extract `scheme`, `hostname`, and `port`.
2. Write a small helper `origin(url)` returning `(scheme, hostname, port)` or `None` if `scheme not in ("http", "https")` or `not hostname`.

## Starter

```python
```

## Checks

```python
expect("implicit and explicit default http port match", lambda: get("is_same_origin")("http://Ridge.Local/a", "HTTP://ridge.local:80/b?x=1"), True)
expect("implicit and explicit default https port match", lambda: get("is_same_origin")("https://ridge.local/a", "https://ridge.local:443/z"), True)
expect("different schemes do not match", lambda: get("is_same_origin")("http://ridge.local/a", "https://ridge.local/a"), False)
expect("different ports do not match", lambda: get("is_same_origin")("http://ridge.local:8080/a", "http://ridge.local/a"), False)
```

## Hidden checks

```python
expect("different subdomains do not match", lambda: get("is_same_origin")("https://a.ridge.local/", "https://b.ridge.local/"), False)
expect("non-http schemes return False even if equal", lambda: get("is_same_origin")("ftp://ridge.local/a", "ftp://ridge.local/b"), False)
```

## Solution

```python
from urllib.parse import urlsplit

DEFAULT_PORTS = {"http": 80, "https": 443}


def _origin(url):
    parts = urlsplit(url)
    scheme = parts.scheme.lower()
    if scheme not in DEFAULT_PORTS or not parts.hostname:
        return None
    try:
        port = parts.port
    except ValueError:
        return None
    return (scheme, parts.hostname.lower(), port if port is not None else DEFAULT_PORTS[scheme])


def is_same_origin(url_a, url_b):
    oa = _origin(url_a)
    ob = _origin(url_b)
    return oa is not None and oa == ob
```

## Restored

Same-origin enforcement now treats default ports and host casing consistently without leaking onto external hosts.
