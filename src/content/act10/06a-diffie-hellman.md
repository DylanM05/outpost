---
id: diffie-hellman
kind: code
title: Diffie-Hellman key exchange
system: Key exchange
symbol: controller
scene: tests
skills: asymmetric-crypto
---

## Briefing

Kestrel Ridge and Valley Station need a shared symmetric key — **over an open radio channel that anyone can eavesdrop on!**

In 1976, Diffie and Hellman solved this with modular exponentiation: both stations publicly agree on a large prime `p` and generator `g`, each picks a private integer (`a` and `b`), and they exchange $A = g^a \bmod p$ and $B = g^b \bmod p$. Both arrive at the exact same shared secret $s = g^{ab} \bmod p$, while an eavesdropper who only sees $(p, g, A, B)$ faces the discrete logarithm problem.

## Objective

Write three functions:

1. `dh_public(g, private, p)` — returns $g^{\text{private}} \bmod p$ using Python's 3-argument `pow(g, private, p)`.
2. `dh_shared(other_public, private, p)` — returns $\text{other\_public}^{\text{private}} \bmod p$ using `pow(other_public, private, p)`.
3. `derive_session_key(shared_int)` — turns the positive shared integer into big-endian bytes (minimum length `(shared_int.bit_length() + 7) // 8` or `1` if `0`) and hashes it with `hashlib.sha256(...).digest()` to produce a uniform 32-byte symmetric key!

## Concept

**Never** compute `(g ** private) % p` with `**`! For a 256-bit exponent, `g ** private` has more digits than atoms in the observable universe and will hang Python immediately.

Python's built-in 3-argument `pow(base, exp, mod)` uses **modular exponentiation by squaring**, reducing modulo `p` at every step — taking only ~256 multiplications and finishing in microseconds!

And why hash the raw shared integer with SHA-256? Because raw Diffie-Hellman outputs are biased numbers modulo `p`, not uniform random bytes; hashing extracts a clean 256-bit key.

## Hints

1. `pow(g, private, p)` handles huge primes and exponents instantaneously.
2. Convert `shared_int` to bytes with `shared_int.to_bytes(max(1, (shared_int.bit_length() + 7) // 8), "big")`, then return `hashlib.sha256(...).digest()`.

## Starter: guided

```python
import hashlib


def dh_public(g, private, p):
    # TODO: modular exponentiation g^private mod p
    pass


def dh_shared(other_public, private, p):
    # TODO: modular exponentiation other_public^private mod p
    pass


def derive_session_key(shared_int):
    length = max(1, (shared_int.bit_length() + 7) // 8)
    raw = shared_int.to_bytes(length, "big")
    return hashlib.sha256(raw).digest()
```

## Starter: standard

```python
import hashlib


def dh_public(g, private, p):
    pass


def dh_shared(other_public, private, p):
    pass


def derive_session_key(shared_int):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
# Small readable example first
p, g = 23, 5
alice_pub = get("dh_public")(g, 6, p)
bob_pub = get("dh_public")(g, 15, p)
expect("small DH public values", lambda: (alice_pub, bob_pub), (8, 19))
expect("both sides compute identical shared secret", lambda: (get("dh_shared")(bob_pub, 6, p), get("dh_shared")(alice_pub, 15, p)), (2, 2))

# 256-bit prime (would hang forever if naive ** was used)
big_p = (1 << 255) - 19
a = 0x7A1C3F99112233445566778899AABBCCDDEEFF00112233445566778899AABBCC
b = 0x1F2E3D4C5B6A79887766554433221100FFEEDDCCBBAA99887766554433221101
A = get("dh_public")(5, a, big_p)
B = get("dh_public")(5, b, big_p)
sa = get("dh_shared")(B, a, big_p)
sb = get("dh_shared")(A, b, big_p)
check("256-bit DH matches instantaneously", lambda: sa == sb and sa > 0)
check("derive_session_key returns matching 32-byte keys", lambda: get("derive_session_key")(sa) == get("derive_session_key")(sb) and len(get("derive_session_key")(sa)) == 32)
```

## Hidden checks

```python
import hashlib
expect("derive_session_key(0) hashes single zero byte", lambda: get("derive_session_key")(0), hashlib.sha256(b"\x00").digest())
expect("derive_session_key(256) uses 2 big-endian bytes", lambda: get("derive_session_key")(256), hashlib.sha256(b"\x01\x00").digest())
```

## Solution

```python
import hashlib


def dh_public(g, private, p):
    return pow(g, private, p)


def dh_shared(other_public, private, p):
    return pow(other_public, private, p)


def derive_session_key(shared_int):
    length = max(1, (shared_int.bit_length() + 7) // 8)
    return hashlib.sha256(shared_int.to_bytes(length, "big")).digest()
```

## Restored

Both stations agreed on an identical 256-bit session key right over open airwaves, without ever transmitting the secret.
