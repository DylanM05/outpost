---
id: maintenance-strict-cors
title: Strict CORS origin allowlist
system: Shield wall
symbol: controller
scene: tests
skills: security
reviewSkill: security
prerequisite: rate-limiter
---

## Briefing

Overly permissive CORS code that checks `origin.endswith("ridge.local")` or reflects any `Origin` header lets `https://evil-ridge.local` read authenticated API responses! Build an exact-match CORS header helper.

## Objective

Write `cors_headers(origin, allowed_origins)`:

- If `origin` is an exact member of `allowed_origins`, return:
  ```python
  {
      "Access-Control-Allow-Origin": origin,
      "Vary": "Origin",
  }
  ```
- Otherwise (including when `origin` is `None`, `""`, or a lookalike domain like `"https://evil-ridge.local"`), return `{}`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `if origin and origin in set(allowed_origins):` — never use `endswith` or `in origin` substring checks!
2. Always include `"Vary": "Origin"` when reflecting an allowed origin so shared caches don't serve one origin's CORS header to another.

## Starter

```python
```

## Checks

```python
allowed = ["https://ridge.local", "https://valley.local"]
expect(
    "exact allowed origin returns reflected header and Vary: Origin",
    lambda: get("cors_headers")("https://ridge.local", allowed),
    {"Access-Control-Allow-Origin": "https://ridge.local", "Vary": "Origin"},
)
expect(
    "suffix lookalike domain is rejected",
    lambda: get("cors_headers")("https://evil-ridge.local", allowed),
    {},
)
expect(
    "http scheme mismatch is rejected",
    lambda: get("cors_headers")("http://ridge.local", allowed),
    {},
)
```

## Hidden checks

```python
expect("None origin returns {}", lambda: get("cors_headers")(None, ["https://ridge.local"]), {})
expect("trailing slash mismatch is rejected", lambda: get("cors_headers")("https://ridge.local/", ["https://ridge.local"]), {})
```

## Solution

```python
def cors_headers(origin, allowed_origins):
    if origin and origin in allowed_origins:
        return {
            "Access-Control-Allow-Origin": origin,
            "Vary": "Origin",
        }
    return {}
```

## Restored

Only exact allowlisted origins receive CORS permission, with `Vary: Origin` keeping caches honest.
