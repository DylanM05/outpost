---
id: key-derivation
kind: code
title: Derive keys from passphrases
system: Stream bench
symbol: controller
scene: tests
skills: symmetric-crypto
---

## Briefing

Human passphrases like `"winter-kestrel-9"` are neither uniform 32-byte keys nor slow to guess. A **Key Derivation Function (KDF)** mixes the passphrase with a random **salt** across many sequential rounds so each guess costs real CPU time and identical passphrases never share the same derived key.

## Objective

Write two functions:

1. `derive_key(passphrase, salt, rounds=2000)` — accepts `passphrase` (`str` or `bytes`), `salt` (`bytes`), and `rounds` (`int >= 1`, raise `ValueError` if `rounds < 1`). Compute:
   - `secret = passphrase.encode("utf-8")` if `str` else `passphrase`
   - `key = hmac.new(salt, secret, hashlib.sha256).digest()`
   - Repeat `rounds - 1` more times: `key = hmac.new(key, secret + salt, hashlib.sha256).digest()`
   - Return the final 32-byte `bytes` digest.
2. `verify_passphrase(passphrase, salt, expected_key, rounds=2000)` — derives the key with the same parameters and compares it against `expected_key` in constant time using `hmac.compare_digest`.

## Concept

Why not just run `sha256(passphrase)` once?
1. **No salt** means two stations with the same passphrase get the identical hash (vulnerable to precomputed rainbow tables).
2. **Too fast** means a single GPU can test billions of SHA-256 guesses per second! Iterating thousands of dependent rounds (as PBKDF2, scrypt, and Argon2 do) forces an attacker to pay the full work factor for every guess.

## Hints

1. Validate `if rounds < 1: raise ValueError("rounds must be at least 1")`.
2. Start with `key = hmac.new(salt, secret, hashlib.sha256).digest()`, then loop `for _ in range(rounds - 1): key = hmac.new(key, secret + salt, hashlib.sha256).digest()`.
3. In `verify_passphrase`, make sure `isinstance(expected_key, bytes)` before calling `hmac.compare_digest`.

## Starter: guided

```python
import hashlib
import hmac


def derive_key(passphrase, salt, rounds=2000):
    if rounds < 1:
        raise ValueError("rounds must be >= 1")
    secret = passphrase.encode("utf-8") if isinstance(passphrase, str) else passphrase
    key = hmac.new(salt, secret, hashlib.sha256).digest()
    # TODO: iterate rounds - 1 more times mixing key with secret + salt
    return key


def verify_passphrase(passphrase, salt, expected_key, rounds=2000):
    # TODO: derive and compare with hmac.compare_digest
    pass
```

## Starter: standard

```python
import hashlib
import hmac


def derive_key(passphrase, salt, rounds=2000):
    pass


def verify_passphrase(passphrase, salt, expected_key, rounds=2000):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
k1 = get("derive_key")("winter-ridge", b"salt-001", rounds=50)
k2 = get("derive_key")("winter-ridge", b"salt-002", rounds=50)
check("returns 32-byte digest", lambda: isinstance(k1, bytes) and len(k1) == 32)
check("different salts yield different keys", lambda: k1 != k2)
expect("verify_passphrase succeeds on match", lambda: get("verify_passphrase")("winter-ridge", b"salt-001", k1, rounds=50), True)
expect("verify_passphrase rejects wrong passphrase", lambda: get("verify_passphrase")("summer-ridge", b"salt-001", k1, rounds=50), False)
```

## Hidden checks

```python
import hashlib, hmac
s = b"abc"
salt = b"xyz"
expected = hmac.new(salt, s, hashlib.sha256).digest()
for _ in range(4):
    expected = hmac.new(expected, s + salt, hashlib.sha256).digest()
expect("matches exact iterated HMAC construction", lambda: get("derive_key")("abc", salt, rounds=5), expected)
def bad_rounds():
    try:
        get("derive_key")("abc", salt, rounds=0)
        return False
    except ValueError:
        return True
check("rounds < 1 raises ValueError", bad_rounds)
```

## Solution

```python
import hashlib
import hmac


def derive_key(passphrase, salt, rounds=2000):
    if rounds < 1:
        raise ValueError("rounds must be at least 1")
    secret = passphrase.encode("utf-8") if isinstance(passphrase, str) else passphrase
    key = hmac.new(salt, secret, hashlib.sha256).digest()
    for _ in range(rounds - 1):
        key = hmac.new(key, secret + salt, hashlib.sha256).digest()
    return key


def verify_passphrase(passphrase, salt, expected_key, rounds=2000):
    if not isinstance(expected_key, bytes):
        return False
    candidate = derive_key(passphrase, salt, rounds=rounds)
    return hmac.compare_digest(candidate, expected_key)
```

## Restored

Station passphrases now stretch through unique salts and iterated rounds into clean 256-bit keys.
