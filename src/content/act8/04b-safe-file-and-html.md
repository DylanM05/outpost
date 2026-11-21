---
id: safe-file-and-html
title: Safe file and html
system: Shield wall
symbol: controller
scene: tests
skills: security, strings
---

## Briefing

Put three core OWASP defenses on the shield wall: a path-traversal guard for file downloads, HTML escaping to block Cross-Site Scripting (XSS) when rendering user text, and HTTP security + CORS headers that only allow trusted origins.

## Objective

Write three functions:

1. `safe_join(root, user_path)`:
   - Rejects empty `user_path` or any path starting with `"/"` or `"\\"` or containing null bytes (`"\x00"`), raising `ValueError`.
   - Normalizes `root` (`base = os.path.normpath(root)`) and `target = os.path.normpath(os.path.join(base, user_path))`.
   - Raises `ValueError("path escapes root")` unless `target.startswith(base + "/")` (so `target` is strictly *inside* `root`, not `root` itself and not a sibling like `/srv/exports-2`).
   - Returns `target`.
2. `escape_html(text)`: returns `text` with `&`, `<`, `>`, `"`, and `'` escaped to `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#x27;` (just like `html.escape(text, quote=True)`).
3. `apply_security_headers(headers, origin=None, allowed_origins=())`:
   - Returns a **new** dict copying `headers` and setting:
     - `"X-Content-Type-Options": "nosniff"`
     - `"X-Frame-Options": "DENY"`
     - `"Strict-Transport-Security": "max-age=31536000; includeSubDomains"`
   - If `origin` is provided and `origin in allowed_origins`, also set `"Access-Control-Allow-Origin": origin` and `"Vary": "Origin"`. Never set `Access-Control-Allow-Origin` for unknown origins!

```python
safe_join("/srv/exports", "2026/nov.csv")           # "/srv/exports/2026/nov.csv"
escape_html('<script>alert("x")</script>')          # "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
```

## Concept

Each helper defends against a specific class of web attack:

- **Path traversal (`safe_join`)**: guarantees downloads stay inside `/srv/exports/`.
- **XSS (`escape_html`)**: turns `<script>` in user-supplied station notes into harmless displayed text instead of executable browser JavaScript.
- **Security headers & CORS**: `nosniff` stops browsers from guessing HTML out of plain text, `DENY` blocks clickjacking iframes, HSTS enforces HTTPS, and an explicit origin allowlist prevents arbitrary websites from reading authenticated API responses.

## Hints

1. In `safe_join`, check `if not user_path or user_path.startswith(("/", "\\")) or "\x00" in user_path: raise ValueError(...)`, then check `target.startswith(base + "/")` (handle `base == "/"` safely if needed).
2. Python's standard library has `import html; html.escape(text, quote=True)`.
3. In `apply_security_headers`, copy `out = dict(headers)` so you don't mutate the caller's dict.

## Starter: guided

```python
import html
import os


def safe_join(root, user_path):
    if not user_path or user_path.startswith(("/", "\\")) or "\x00" in user_path:
        raise ValueError("invalid path")
    base = os.path.normpath(root)
    target = os.path.normpath(os.path.join(base, user_path))
    # Verify target stays strictly inside base + "/", else raise ValueError.
    return target


def escape_html(text):
    return ""


def apply_security_headers(headers, origin=None, allowed_origins=()):
    out = dict(headers)
    # Add X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, and safe CORS.
    return out
```

## Starter: standard

```python
import html
import os


def safe_join(root, user_path):
    return ""


def escape_html(text):
    return ""


def apply_security_headers(headers, origin=None, allowed_origins=()):
    return {}
```

## Starter: challenge

```python
```

## Checks

```python
expect("safe_join allows nested relative file", lambda: get("safe_join")("/srv/exports", "2026/nov.csv"), "/srv/exports/2026/nov.csv")

def _raises(fn):
    try:
        fn()
        return False
    except ValueError:
        return True

check("safe_join blocks .. traversal", lambda: _raises(lambda: get("safe_join")("/srv/exports", "../../etc/passwd")))
check("safe_join blocks absolute path", lambda: _raises(lambda: get("safe_join")("/srv/exports", "/etc/passwd")))
check("safe_join blocks sibling prefix escape", lambda: _raises(lambda: get("safe_join")("/srv/exports", "../exports-secret/a.csv")))
expect("escape_html neutralizes script tag", lambda: get("escape_html")('<script>alert("x")</script>'), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;")

h = get("apply_security_headers")({"Content-Type": "application/json"}, origin="https://ridge.local", allowed_origins=["https://ridge.local"])
expect(
    "adds security headers and allowed CORS origin",
    lambda: (h.get("X-Content-Type-Options"), h.get("X-Frame-Options"), h.get("Access-Control-Allow-Origin"), h.get("Vary")),
    ("nosniff", "DENY", "https://ridge.local", "Origin"),
)
```

## Hidden checks

```python
check("safe_join blocks '.' (root itself)", lambda: _raises(lambda: get("safe_join")("/srv/exports", ".")))
check("safe_join blocks null byte", lambda: _raises(lambda: get("safe_join")("/srv/exports", "a.csv\x00.txt")))
expect("escape_html escapes ampersand and single quote", lambda: get("escape_html")("A & 'B'"), "A &amp; &#x27;B&#x27;")

orig_h = {"Content-Type": "application/json"}
untrusted = get("apply_security_headers")(orig_h, origin="https://evil.example", allowed_origins=["https://ridge.local"])
expect("untrusted origin does not get Access-Control-Allow-Origin", lambda: "Access-Control-Allow-Origin" in untrusted, False)
expect("does not mutate input headers", lambda: orig_h, {"Content-Type": "application/json"})
expect("sets HSTS header", lambda: untrusted.get("Strict-Transport-Security"), "max-age=31536000; includeSubDomains")
```

## Solution

```python
import html
import os


def safe_join(root, user_path):
    if not isinstance(user_path, str) or not user_path or user_path.startswith(("/", "\\")) or "\x00" in user_path:
        raise ValueError("invalid path")
    base = os.path.normpath(root)
    target = os.path.normpath(os.path.join(base, user_path))
    prefix = base if base.endswith("/") else base + "/"
    if not target.startswith(prefix):
        raise ValueError("path escapes root")
    return target


def escape_html(text):
    return html.escape(text, quote=True)


def apply_security_headers(headers, origin=None, allowed_origins=()):
    out = dict(headers)
    out["X-Content-Type-Options"] = "nosniff"
    out["X-Frame-Options"] = "DENY"
    out["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    if origin and origin in allowed_origins:
        out["Access-Control-Allow-Origin"] = origin
        out["Vary"] = "Origin"
    return out
```

## Restored

Path traversal, XSS payloads, and untrusted cross-origin requests are blocked cleanly at the shield wall.
