---
id: allocate-pennies
title: Split money proportionally without losing a penny
system: Mint bench
symbol: instrument
scene: tests
skills: financial-ledgers
---

## Briefing

Dividing `$1.00` (`100` cents) across three partners with `100 // 3 = 33` makes `1` cent vanish into thin air (`33 + 33 + 33 = 99`)! Financial systems use the **largest-remainder method** so every split sums to the exact penny.

## Concept

Given integer `total_cents >= 0` and positive integer `weights = [w_0, w_1, ...]`:
Let `W = sum(weights)`. For each share `i`:
- Exact quota is `total_cents * w_i / W`.
- Floor share is `base_i = (total_cents * w_i) // W`.
- Integer remainder numerator is `rem_i = (total_cents * w_i) % W` (zero float rounding error!).
- Leftover pennies: `leftover = total_cents - sum(base)`.
- Give `+1` cent to the `leftover` shares with the **largest `rem_i`**, breaking ties by **smallest index `i`**!

## Objective

Write `allocate_cents(total_cents, weights)`:
- Validate `total_cents >= 0`, `len(weights) >= 1`, and every `w > 0` (else `ValueError`).
- Return a list of non-negative integers (same length as `weights`) summing to `total_cents` using exact integer largest-remainder allocation.

## Hints

1. Compute `base = [(total_cents * w) // W for w in weights]` and `rems = [(total_cents * w) % W for w in weights]` — pure integers, zero float error!
2. Sort `range(len(weights))` by `(-rems[i], i)` and add `1` to `base[idx]` for the first `leftover` indices.

## Starter: guided

```python
def allocate_cents(total_cents, weights):
    if total_cents < 0 or not weights or any(w <= 0 for w in weights):
        raise ValueError("total_cents must be >= 0 and weights must be positive")
    total_w = sum(weights)
    shares = [(total_cents * w) // total_w for w in weights]
    rems = [(total_cents * w) % total_w for w in weights]
    leftover = total_cents - sum(shares)
    # Distribute leftover pennies to indices sorted by (-rems[i], i)
    return shares
```

## Starter: standard

```python
def allocate_cents(total_cents, weights):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("splits 100 cents equally 3 ways without losing a cent", lambda: get("allocate_cents")(100, [1, 1, 1]), [34, 33, 33])
expect("gives remainder penny to largest fractional remainder", lambda: get("allocate_cents")(10, [1, 2, 5]), [1, 3, 6])
expect("handles zero total cleanly", lambda: get("allocate_cents")(0, [3, 7]), [0, 0])
```

## Hidden checks

```python
expect("splits large amount with exact sum conservation", lambda: (sum(get("allocate_cents")(1000001, [7, 13, 29, 51])), len(get("allocate_cents")(1000001, [7, 13, 29, 51]))), (1000001, 4))
def _bad():
    for args in [(-1, [1]), (10, []), (10, [1, 0])]:
        try:
            get("allocate_cents")(*args)
            return False
        except ValueError:
            pass
    return True
expect("invalid inputs raise ValueError", _bad, True)
```

## Solution

```python
def allocate_cents(total_cents, weights):
    if total_cents < 0 or not weights or any(w <= 0 for w in weights):
        raise ValueError("total_cents must be >= 0 and weights must be positive")
    total_w = sum(weights)
    shares = [(total_cents * w) // total_w for w in weights]
    rems = [(total_cents * w) % total_w for w in weights]
    leftover = total_cents - sum(shares)
    order = sorted(range(len(weights)), key=lambda i: (-rems[i], i))
    for idx in order[:leftover]:
        shares[idx] += 1
    return shares
```

## Restored

Every proportional split now conserves every single penny using exact integer remainders.
