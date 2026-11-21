---
id: normalize-url
kind: code
title: Normalize URLs for crawling
system: Crawler desk
symbol: instrument
scene: tests
skills: crawling, http-protocol
---

## Briefing

To a web crawler, `https://Ridge.Local:443/logs/`, `http://ridge.local/logs`, and `https://ridge.local/logs#top` all point to the **exact same page**. Without normalizing URLs before checking `visited`, a crawler fetches the same page over and over!

## Objective

Write `normalize_url(url)`:

- Parse `url` with `urllib.parse.urlsplit`. Raise `ValueError` if scheme is not `"http"` or `"https"` or if `hostname` is missing.
- Lowercase the hostname.
- Keep a non-default port (`:8080`), but **drop** default ports (`:80` for `http`, `:443` for `https`).
- Strip trailing `"/"` from the path (so `"/logs/"` -> `"/logs"` and `"/"` -> `""`).
- Drop any `#fragment`, and keep `?query` if present (append `f"?{parts.query}"` only when non-empty).
- Return `f"{host_part}{path}{query_part}"` (without the scheme!).

```python
normalize_url("https://Ridge.Local:443/logs/day1/#top")  # "ridge.local/logs/day1"
normalize_url("http://ridge.local:8080/")                # "ridge.local:8080"
```

## Concept

Why drop the scheme (`http://` vs `https://`) and trailing slash when keying a crawler's `visited` table? Because sites routinely mix relative links, trailing slashes, and `http`/`https` redirects pointing at the same document. Normalizing every discovered URL to one canonical key prevents duplicate fetches and infinite redirect loops.

## Hints

1. `parts = urlsplit(url.strip())`, validate `parts.scheme.lower() in ("http", "https")` and `parts.hostname`.
2. `host = parts.hostname.lower()`. Append `f":{parts.port}"` only if `parts.port is not None` and not `(scheme == "http" and parts.port == 80)` and not `(scheme == "https" and parts.port == 443)`.
3. `path = parts.path.rstrip("/")` and `query = f"?{parts.query}" if parts.query else ""`.

## Starter: guided

```python
from urllib.parse import urlsplit


def normalize_url(url):
    parts = urlsplit(url.strip())
    scheme = parts.scheme.lower()
    if scheme not in ("http", "https") or not parts.hostname:
        raise ValueError(f"invalid HTTP URL: {url}")
    host = parts.hostname.lower()
    # TODO: include port unless it is default (80 for http, 443 for https)
    # TODO: strip trailing '/' from parts.path and append ?query if non-empty
    pass
```

## Starter: standard

```python
from urllib.parse import urlsplit


def normalize_url(url):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("strips scheme, default port 443, trailing slash, fragment", lambda: get("normalize_url")("https://Ridge.Local:443/logs/day1/#top"), "ridge.local/logs/day1")
expect("keeps non-default port and strips root slash", lambda: get("normalize_url")("http://ridge.local:8080/"), "ridge.local:8080")
expect("keeps query string", lambda: get("normalize_url")("http://ridge.local:80/search/?q=wind"), "ridge.local/search?q=wind")
```

## Hidden checks

```python
def rejects(bad):
    try:
        get("normalize_url")(bad)
        return False
    except ValueError:
        return True
check("rejects mailto URL", lambda: rejects("mailto:ranger@ridge.local"))
check("rejects relative path without host", lambda: rejects("/logs/day1"))
```

## Solution

```python
from urllib.parse import urlsplit


def normalize_url(url):
    parts = urlsplit(url.strip())
    scheme = parts.scheme.lower()
    if scheme not in ("http", "https") or not parts.hostname:
        raise ValueError(f"invalid HTTP URL: {url}")
    host = parts.hostname.lower()
    port = parts.port
    if port is not None and not (scheme == "http" and port == 80) and not (scheme == "https" and port == 443):
        host = f"{host}:{port}"
    path = parts.path.rstrip("/")
    query = f"?{parts.query}" if parts.query else ""
    return f"{host}{path}{query}"
```

## Restored

Every variant spelling of a station URL now maps to one clean canonical key.
