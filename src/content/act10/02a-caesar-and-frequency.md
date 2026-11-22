---
id: caesar-and-frequency
kind: code
title: Break a tiny keyspace
system: Cipher wheel
symbol: equipment
scene: tests
skills: symmetric-crypto
---

## Briefing

An old ridge logbook was "encrypted" with a Caesar cipher — shifting every letter forward by a secret number from `0` to `25`. Because there are only **26 possible keys**, anyone who knows a single common word in the plaintext can break it instantly by brute force.

## Objective

Write two functions:

1. `caesar_shift(text, shift)` — shifts ASCII letters `A`–`Z` and `a`–`z` forward by `shift` positions (wrapping modulo 26), leaving digits, spaces, and punctuation unchanged.
2. `crack_caesar(ciphertext, known_word)` — tries every shift from `0` to `25` to decrypt `ciphertext` and returns `(shift, plaintext)` for the first shift whose decrypted text contains `known_word` (case-insensitively), where `shift` is the original encryption shift (`0`–`25`). Return `None` if no shift matches.

```python
ct = caesar_shift("Relay 4 online!", 7)    # "Ylshf 4 vuspul!"
crack_caesar(ct, "relay")                  # (7, "Relay 4 online!")
```

## Concept

A cipher's security depends on **Kerckhoffs's principle**: assume the attacker knows your algorithm completely — only the **key** is secret.

When the keyspace (total number of possible keys) is tiny — `26` for Caesar — an attacker simply tries every key in microseconds. Modern 128-bit and 256-bit keys have $2^{128}$ to $2^{256}$ possibilities, making brute force physically impossible.

## Hints

1. For an uppercase letter `ch`, its shifted character is `chr((ord(ch) - ord("A") + shift) % 26 + ord("A"))` (and similarly with `ord("a")` for lowercase).
2. To test whether encryption shift `k` produced `ciphertext`, decrypt with `caesar_shift(ciphertext, -k)` and check `known_word.lower() in candidate.lower()`.

## Starter: guided

```python
def caesar_shift(text, shift):
    out = []
    for ch in text:
        if "A" <= ch <= "Z":
            out.append(chr((ord(ch) - ord("A") + shift) % 26 + ord("A")))
        elif "a" <= ch <= "z":
            # TODO: shift lowercase letters the same way
            out.append(ch)
        else:
            out.append(ch)
    return "".join(out)


def crack_caesar(ciphertext, known_word):
    # TODO: try shift 0..25, decrypt with -shift, check known_word case-insensitively
    pass
```

## Starter: standard

```python
def caesar_shift(text, shift):
    pass


def crack_caesar(ciphertext, known_word):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
ct = get("caesar_shift")("Relay 4 online!", 7)
expect("caesar_shift preserves case and punctuation", lambda: ct, "Ylshf 4 vuspul!")
expect("crack_caesar recovers shift and plaintext", lambda: get("crack_caesar")(ct, "relay"), (7, "Relay 4 online!"))
expect("negative shift decrypts", lambda: get("caesar_shift")(ct, -7), "Relay 4 online!")
```

## Hidden checks

```python
expect("shift wraps cleanly past Z and z", lambda: get("caesar_shift")("XyZ-9", 3), "AbC-9")
expect("unmatched crib returns None", lambda: get("crack_caesar")("Ylshf 4 vuspul!", "battery"), None)
```

## Solution

```python
def caesar_shift(text, shift):
    out = []
    for ch in text:
        if "A" <= ch <= "Z":
            out.append(chr((ord(ch) - ord("A") + shift) % 26 + ord("A")))
        elif "a" <= ch <= "z":
            out.append(chr((ord(ch) - ord("a") + shift) % 26 + ord("a")))
        else:
            out.append(ch)
    return "".join(out)


def crack_caesar(ciphertext, known_word):
    needle = known_word.lower()
    for shift in range(26):
        plain = caesar_shift(ciphertext, -shift)
        if needle in plain.lower():
            return shift, plain
    return None
```

## Restored

All 26 Caesar shifts fall in under a millisecond — proof that tiny keyspaces offer zero real secrecy.
