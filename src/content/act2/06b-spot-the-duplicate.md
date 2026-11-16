---
id: spot-the-duplicate
title: Spot the duplicate
system: Index vault
symbol: instrument
scene: work
skills: hashing, sets
---

## Briefing

Every marker code is supposed to be unique, but a faulty printer may have issued one twice. The vault's checker compares every code with every other code, and with a full batch it takes so long that nobody runs it.

## Objective

`has_duplicate(codes)` returns `True` if any code appears more than once, and `False` otherwise. Make it read each code only once or twice, without changing its answers.

```python
has_duplicate([401, 77, 230, 77])  # True
has_duplicate([401, 77, 230])      # False
```

The hidden test checks 1,500 codes and allows 3,000 reads.

## Concept

The checker uses the pair loop from the solar array, which compares every code with every code after it. With 1,500 codes that's over a million comparisons, and the work grows with the square of the batch.

A set remembers what you've seen, and checking it is constant time. So walk through the codes once:

- If this code is already in the set, you've found a duplicate.
- Otherwise, add it to the set and move on.

```python
seen = set()
seen.add(401)
401 in seen   # True
77 in seen    # False
```

This swaps time for memory: the set holds up to one entry per code. That's usually a good trade, and it's the most common way hashing makes code faster. Whenever you see a loop inside a loop asking "have I seen this before?", a set can usually replace the inner loop.

## Hints

1. Create `seen = set()` before a single loop over the codes.
2. Inside the loop: if the code is in `seen`, return `True`. Otherwise, `seen.add(code)`.
3. Return `False` after the loop, when no code turned up twice.

## Starter: guided

```python
def has_duplicate(codes):
    seen = set()
    for code in codes:
        # If code is already in seen, return True.
        # Otherwise, add it to seen.
        print(code, seen)
    return False


print(has_duplicate([401, 77, 230, 77]))
```

## Starter: standard

```python
def has_duplicate(codes):
    for i in range(len(codes)):
        for j in range(i + 1, len(codes)):
            if codes[i] == codes[j]:
                return True
    return False
```

## Starter: challenge

```python
```

## Checks

```python
expect("has_duplicate([401, 77, 230, 77])", lambda: get("has_duplicate")([401, 77, 230, 77]), True)
expect("has_duplicate([401, 77, 230])", lambda: get("has_duplicate")([401, 77, 230]), False)
batch = tracked([(i * 37) % 1000 for i in range(100)])
expect_within(
    "has_duplicate(100 unique codes)",
    lambda: get("has_duplicate")(batch),
    False,
    batch,
    200,
    "Remember the codes you've seen in a set, instead of comparing every pair.",
)
```

## Hidden checks

```python
expect("has_duplicate([])", lambda: get("has_duplicate")([]), False)
expect("has_duplicate([5])", lambda: get("has_duplicate")([5]), False)
expect("has_duplicate([5, 5])", lambda: get("has_duplicate")([5, 5]), True)
expect("has_duplicate([1, 2, 3, 4, 1])", lambda: get("has_duplicate")([1, 2, 3, 4, 1]), True)
full = tracked([(i * 7919) % 100003 for i in range(1500)])
expect_within(
    "has_duplicate(1,500 unique codes)",
    lambda: get("has_duplicate")(full),
    False,
    full,
    3000,
    "Remember the codes you've seen in a set, instead of comparing every pair.",
)
late = tracked(list(range(1499)) + [1498])
expect_within(
    "has_duplicate(1,500 codes, the last one repeated)",
    lambda: get("has_duplicate")(late),
    True,
    late,
    3000,
    "Remember the codes you've seen in a set, instead of comparing every pair.",
)
```

## Solution

```python
def has_duplicate(codes):
    seen = set()
    for code in codes:
        if code in seen:
            return True
        seen.add(code)
    return False
```

## Restored

The checker runs on every batch now, in a blink. It finds one duplicated code from last spring, and the vault reissues it.
