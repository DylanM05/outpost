---
id: hash-and-verify
title: Hash and verify
system: Gatehouse
symbol: controller
scene: tests
skills: auth
---

## Briefing

Build the gatehouse's password helper. Each stored password combines a freshly generated random salt and its stretched HMAC-SHA256 digest in a single string (`salt$digest`), and verification compares digests in constant time so timing differences can't leak secrets.

## Objective

Write two functions:

1. `hash_password(password)`:
   - Generates a fresh 16-byte random hex salt (`secrets.token_hex(16)`).
   - Computes an initial `digest = hmac.new(salt_bytes, password.encode("utf-8"), hashlib.sha256).digest()`, stretches it for `ROUNDS = 1000` rounds with `digest = hashlib.sha256(digest + salt_bytes).digest()`, and converts to `.hex()`.
   - Returns `f"{salt}${digest}"`.
2. `verify_password(password, stored)`:
   - Splits `stored` on `"$"` into `salt` and `expected_digest` (if `stored` is malformed — not exactly two non-empty parts — return `False`).
   - Recomputes the digest with the same salt and rounds.
   - Compares with `hmac.compare_digest(actual, expected_digest)` and returns the boolean result.

```python
stored = hash_password("kestrel-ridge")
verify_password("kestrel-ridge", stored)  # True
verify_password("wrong-pass", stored)     # False
```

## Concept

Why `secrets.token_hex(16)` instead of `random`? Python's `random` module is predictable (built for simulations, not security). `secrets` draws cryptographically strong randomness from the operating system.

Why `hmac.compare_digest(a, b)` instead of `a == b`? Plain `==` stops at the first mismatched character, leaking tiny timing clues over many requests. `hmac.compare_digest` always takes the same time regardless of where two strings differ.

*(In production servers, reach for Argon2id, `scrypt`, or `hashlib.pbkdf2_hmac` with high work factors; we use pure-stdlib iterated HMAC-SHA256 here so it works identically in the browser's WebAssembly Python without OpenSSL.)*

## Hints

1. Write a small helper `_derive(password, salt)` that computes `digest = hmac.new(salt_bytes, password.encode("utf-8"), hashlib.sha256).digest()` and loops `for _ in range(ROUNDS): digest = hashlib.sha256(digest + salt_bytes).digest()`, returning `digest.hex()`.
2. In `hash_password`: generate `salt = secrets.token_hex(16)` and return `f"{salt}${_derive(password, salt)}"`.
3. In `verify_password`: check `isinstance(stored, str)` and `"$" in stored`, split on `"$"` into two non-empty parts, call `_derive(password, salt)`, and compare with `hmac.compare_digest(actual, expected)`.

## Starter: guided

```python
import hashlib
import hmac
import secrets

ROUNDS = 1000


def _derive(password, salt):
    salt_bytes = salt.encode("utf-8")
    digest = hmac.new(salt_bytes, password.encode("utf-8"), hashlib.sha256).digest()
    for _ in range(ROUNDS):
        digest = hashlib.sha256(digest + salt_bytes).digest()
    return digest.hex()


def hash_password(password):
    salt = secrets.token_hex(16)
    # Return f"{salt}${digest}".
    return ""


def verify_password(password, stored):
    if not isinstance(stored, str) or "$" not in stored:
        return False
    parts = stored.split("$")
    if len(parts) != 2 or not parts[0] or not parts[1]:
        return False
    salt, expected = parts
    # Recompute digest and compare using hmac.compare_digest.
    return False
```

## Starter: standard

```python
import hashlib
import hmac
import secrets


def hash_password(password):
    return ""


def verify_password(password, stored):
    return False
```

## Starter: challenge

```python
```

## Checks

```python
check(
    "Uses hmac.compare_digest for constant-time comparison",
    lambda: uses("compare_digest"),
    "Use hmac.compare_digest(actual, expected) instead of ==.",
)
h1 = get("hash_password")("kestrel-ridge")
h2 = get("hash_password")("kestrel-ridge")
check("stored format is salt$digest and never contains plaintext", lambda: isinstance(h1, str) and "$" in h1 and "kestrel" not in h1)
check("two hashes of the same password use different random salts", lambda: h1 != h2, "Generate a fresh salt with secrets.token_hex(16) every time.")
expect("verify_password accepts matching password", lambda: get("verify_password")("kestrel-ridge", h1), True)
expect("verify_password accepts second salted hash too", lambda: get("verify_password")("kestrel-ridge", h2), True)
expect("verify_password rejects wrong password", lambda: get("verify_password")("other-pass", h1), False)
```

## Hidden checks

```python
expect("malformed stored string (no $) returns False", lambda: get("verify_password")("abc", "not-a-hash"), False)
expect("malformed stored string (extra $) returns False", lambda: get("verify_password")("abc", "a$b$c"), False)
expect("empty password works cleanly", lambda: get("verify_password")("", get("hash_password")("")), True)
expect("unicode password works cleanly", lambda: get("verify_password")("snø-ridge", get("hash_password")("snø-ridge")), True)
```

## Solution

```python
import hashlib
import hmac
import secrets

ROUNDS = 1000


def _derive(password, salt):
    salt_bytes = salt.encode("utf-8")
    digest = hmac.new(salt_bytes, password.encode("utf-8"), hashlib.sha256).digest()
    for _ in range(ROUNDS):
        digest = hashlib.sha256(digest + salt_bytes).digest()
    return digest.hex()


def hash_password(password):
    salt = secrets.token_hex(16)
    return f"{salt}${_derive(password, salt)}"


def verify_password(password, stored):
    if not isinstance(stored, str) or "$" not in stored:
        return False
    parts = stored.split("$")
    if len(parts) != 2 or not parts[0] or not parts[1]:
        return False
    salt, expected = parts
    return hmac.compare_digest(_derive(password, salt), expected)
```

## Restored

Passwords are now salted, stretched, and verified in constant time — never stored in plaintext anywhere on the ridge.
