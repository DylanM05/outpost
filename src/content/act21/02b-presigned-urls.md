---
id: presigned-urls
title: Issue and verify time-limited HMAC presigned URLs
system: Bucket rack
symbol: equipment
scene: tests
skills: object-storage
---

## Briefing

Rather than proxying gigabytes of video through your API server, backend apps issue **presigned URLs** — short-lived, HMAC-signed URLs bound to a specific HTTP method, object path, and expiration timestamp so clients upload or download directly from object storage.

## Concept

Given a `secret: str`:
- Canonical string to sign: `f"{method.upper()}\n{path}\n{expires}"` encoded as UTF-8.
- Signature: `hmac.new(secret.encode("utf-8"), canonical.encode("utf-8"), hashlib.sha256).hexdigest()`.
- **`presign_url(base_url, method, path, expires, secret)`:**
  - Strip any trailing `/` from `base_url` and ensure `path` starts with `/` (e.g. `"/media/clip.mp4"`).
  - Return `f"{base_url}{path}?expires={expires}&sig={sig}"` (using `expires` as an integer Unix timestamp).
- **`verify_presigned_url(url, method, now, secret)`:**
  - Parse `url` with `urllib.parse.urlsplit(url)` and `urllib.parse.parse_qs(parts.query)`.
  - Extract single `expires` and `sig` parameters; fail (`False`) if missing, malformed, or `now > expires` (strictly valid when `now <= expires`).
  - Recompute the expected HMAC using `(method.upper(), parts.path, expires)` and compare with `hmac.compare_digest(actual_sig, expected_sig)`!

## Objective

Implement `presign_url(base_url, method, path, expires, secret)` and `verify_presigned_url(url, method, now, secret)` returning `bool`.

## Hints

1. Always bind `method.upper()` into the canonical signed string so a `GET` download URL cannot be abused to `PUT` or `DELETE` the same object!
2. Use `hmac.compare_digest` (never `==`) to prevent timing side-channel leaks.

## Starter: guided

```python
import hashlib
import hmac
from urllib.parse import parse_qs, urlsplit


def _sign(method, path, expires, secret):
    msg = f"{method.upper()}\n{path}\n{expires}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()


def presign_url(base_url, method, path, expires, secret):
    base = base_url.rstrip("/")
    norm_path = path if path.startswith("/") else "/" + path
    sig = _sign(method, norm_path, int(expires), secret)
    return f"{base}{norm_path}?expires={int(expires)}&sig={sig}"


def verify_presigned_url(url, method, now, secret):
    # Parse path + query params, check expiry (now <= expires), and verify HMAC with compare_digest.
    pass
```

## Starter: standard

```python
import hashlib
import hmac
from urllib.parse import parse_qs, urlsplit


def presign_url(base_url, method, path, expires, secret):
    pass


def verify_presigned_url(url, method, now, secret):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _roundtrip():
    u = get("presign_url")("https://cdn.outpost.local/", "get", "clips/a.mp4", 2000, "top-secret")
    ok = get("verify_presigned_url")(u, "GET", 1500, "top-secret")
    expired = get("verify_presigned_url")(u, "GET", 2001, "top-secret")
    wrong_method = get("verify_presigned_url")(u, "PUT", 1500, "top-secret")
    tampered_path = get("verify_presigned_url")(u.replace("a.mp4", "b.mp4"), "GET", 1500, "top-secret")
    return (ok, expired, wrong_method, tampered_path)
expect("accepts valid URL and rejects expired, wrong-method, or path-tampered URLs", _roundtrip, (True, False, False, False))
```

## Hidden checks

```python
def _edge_cases():
    u = get("presign_url")("https://cdn.outpost.local", "PUT", "/uploads/1.bin", 1000, "s3cr3t")
    exact_edge = get("verify_presigned_url")(u, "PUT", 1000, "s3cr3t")
    wrong_secret = get("verify_presigned_url")(u, "PUT", 900, "other")
    no_query = get("verify_presigned_url")("https://cdn.outpost.local/uploads/1.bin", "PUT", 900, "s3cr3t")
    bad_exp = get("verify_presigned_url")("https://cdn.outpost.local/uploads/1.bin?expires=abc&sig=123", "PUT", 900, "s3cr3t")
    return (exact_edge, wrong_secret, no_query, bad_exp)
expect("handles exact expiry boundary, wrong secret, and malformed query strings", _edge_cases, (True, False, False, False))
```

## Solution

```python
import hashlib
import hmac
from urllib.parse import parse_qs, urlsplit


def _sign(method, path, expires, secret):
    msg = f"{method.upper()}\n{path}\n{expires}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()


def presign_url(base_url, method, path, expires, secret):
    base = base_url.rstrip("/")
    norm_path = path if path.startswith("/") else "/" + path
    exp = int(expires)
    sig = _sign(method, norm_path, exp, secret)
    return f"{base}{norm_path}?expires={exp}&sig={sig}"


def verify_presigned_url(url, method, now, secret):
    parts = urlsplit(url)
    qs = parse_qs(parts.query)
    if "expires" not in qs or "sig" not in qs:
        return False
    if len(qs["expires"]) != 1 or len(qs["sig"]) != 1:
        return False
    try:
        expires = int(qs["expires"][0])
    except ValueError:
        return False
    if now > expires:
        return False
    expected = _sign(method, parts.path, expires, secret)
    return hmac.compare_digest(qs["sig"][0], expected)
```

## Restored

The bucket rack now authorizes direct client transfers with method-bound, expiring HMAC URLs.
