---
id: spot-the-ai-bugs
kind: predict
title: Spot the ai bugs
system: Review bench
symbol: controller
scene: console
skills: debugging, reading-code
---

## Briefing

AI coding tools can write plausible-looking Python in seconds — which makes **reading code critically** more valuable than ever. Three classic Python traps show up constantly in generated code: a mutable default argument shared across calls, a loop variable captured by reference in closures (`late binding`), and removing items from a list while iterating over it. Trace what this buggy snippet *actually* prints!

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

Never accept plausible-looking code on faith — trace edge cases and run tests:

1. **Mutable default:** `def add(item, bag=[]):` reuses the **same** list across every call that omits `bag`.
2. **Late binding in closures:** `[lambda x: x + n for n in range(3)]` creates three functions that all look up the **same** loop variable `n`, which equals `2` when the loop finishes! (Fix: bind as a default argument `lambda x, n=n: x + n`.)
3. **Mutating while iterating:** `for x in nums: if x % 2 == 0: nums.remove(x)` shifts indices left as items disappear, skipping the element immediately after each removed item!

## Hints

1. First snippet: `add("a")` returns `['a']`; `add("b")` appends to that **same** list!
2. Second snippet: by the time `f(10)` runs, `n` is `2` for **all three** functions in `adders`!
3. Third snippet: `nums = [2, 4, 5, 6]`. At index 0, `2` is removed so `4` slides into index 0 — the loop moves to index 1 (`5`), **skipping `4`**! Then index 2 is `6`, which gets removed.

## Program

```python
def add(item, bag=[]):
    bag.append(item)
    return bag


add("a")
print(add("b"))

adders = [lambda x: x + n for n in range(3)]
print([f(10) for f in adders])

nums = [2, 4, 5, 6]
for x in nums:
    if x % 2 == 0:
        nums.remove(x)
print(nums)
```

## Output

```text
['a', 'b']
[12, 12, 12]
[4, 5]
```

## Restored

You caught all three silent traps that look completely reasonable at a glance — and verified what Python actually executes.
