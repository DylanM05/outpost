---
id: memoize-the-climb
title: Memoize the climb
system: Supply ledger
symbol: equipment
scene: calls
skills: dynamic-programming, recursion, hashing
---

## Briefing

The climb planner needs to count valid ascent schedules across 60 ledges, where each hop can advance `1`, `2`, or `3` ledges. Without remembering past answers, `count_climbs(60)` would make more calls than the outpost's computer could finish in a century. Add **memoization** so each ledge height is computed only once.

## Objective

Write `count_climbs(n, memo=None)` that returns the number of distinct sequences of hops of size `1`, `2`, or `3` that add up to `n`:

- `count_climbs(0)` is `1` (one way to stay at 0: take no hops).
- Negative `n` returns `0`.
- For `n > 0`: `count_climbs(n) = count_climbs(n - 1) + count_climbs(n - 2) + count_climbs(n - 3)`.
- Use recursion with a memo dictionary so `count_climbs(60)` finishes in microseconds.

```python
count_climbs(3)  # 4: (1+1+1), (1+2), (2+1), (3)
count_climbs(4)  # 7
```

## Concept

**Top-down dynamic programming (memoization)** keeps the natural recursive structure and adds a dictionary (`memo`) that caches every computed result:

```python
def count_climbs(n, memo=None):
    if memo is None:
        memo = {}
    if n < 0:
        return 0
    if n == 0:
        return 1
    if n in memo:
        return memo[n]
    memo[n] = (
        count_climbs(n - 1, memo)
        + count_climbs(n - 2, memo)
        + count_climbs(n - 3, memo)
    )
    return memo[n]
```

Remember the shared-default-argument lesson from the workshop: write `memo=None` (never `memo={}`) and initialize `memo = {}` inside the function, or keep a private helper with a fresh dict!

With memoization, each value `0..n` is solved once, turning `O(3ⁿ)` exponential time into `O(n)` linear time.

## Hints

1. Handle base cases first: `if n < 0: return 0` and `if n == 0: return 1`.
2. Check `if n in memo: return memo[n]` before making recursive calls.
3. Pass `memo` into all three recursive calls, store their sum in `memo[n]`, and return `memo[n]`.

## Starter: guided

```python
def count_climbs(n, memo=None):
    if memo is None:
        memo = {}
    if n < 0:
        return 0
    if n == 0:
        return 1
    # If n is already in memo, return memo[n].
    # Otherwise compute the sum of n-1, n-2, n-3 (passing memo), save it, and return it.
    return count_climbs(n - 1) + count_climbs(n - 2) + count_climbs(n - 3)


print(count_climbs(4))
```

## Starter: standard

```python
def count_climbs(n, memo=None):
    if n < 0:
        return 0
    if n == 0:
        return 1
    return count_climbs(n - 1) + count_climbs(n - 2) + count_climbs(n - 3)
```

## Starter: challenge

```python
```

## Checks

```python
expect_recursive("count_climbs(4)", "count_climbs", (4,), 7)
expect("count_climbs(0)", lambda: get("count_climbs")(0), 1)
expect("count_climbs(3)", lambda: get("count_climbs")(3), 4)
expect("count_climbs(10)", lambda: get("count_climbs")(10), 274)
```

## Hidden checks

```python
def _ref_climbs(n):
    a, b, c = 1, 1, 2
    if n < 0:
        return 0
    if n == 0:
        return 1
    if n == 1:
        return 1
    for _ in range(2, n):
        a, b, c = b, c, a + b + c
    return c

# Gate the n=60 test by checking call count on n=14 first so unmemoized starters fail fast.
_found = safe(lambda: get("count_climbs"))
_hits = [0]
if _found.error is None:
    _orig = _found.value
    def _wrapped(*args, **kwargs):
        _hits[0] += 1
        return _orig(*args, **kwargs)
    namespace["count_climbs"] = _wrapped
    try:
        _out14 = safe(lambda: _wrapped(14))
    finally:
        namespace["count_climbs"] = _orig
else:
    _out14 = _found

expect("count_climbs(14)", lambda: _out14.value if _out14.error is None else (_ for _ in ()).throw(RuntimeError(_out14.error)), _ref_climbs(14))
fast = check(
    "Memoizes repeated subproblems (at most 80 calls for n=14)",
    lambda: _out14.error is None and _hits[0] <= 80,
    f"count_climbs(14) made {_hits[0]:,} calls. Cache each n in a dictionary so it's only computed once.",
)
if fast:
    expect("count_climbs(60)", lambda: get("count_climbs")(60), _ref_climbs(60))
    expect("count_climbs(-2)", lambda: get("count_climbs")(-2), 0)
```

## Solution

```python
def count_climbs(n, memo=None):
    if memo is None:
        memo = {}
    if n < 0:
        return 0
    if n == 0:
        return 1
    if n in memo:
        return memo[n]
    memo[n] = (
        count_climbs(n - 1, memo)
        + count_climbs(n - 2, memo)
        + count_climbs(n - 3, memo)
    )
    return memo[n]
```

## Restored

One dictionary turned a century-long calculation into sixty additions. The supply ledger now counts ascent plans up the full ridge in an instant.
