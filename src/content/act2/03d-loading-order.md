---
id: loading-order
title: Loading order
system: Sample sorter
symbol: instrument
scene: tests
skills: sorting, functions
---

## Briefing

The sorted cores are packed into crates for the flight down to the lab. The heaviest crates have to be loaded first, so they sit low in the hold. When two crates weigh the same, the loaders want them in alphabetical order, so they can check them off the manifest as they go.

## Objective

Write `loading_order(crates)`. Each crate is a tuple `(label, weight)`. Return a **new** list of the crates, heaviest first. Crates of equal weight go in alphabetical order of label. Leave the original list unchanged.

```python
loading_order([("seed", 20), ("fuel", 45), ("tools", 20), ("ice", 60)])
# [("ice", 60), ("fuel", 45), ("seed", 20), ("tools", 20)]
```

You can use `sorted()` now. Writing sorts by hand taught you how they work; real code uses the built-in one.

## Concept

`sorted()` returns a new sorted list and leaves the original alone. Its `key=` argument says what to sort **by**. Give it a function, and `sorted()` calls that function on every item and sorts by what it returns:

```python
def weight(crate):
    return crate[1]

sorted(crates, key=weight)                # lightest first
sorted(crates, key=weight, reverse=True)  # heaviest first
```

Write `key=weight`, not `key=weight()`. You're handing `sorted()` the function itself, to call on each crate, not calling it yourself.

Tuples compare item by item, like words compare letter by letter: the first items decide, and only a tie moves on to the second items. So `(20, "seed") < (20, "tools")`, because 20 ties with 20 and `"seed"` comes before `"tools"`. A key can return a tuple to sort by one thing, then break ties with another.

One catch: `reverse=True` reverses **everything**, labels included. To sort heaviest first but keep labels A to Z, negate the weight instead. Bigger weights give smaller negative numbers, which sort first.

`sorted()` uses Timsort, a sort that combines insertion sort on short runs with merging, which you'll build at the merge yard. On large shuffled lists it does far less work than any sort you've written so far.

## Hints

1. Write a key function that takes one crate and returns what to sort by.
2. Return a tuple from it: `(-weight, label)`. The negative weight puts heavy crates first, and the label breaks ties.
3. `return sorted(crates, key=your_key_function)`.

## Starter: guided

```python
def loading_key(crate):
    label = crate[0]
    weight = crate[1]
    # Return a tuple: heaviest first, then labels from A to Z.
    return weight


def loading_order(crates):
    return sorted(crates, key=loading_key)


print(loading_order([("seed", 20), ("fuel", 45), ("tools", 20), ("ice", 60)]))
```

## Starter: standard

```python
def loading_order(crates):
    # Sort heaviest first, with equal weights in alphabetical order.
    return sorted(crates)
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    'loading_order([("seed", 20), ("fuel", 45), ("tools", 20), ("ice", 60)])',
    lambda: get("loading_order")([("seed", 20), ("fuel", 45), ("tools", 20), ("ice", 60)]),
    [("ice", 60), ("fuel", 45), ("seed", 20), ("tools", 20)],
)
expect(
    'loading_order([("b", 5), ("a", 9)])',
    lambda: get("loading_order")([("b", 5), ("a", 9)]),
    [("a", 9), ("b", 5)],
)
```

## Hidden checks

```python
expect("loading_order([])", lambda: get("loading_order")([]), [])
expect('loading_order([("ice", 60)])', lambda: get("loading_order")([("ice", 60)]), [("ice", 60)])
expect(
    'loading_order([("tools", 30), ("fuel", 30), ("medical", 30)])',
    lambda: get("loading_order")([("tools", 30), ("fuel", 30), ("medical", 30)]),
    [("fuel", 30), ("medical", 30), ("tools", 30)],
    "Equal weights go in alphabetical order.",
)
expect(
    'loading_order([("a", 1), ("c", 3), ("b", 3), ("d", 2)])',
    lambda: get("loading_order")([("a", 1), ("c", 3), ("b", 3), ("d", 2)]),
    [("b", 3), ("c", 3), ("d", 2), ("a", 1)],
)
manifest = [("seed", 20), ("fuel", 45)]
check(
    "Leaves the original list unchanged",
    lambda: (get("loading_order")(manifest), manifest)[1] == [("seed", 20), ("fuel", 45)],
    "Return a new list with sorted() instead of sorting crates in place.",
)
```

## Solution

```python
def loading_key(crate):
    label = crate[0]
    weight = crate[1]
    return (-weight, label)


def loading_order(crates):
    return sorted(crates, key=loading_key)
```

## Restored

The heavy crates ride low and the loaders tick off the manifest in order. The cores reach the lab without a single crack.
