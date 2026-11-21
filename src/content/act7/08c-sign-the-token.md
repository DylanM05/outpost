---
id: sign-the-token
title: Sign the token
system: Gatehouse
symbol: controller
scene: tests
skills: auth, http
---

## Briefing

Once an operator logs in with their password, they shouldn't send their password on every subsequent API request. Instead, the gatehouse issues a **signed token** (the exact idea behind **JWTs** — JSON Web Tokens): a base64url-encoded JSON payload paired with an **HMAC-SHA256** signature made with the server's secret key. Anyone can read the payload, nobody can forge or alter it without the secret, and every token carries an expiration time (`exp`).

## Objective

Write two functions:

1. `make_token(claims, secret, ttl_seconds, now)`:
   - Copies `claims` (a dict, e.g. `{"sub": "mara", "role": "operator"}`) without mutating it, and sets `"exp": now + ttl_seconds`.
   - Encodes the JSON payload (`json.dumps(..., sort_keys=True, separators=(",", ":")).encode("utf-8")`) using URL-safe base64 without trailing `=` padding (`base64.urlsafe_b64encode(...).decode("ascii").rstrip("=")`).
   - Signs that encoded payload string with `hmac.new(secret.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256).hexdigest()`.
   - Returns `f"{payload_b64}.{signature}"`.
2. `verify_token(token, secret, now)`:
   - Splits `token` on `"."` into exactly two parts: `payload_b64` and `sig`.
   - Recomputes the expected HMAC-SHA256 hex digest with `secret` and checks it with `hmac.compare_digest`.
   - Decodes `payload_b64` (restoring any missing `=` padding for `base64.urlsafe_b64decode`) and parses the JSON dict.
   - Checks that `claims["exp"] > now` (a token with `exp <= now` is expired!).
   - Returns the decoded `claims` dict if valid, or `None` if malformed, tampered, wrong secret, or expired.

```python
tok = make_token({"sub": "mara", "role": "operator"}, "ridge-secret", 3600, now=1000)
verify_token(tok, "ridge-secret", now=2000)  # {"sub": "mara", "role": "operator", "exp": 4600}
verify_token(tok, "ridge-secret", now=5000)  # None (expired!)
```

## Concept

A signed token is **tamper-evident**, not encrypted:

```text
<base64url(json_payload)>.<hmac_sha256(secret, base64url(json_payload))>
```

- Because the server checks the HMAC signature first with its private `secret`, flipping `"role": "operator"` to `"role": "admin"` invalidates the signature immediately.
- Because the payload is base64 (encoding, **not** encryption), never put passwords or secrets inside token claims!
- Because the server doesn't need a database lookup to verify the signature, signed tokens are **stateless** — fast and easy to share across services.

## Hints

1. To decode unpadded base64url: add `"=" * (-len(s) % 4)` before calling `base64.urlsafe_b64decode(padded)`.
2. Always check the HMAC signature with `hmac.compare_digest` *before* trusting the decoded JSON.
3. Wrap splitting, decoding, and JSON parsing in `try/except Exception:` returning `None` so garbage tokens never crash the server.

## Starter: guided

```python
import base64
import hashlib
import hmac
import json


def _sign(payload_b64, secret):
    return hmac.new(
        secret.encode("utf-8"),
        payload_b64.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()


def make_token(claims, secret, ttl_seconds, now):
    body = dict(claims)
    body["exp"] = now + ttl_seconds
    raw = json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
    # Return f"{payload_b64}.{signature}".
    return ""


def verify_token(token, secret, now):
    # Split on ".", verify signature with hmac.compare_digest, decode JSON, check exp > now.
    return None
```

## Starter: standard

```python
import base64
import hashlib
import hmac
import json


def make_token(claims, secret, ttl_seconds, now):
    return ""


def verify_token(token, secret, now):
    return None
```

## Starter: challenge

```python
```

## Checks

```python
check("Uses hmac.compare_digest", lambda: uses("compare_digest"), "Verify signatures with hmac.compare_digest.")
original = {"sub": "mara", "role": "operator"}
tok = get("make_token")(original, "ridge-secret", 3600, now=1000)
expect("does not mutate input claims", lambda: original, {"sub": "mara", "role": "operator"})
expect("valid token verifies before expiry", lambda: get("verify_token")(tok, "ridge-secret", now=2000), {"sub": "mara", "role": "operator", "exp": 4600})
expect("wrong secret returns None", lambda: get("verify_token")(tok, "wrong-secret", now=2000), None)
expect("expired token returns None", lambda: get("verify_token")(tok, "ridge-secret", now=4600), None, "A token is expired when exp <= now.")
```

## Hidden checks

```python
import base64 as _b64, json as _json

# Tamper with the payload while keeping the original signature!
p_b64, sig = tok.split(".")
forged = _b64.urlsafe_b64encode(_json.dumps({"sub": "mara", "role": "admin", "exp": 99999}, sort_keys=True, separators=(",", ":")).encode()).decode().rstrip("=")
expect("tampered payload with old signature rejected", lambda: get("verify_token")(f"{forged}.{sig}", "ridge-secret", now=2000), None)
expect("garbage token returns None without crashing", lambda: get("verify_token")("not-a-token", "ridge-secret", now=2000), None)
expect("token valid at exp - 1", lambda: get("verify_token")(tok, "ridge-secret", now=4599)["sub"], "mara")
```

## Solution

```python
import base64
import hashlib
import hmac
import json


def _sign(payload_b64, secret):
    return hmac.new(
        secret.encode("utf-8"),
        payload_b64.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()


def make_token(claims, secret, ttl_seconds, now):
    body = dict(claims)
    body["exp"] = now + ttl_seconds
    raw = json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
    return f"{payload_b64}.{_sign(payload_b64, secret)}"


def verify_token(token, secret, now):
    if not isinstance(token, str) or token.count(".") != 1:
        return None
    payload_b64, sig = token.split(".")
    expected = _sign(payload_b64, secret)
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        claims = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
    except Exception:
        return None
    if not isinstance(claims, dict) or claims.get("exp", 0) <= now:
        return None
    return claims
```

## Restored

The gatehouse mints and verifies tamper-evident signed tokens with expiration — stateless authentication ready for the API.
