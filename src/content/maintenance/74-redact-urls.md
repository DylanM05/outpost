---
id: maintenance-redact-urls
title: Redact credentials in DSN URLs
system: Control panel
symbol: instrument
scene: tests
skills: config
reviewSkill: config
prerequisite: scrub-the-secrets
---

## Briefing

Startup logs print the database connection URL (`postgres://ranger:s3cr3t@db.local:5432/outpost`) so operators can see which host is wired up — which accidentally leaks the password! Scrub the password before logging.

## Objective

Write `redact_dsn(dsn)` that replaces the password portion of any URL containing `scheme://user:password@host...` with `***`, keeping the scheme, username, host, port, path, and query intact. Leave URLs without a password unchanged.

```python
redact_dsn("postgres://ranger:s3cr3t@db.local:5432/outpost")
# "postgres://ranger:***@db.local:5432/outpost"
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `urllib.parse.urlsplit(dsn)` and check `parts.password is not None`.
2. Rebuild `netloc` as `f"{parts.username}:***@{parts.hostname}"` (plus `f":{parts.port}"` if `parts.port is not None`), then `urllib.parse.urlunsplit(...)`.

## Starter

```python
```

## Checks

```python
expect(
    "redacts password with port and path",
    lambda: get("redact_dsn")("postgres://ranger:s3cr3t@db.local:5432/outpost?sslmode=require"),
    "postgres://ranger:***@db.local:5432/outpost?sslmode=require",
)
expect(
    "leaves passwordless URL unchanged",
    lambda: get("redact_dsn")("sqlite:///var/lib/outpost.db"),
    "sqlite:///var/lib/outpost.db",
)
```

## Hidden checks

```python
expect(
    "redacts password without port",
    lambda: get("redact_dsn")("redis://ops:topsecret@cache.internal/0"),
    "redis://ops:***@cache.internal/0",
)
expect(
    "leaves user-only URL unchanged",
    lambda: get("redact_dsn")("https://ranger@archive.local/repo"),
    "https://ranger@archive.local/repo",
)
```

## Solution

```python
from urllib.parse import urlsplit, urlunsplit


def redact_dsn(dsn):
    parts = urlsplit(dsn)
    if parts.password is None:
        return dsn
    host = parts.hostname or ""
    if parts.port is not None:
        host = f"{host}:{parts.port}"
    user = parts.username or ""
    netloc = f"{user}:***@{host}"
    return urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))
```

## Restored

Startup logs still show the exact target host and database without ever printing a live password.
