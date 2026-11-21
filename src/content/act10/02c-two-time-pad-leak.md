---
id: two-time-pad-leak
kind: code
title: Break a reused pad (two-time pad)
system: Cipher wheel
symbol: equipment
scene: tests
skills: symmetric-crypto
---

## Briefing

A radio operator tried to save key tape by encrypting **two different dispatches** (`c1` and `c2`) with the **exact same one-time pad key**:

```text
c1 = p1 ^ key
c2 = p2 ^ key
```

Watch the secret key completely cancel itself out when an eavesdropper XORs the two ciphertexts together:

```text
c1 ^ c2 = (p1 ^ key) ^ (p2 ^ key) = p1 ^ p2
```

If an attacker knows (or guesses) the opening bytes of `p1` — say `"FROM: KESTREL "` — they instantly read the opening of `p2` without ever knowing a single byte of `key`!

## Objective

Write `recover_prefix(c1, c2, known_p1)` where `c1` and `c2` are `bytes` encrypted with the same keystream and `known_p1` is a `bytes` prefix of `p1` (with `len(known_p1) <= min(len(c1), len(c2))`). Return the recovered `bytes` prefix of `p2` of the same length as `known_p1` — without ever having the key!

## Concept

Because XOR is associative and `key ^ key == 0`:

```python
p2_prefix = bytes(a ^ b ^ p for a, b, p in zip(c1, c2, known_p1))
```

This is called a **many-time pad** (or **crib-dragging**) attack. It applies equally to one-time pads, ChaCha20, AES-CTR, and AES-GCM whenever a `(key, nonce)` pair is ever reused! Never, ever reuse a keystream.

## Hints

1. For each position `i` from `0` to `len(known_p1) - 1`: `c1[i] ^ c2[i] ^ known_p1[i]` equals `p2[i]`.
2. Double-check the algebra: `(p1 ^ k) ^ (p2 ^ k) ^ p1 == (p1 ^ p1) ^ (k ^ k) ^ p2 == p2`.

## Starter: guided

```python
def recover_prefix(c1, c2, known_p1):
    # TODO: XOR the first len(known_p1) bytes of c1, c2, and known_p1
    pass
```

## Starter: standard

```python
def recover_prefix(c1, c2, known_p1):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
key = b"\xa1\x3b\x7c\x90\x14\xfe\x55\x82\x09\x6d\x44\xc3\x11\x7a\x99\x20\xab\xcd\xef\x01"
p1 = b"FROM: KESTREL OK"
p2 = b"CODE: WINTER-42!"
c1 = bytes(a ^ k for a, k in zip(p1, key))
c2 = bytes(a ^ k for a, k in zip(p2, key))
expect("recovers prefix of p2 without knowing key", lambda: get("recover_prefix")(c1, c2, b"FROM: KESTREL "), b"CODE: WINTER-4")
```

## Hidden checks

```python
key = bytes((i * 37 + 11) % 256 for i in range(40))
p1 = b"STATION REPORT: ALL CLEAR"
p2 = b"SECRET TARGET: NORTH PASS"
c1 = bytes(a ^ k for a, k in zip(p1, key))
c2 = bytes(a ^ k for a, k in zip(p2, key))
expect("recovers full p2 when full p1 is known", lambda: get("recover_prefix")(c1, c2, p1), p2)
expect("works when c2 is longer than c1", lambda: get("recover_prefix")(c1[:10], c2, p1[:10]), p2[:10])
```

## Solution

```python
def recover_prefix(c1, c2, known_p1):
    return bytes(a ^ b ^ p for a, b, p in zip(c1, c2, known_p1))
```

## Restored

One reused keystrip exposed the second dispatch without touching the key — a lesson every stream cipher obeys for life.
