---
id: maintenance-mod-inverse
title: Modular inverse check
system: Key exchange
symbol: controller
scene: tests
skills: asymmetric-crypto
reviewSkill: asymmetric-crypto
prerequisite: key-rotation
---

## Briefing

RSA private-key generation needs the modular multiplicative inverse $d$ such that $(e \cdot d) \bmod \phi = 1$, which exists if and only if $\gcd(e, \phi) = 1$.

## Objective

Write `safe_mod_inverse(e, modulus)`:

- If `modulus <= 1` or `math.gcd(e, modulus) != 1`, return `None`.
- Otherwise return the integer `d` in `0 < d < modulus` such that `(e * d) % modulus == 1`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `if modulus <= 1 or math.gcd(e, modulus) != 1: return None`.
2. Return `pow(e, -1, modulus)`.

## Starter

```python
```

## Checks

```python
expect("inverse of 17 mod 3120 is 2753", lambda: get("safe_mod_inverse")(17, 3120), 2753)
expect("non-coprime returns None", lambda: get("safe_mod_inverse")(6, 9), None)
```

## Hidden checks

```python
d = get("safe_mod_inverse")(65537, (101 - 1) * (103 - 1))
check("satisfies (e * d) % m == 1", lambda: d is not None and (65537 * d) % 10200 == 1)
expect("modulus <= 1 returns None", lambda: get("safe_mod_inverse")(3, 1), None)
```

## Solution

```python
import math


def safe_mod_inverse(e, modulus):
    if modulus <= 1 or math.gcd(e, modulus) != 1:
        return None
    return pow(e, -1, modulus)
```

## Restored

Invalid RSA exponents return `None` cleanly while valid exponents invert in microseconds.
