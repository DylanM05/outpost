---
id: maintenance-fix-presign-expiry
title: Fix a presigned-token check that accepts expired URLs
system: Bucket rack
symbol: equipment
scene: tests
skills: object-storage
reviewSkill: object-storage
prerequisite: presigned-urls
---

## Briefing

A signed download gate is accidentally allowing expired links while rejecting valid ones because its expiration check is inverted!

## Objective

Fix `verify_token(path, expires, sig, now, secret)` so it returns `True` iff `now <= expires` AND `sig` matches `hmac.new(secret.encode(), f"{path}\n{expires}".encode(), hashlib.sha256).hexdigest()` using `hmac.compare_digest`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `if now > expires: return False` (not `if now < expires:`)!

## Starter

```python
import hashlib
import hmac


def verify_token(path, expires, sig, now, secret):
    if now < expires:
        return False
    expected = hmac.new(secret.encode(), f"{path}\n{expires}".encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(sig, expected)
```

## Checks

```python
import hashlib, hmac as _hmac
_SIG = _hmac.new(b"sec", b"/a.mp4\n1000", hashlib.sha256).hexdigest()
expect("accepts valid non-expired token", lambda: get("verify_token")("/a.mp4", 1000, _SIG, 900, "sec"), True)
expect("rejects expired token", lambda: get("verify_token")("/a.mp4", 1000, _SIG, 1001, "sec"), False)
```

## Hidden checks

```python
import hashlib, hmac as _hmac
_SIG2 = _hmac.new(b"sec", b"/a.mp4\n1000", hashlib.sha256).hexdigest()
expect("accepts exact expiry timestamp", lambda: get("verify_token")("/a.mp4", 1000, _SIG2, 1000, "sec"), True)
expect("rejects wrong signature", lambda: get("verify_token")("/a.mp4", 1000, "bad", 900, "sec"), False)
```

## Solution

```python
import hashlib
import hmac


def verify_token(path, expires, sig, now, secret):
    if now > expires:
        return False
    expected = hmac.new(secret.encode(), f"{path}\n{expires}".encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(sig, expected)
```

## Restored

Presigned link verification now rejects expired downloads while honoring valid windows.
