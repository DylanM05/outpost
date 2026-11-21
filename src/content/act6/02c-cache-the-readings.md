---
id: cache-the-readings
title: Cache the readings
system: Memo desk
symbol: instrument
scene: tests
skills: functional, dictionaries
---

## Briefing

Computing air density from elevation and pressure involves slow floating-point math, and the flight planner asks for the same waystation elevations over and over. Because the calculation is a pure function — same input, same answer — you can wrap it in a closure that remembers past answers.

## Objective

Write a decorator function `memoize(fn)` that takes a function `fn` and returns a new wrapped function:

- The wrapped function accepts any positional arguments `*args`.
- If `args` is already in its cache dictionary, it returns the stored result **without calling `fn` again**.
- Otherwise, it calls `fn(*args)`, saves the result under `args` in the cache, and returns it.

```python
@memoize
def slow_square(n):
    return n * n

slow_square(4)  # calls slow_square once, caches 16
slow_square(4)  # returns 16 from cache without calling slow_square
```

## Concept

A **decorator** is a function that takes a function and returns an enhanced version of it. Writing `@memoize` above `def foo(...):` is Python shorthand for:

```python
foo = memoize(foo)
```

Inside `memoize(fn)`, a closure holds a private `cache = {}` dictionary. Positional arguments passed via `*args` arrive as a **tuple**, which is immutable and can be used directly as a dictionary key!

```python
def memoize(fn):
    cache = {}
    def wrapped(*args):
        if args not in cache:
            cache[args] = fn(*args)
        return cache[args]
    return wrapped
```

Notice why purity matters here: caching only gives right answers when `fn` always returns the same output for the same arguments. Also check `if args not in cache:` rather than checking if the value is truthy, so a cached `0`, `False`, or `None` is still reused!

## Hints

1. Create `cache = {}` inside `memoize(fn)`, before defining `def wrapped(*args):`.
2. Inside `wrapped`, check `if args not in cache: cache[args] = fn(*args)`, then `return cache[args]`.
3. Return `wrapped` from `memoize`.

## Starter: guided

```python
def memoize(fn):
    cache = {}

    def wrapped(*args):
        # If args is not in cache, compute fn(*args) and store it.
        # Then return cache[args].
        return fn(*args)

    return wrapped
```

## Starter: standard

```python
def memoize(fn):
    def wrapped(*args):
        return fn(*args)
    return wrapped
```

## Starter: challenge

```python
```

## Checks

```python
calls = [0]

def add_pair(a, b):
    calls[0] += 1
    return a + b

cached = get("memoize")(add_pair)
expect("cached(3, 4)", lambda: cached(3, 4), 7)
expect("cached(3, 4) again", lambda: cached(3, 4), 7)
expect("cached(10, 20)", lambda: cached(10, 20), 30)
expect("cached(3, 4) a third time", lambda: cached(3, 4), 7)
expect(
    "underlying function only ran twice",
    lambda: calls[0],
    2,
    "Store results by args in a cache dictionary so repeated calls skip fn.",
)
```

## Hidden checks

```python
zero_calls = [0]

def always_zero(x):
    zero_calls[0] += 1
    return 0

cached_zero = get("memoize")(always_zero)
expect("caches falsy return value 0", lambda: (cached_zero(1), cached_zero(1), zero_calls[0]), (0, 0, 1), "Check `args not in cache`, not whether the cached value is truthy.")

none_calls = [0]

def returns_none(x):
    none_calls[0] += 1
    return None

cached_none = get("memoize")(returns_none)
expect("caches None too", lambda: (cached_none("a"), cached_none("a"), none_calls[0]), (None, None, 1))

c1 = [0]
c2 = [0]
f1 = get("memoize")(lambda x: (c1.__setitem__(0, c1[0] + 1), x + 1)[1])
f2 = get("memoize")(lambda x: (c2.__setitem__(0, c2[0] + 1), x * 10)[1])
expect("separate wrapped functions have separate caches", lambda: (f1(5), f2(5), f1(5), c1[0], c2[0]), (6, 50, 6, 1, 1))
```

## Solution

```python
def memoize(fn):
    cache = {}

    def wrapped(*args):
        if args not in cache:
            cache[args] = fn(*args)
        return cache[args]

    return wrapped
```

## Restored

The memo desk caches repeated calculations automatically. Pure functions that once ran thousands of times now compute each elevation once.
