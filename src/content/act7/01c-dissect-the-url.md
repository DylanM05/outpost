---
id: dissect-the-url
title: Dissect the url
system: Packet wire
symbol: instrument
scene: tests
skills: http, strings
---

## Briefing

Every HTTP request starts with a **URL** that names the protocol (`http` or `https`), host, port, path, and optional query parameters (`?category=fuel&page=2`). Splitting URLs by hand with `.split("/")` breaks as soon as a query value contains a space, `&`, or `/`. Use Python's `urllib.parse` to take URLs apart and assemble them safely.

## Objective

Write two functions:

1. `inspect_url(url)`: returns a dictionary with:
   - `"scheme"`: protocol (e.g. `"https"`)
   - `"host"`: hostname (lowercase, without port)
   - `"port"`: integer port if explicitly present in `url`, otherwise default `443` for `"https"` and `80` for `"http"` (or `None` for other schemes)
   - `"path"`: path string (default `"/"` if empty)
   - `"params"`: dictionary mapping each query key to its **first** decoded value (`str`)
2. `build_url(base, path, params=None)`: joins `base` (such as `"https://valley.local:8443"`) and `path` (ensuring a single `/` between them) and appends URL-encoded query parameters sorted by key when `params` is non-empty (skipping any key whose value is `None`).

```python
inspect_url("https://valley.local:8443/api/items?category=cold+gear&page=2")
# {
#   "scheme": "https",
#   "host": "valley.local",
#   "port": 8443,
#   "path": "/api/items",
#   "params": {"category": "cold gear", "page": "2"},
# }

build_url("https://valley.local/", "api/items", {"page": 2, "q": "ice axe", "unused": None})
# "https://valley.local/api/items?page=2&q=ice+axe"
```

## Concept

A URL has well-defined parts:

```text
https://valley.local:8443/api/items?category=fuel&page=2
\___/   \__________/ \__/\________/ \__________________/
scheme      host     port   path           query
```

`urllib.parse` handles every edge case (percent-encoding, `+` spaces, missing ports):

- `parsed = urlparse(url)` gives `.scheme`, `.hostname`, `.port`, `.path`, and `.query`.
- `parse_qs(parsed.query)` returns `{key: [values...]}` (decoded!), because a query string can repeat a key.
- `urlencode(pairs)` encodes spaces and special characters safely into a query string.

## Hints

1. Use `from urllib.parse import urlparse, parse_qs, urlencode`.
2. In `inspect_url(url)`: `p = urlparse(url)`. `port = p.port` — if `port is None`, use `443` for `"https"` and `80` for `"http"`. `params = {k: vals[0] for k, vals in parse_qs(p.query).items()}`.
3. In `build_url(base, path, params=None)`: strip trailing `/` from `base` and leading `/` from `path`, join as `f"{base.rstrip('/')}/{path.lstrip('/')}"`. Filter `params` to `v is not None`, sort by key, and append `?{urlencode(...)}` if any remain.

## Starter: guided

```python
from urllib.parse import parse_qs, urlencode, urlparse


def inspect_url(url):
    p = urlparse(url)
    # Determine default port, path (fallback "/"), and decoded params dict.
    return {
        "scheme": p.scheme,
        "host": p.hostname,
        "port": p.port,
        "path": p.path,
        "params": {},
    }


def build_url(base, path, params=None):
    # Join base and path cleanly, then append sorted encoded params (skipping None values).
    return base
```

## Starter: standard

```python
from urllib.parse import parse_qs, urlencode, urlparse


def inspect_url(url):
    return {}


def build_url(base, path, params=None):
    return ""
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "inspect_url with explicit port and encoded query",
    lambda: get("inspect_url")("https://valley.local:8443/api/items?category=cold+gear&page=2"),
    {
        "scheme": "https",
        "host": "valley.local",
        "port": 8443,
        "path": "/api/items",
        "params": {"category": "cold gear", "page": "2"},
    },
)
expect(
    "inspect_url fills default HTTPS port 443 and root path /",
    lambda: get("inspect_url")("https://ridge.local"),
    {"scheme": "https", "host": "ridge.local", "port": 443, "path": "/", "params": {}},
)
expect(
    "build_url encodes params sorted by key and skips None",
    lambda: get("build_url")("https://valley.local/", "/api/items", {"q": "ice axe", "page": 2, "tag": None}),
    "https://valley.local/api/items?page=2&q=ice+axe",
)
```

## Hidden checks

```python
expect(
    "inspect_url fills default HTTP port 80 and decodes %2F",
    lambda: get("inspect_url")("http://Relay.Local/log?file=a%2Fb"),
    {"scheme": "http", "host": "relay.local", "port": 80, "path": "/log", "params": {"file": "a/b"}},
)
expect(
    "build_url without params has no trailing ?",
    lambda: get("build_url")("http://valley.local", "health"),
    "http://valley.local/health",
)
expect(
    "build_url when all params are None has no trailing ?",
    lambda: get("build_url")("http://valley.local/", "/health", {"a": None}),
    "http://valley.local/health",
)
```

## Solution

```python
from urllib.parse import parse_qs, urlencode, urlparse


def inspect_url(url):
    p = urlparse(url)
    port = p.port
    if port is None:
        if p.scheme == "https":
            port = 443
        elif p.scheme == "http":
            port = 80
    path = p.path or "/"
    params = {k: vals[0] for k, vals in parse_qs(p.query).items()}
    return {
        "scheme": p.scheme,
        "host": p.hostname,
        "port": port,
        "path": path,
        "params": params,
    }


def build_url(base, path, params=None):
    full = f"{base.rstrip('/')}/{path.lstrip('/')}"
    if params:
        clean = sorted((k, v) for k, v in params.items() if v is not None)
        if clean:
            full = f"{full}?{urlencode(clean)}"
    return full
```

## Restored

Every endpoint address is parsed and encoded cleanly — spaces, slashes, and default ports included.
