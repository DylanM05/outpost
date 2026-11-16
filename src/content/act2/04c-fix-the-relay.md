---
id: fix-the-relay
title: Fix the relay
system: Cave survey
symbol: controller
scene: calls
skills: recursion, debugging
---

## Briefing

Radio doesn't reach far underground, so messages from the cave are passed up a chain of relay stations. Each station hands the message up to two hops along, and every hand-off adds 3 seconds. The delay calculator works for some depths, and for others it locks up the terminal.

## Objective

Fix `relay_delay(hops)` so it returns the delay in seconds for any number of hops, odd or even. Each hand-off covers 2 hops, or just 1 for the last leg if only 1 is left, and adds 3 seconds.

```python
relay_delay(4)  # 6: two hand-offs
relay_delay(5)  # 9: hand-offs of 2, 2, then 1
relay_delay(0)  # 0
```

## Concept

When a recursive function never reaches its base case, it keeps calling itself until Python stops it with a **RecursionError**. Python allows about a thousand calls waiting on the stack at once, which is plenty for a function that works and nowhere near enough for one that never stops.

Two things have to be true for recursion to stop:

1. Every recursive call moves **closer** to a base case.
2. The base case catches **every** way of arriving there, not just the one you had in mind.

The second is the easy one to miss. A base case of `n == 0` is fine when `n` goes down by 1 each time, since it can't skip past 0. When `n` goes down by 2, an odd `n` jumps from 1 straight to -1, and the check never matches.

Run the code and read the call tree: it shows exactly which numbers the calls passed through.

## Hints

1. Run it, and look at the call tree for `relay_delay(5)`. Which hops does it pass through?
2. From 1, subtracting 2 gives -1, which skips right past the base case.
3. Change the base case so it catches 0 and anything below it: `if hops <= 0:`.

## Starter

```python
def relay_delay(hops):
    if hops == 0:
        return 0
    return 3 + relay_delay(hops - 2)


print(relay_delay(4))
```

## Checks

```python
expect_recursive("relay_delay(4)", "relay_delay", (4,), 6)
expect_recursive("relay_delay(5)", "relay_delay", (5,), 9)
```

## Hidden checks

```python
expect_recursive("relay_delay(0)", "relay_delay", (0,), 0, recurse=False)
expect_recursive("relay_delay(1)", "relay_delay", (1,), 3)
expect_recursive("relay_delay(2)", "relay_delay", (2,), 3)
expect_recursive("relay_delay(11)", "relay_delay", (11,), 18)
expect_recursive("relay_delay(100)", "relay_delay", (100,), 150)
```

## Solution

```python
def relay_delay(hops):
    if hops <= 0:
        return 0
    return 3 + relay_delay(hops - 2)
```

## Restored

Odd depths and even, every message reaches the surface, and the terminal no longer locks up when the surveyors ask how long they'll wait.
