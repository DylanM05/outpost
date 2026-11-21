---
id: maintenance-hmac-sign-verify
title: Sign and verify a webhook
system: Gatehouse
symbol: controller
scene: tests
skills: auth
reviewSkill: auth
prerequisite: who-may-change-it
---

## Briefing

Partner settlements sign every webhook payload with a shared secret using HMAC-SHA256. Implement both signing and constant-time signature verification.

## Objective

Write two functions:

1. `sign_payload(secret, payload)` — returns the lowercase hex HMAC-SHA256 digest of `payload` (UTF-8) keyed by `secret` (UTF-8).
2. `verify_payload(secret, payload, signature)` — returns `True` iff `signature` matches the expected HMAC-SHA256 hex digest using constant-time comparison (`hmac.compare_digest`), and `False` otherwise (including when `signature` is not a string).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. `hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()`.
2. Always compare digests with `hmac.compare_digest(expected, signature)` instead of `==`.

## Starter

```python
```

## Checks

```python
sig = get("sign_payload")("ridge-secret", '{"event":"dispatch"}')
check("signature is 64-char lowercase hex", lambda: isinstance(sig, str) and len(sig) == 64 and sig == sig.lower())
expect("valid signature verifies True", lambda: get("verify_payload")("ridge-secret", '{"event":"dispatch"}', sig), True)
expect("tampered payload verifies False", lambda: get("verify_payload")("ridge-secret", '{"event":"cancel"}', sig), False)
```

## Hidden checks

```python
sig = get("sign_payload")("secret-a", "hello")
expect("wrong secret verifies False", lambda: get("verify_payload")("secret-b", "hello", sig), False)
expect("None signature verifies False", lambda: get("verify_payload")("secret-a", "hello", None), False)
```

## Solution

```python
import hashlib
import hmac


def sign_payload(secret, payload):
    return hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()


def verify_payload(secret, payload, signature):
    if not isinstance(signature, str):
        return False
    expected = sign_payload(secret, payload)
    return hmac.compare_digest(expected, signature)
```

## Restored

Every incoming webhook is checked in constant time, rejecting tampered payloads and wrong secrets outright.
