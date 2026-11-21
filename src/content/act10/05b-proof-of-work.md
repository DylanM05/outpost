---
id: proof-of-work
kind: code
title: Hashcash proof of work
system: Hash vault
symbol: instrument
scene: tests
skills: asymmetric-crypto
---

## Briefing

Because a cryptographic hash is unpredictable, the only way to find an input whose SHA-256 digest starts with `k` leading hex zeros is brute-force trial and error — which takes roughly $16^k$ attempts on average, while anyone else can verify your answer in **one** single hash!

## Objective

Write two functions:

1. `find_nonce(prefix, zero_hex_digits)` — starting at `nonce = 0`, find and return the smallest non-negative integer `nonce` such that `hashlib.sha256(f"{prefix}:{nonce}".encode("utf-8")).hexdigest()` starts with `"0" * zero_hex_digits`.
2. `verify_nonce(prefix, nonce, zero_hex_digits)` — returns `True` iff `nonce` is a non-negative `int` (not `bool`) and `sha256(f"{prefix}:{nonce}")` starts with `"0" * zero_hex_digits`.

```python
n = find_nonce("kestrel", 2)
verify_nonce("kestrel", n, 2)  # True
```

## Concept

This asymmetry — **hard to find, instant to verify** — powers Hashcash anti-spam stamps and blockchain proof-of-work. Each additional hex zero multiplies the average work by **16×** (`4` bits per hex digit), so difficulty scales exponentially with `zero_hex_digits`.

## Hints

1. Build `target = "0" * zero_hex_digits` once before the loop.
2. Increment `nonce = 0, 1, 2, ...` until `hashlib.sha256(f"{prefix}:{nonce}".encode("utf-8")).hexdigest().startswith(target)` is `True`.

## Starter: guided

```python
import hashlib


def find_nonce(prefix, zero_hex_digits):
    target = "0" * zero_hex_digits
    nonce = 0
    while True:
        # TODO: hash f"{prefix}:{nonce}" and return nonce once digest starts with target
        nonce += 1
        break


def verify_nonce(prefix, nonce, zero_hex_digits):
    if isinstance(nonce, bool) or not isinstance(nonce, int) or nonce < 0:
        return False
    # TODO: compute one SHA-256 hash and check startswith("0" * zero_hex_digits)
    pass
```

## Starter: standard

```python
import hashlib


def find_nonce(prefix, zero_hex_digits):
    pass


def verify_nonce(prefix, nonce, zero_hex_digits):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
import hashlib
n2 = get("find_nonce")("kestrel", 2)
check("find_nonce('kestrel', 2) finds a valid minimal nonce", lambda: isinstance(n2, int) and n2 >= 0 and hashlib.sha256(f"kestrel:{n2}".encode()).hexdigest().startswith("00"))
check("no smaller nonce works for ('kestrel', 2)", lambda: all(not hashlib.sha256(f"kestrel:{k}".encode()).hexdigest().startswith("00") for k in range(n2)))
expect("verify_nonce accepts found nonce", lambda: get("verify_nonce")("kestrel", n2, 2), True)
expect("verify_nonce rejects wrong prefix", lambda: get("verify_nonce")("valley", n2, 2), False)
```

## Hidden checks

```python
n3 = get("find_nonce")("ridge-beacon", 3)
expect("3 leading zeros verifies cleanly", lambda: get("verify_nonce")("ridge-beacon", n3, 3), True)
expect("0 leading zeros immediately returns 0", lambda: get("find_nonce")("any", 0), 0)
expect("verify_nonce rejects negative nonce", lambda: get("verify_nonce")("any", -1, 0), False)
```

## Solution

```python
import hashlib


def find_nonce(prefix, zero_hex_digits):
    target = "0" * zero_hex_digits
    nonce = 0
    while True:
        digest = hashlib.sha256(f"{prefix}:{nonce}".encode("utf-8")).hexdigest()
        if digest.startswith(target):
            return nonce
        nonce += 1


def verify_nonce(prefix, nonce, zero_hex_digits):
    if isinstance(nonce, bool) or not isinstance(nonce, int) or nonce < 0:
        return False
    digest = hashlib.sha256(f"{prefix}:{nonce}".encode("utf-8")).hexdigest()
    return digest.startswith("0" * zero_hex_digits)
```

## Restored

One hash checks the stamp in microseconds, while finding each extra leading zero multiplies the work sixteenfold.
