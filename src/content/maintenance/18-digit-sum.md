---
id: maintenance-digit-sum
title: Check the marker code
system: Cave survey
symbol: controller
scene: calls
skills: recursion
reviewSkill: recursion
prerequisite: count-the-crystals
---

## Briefing

Every cave marker's code has a check value: the sum of its digits. The relay uses it to catch codes garbled on the way up.

## Objective

Write `digit_sum(code)`, using recursion. `code` is a whole number, 0 or more. Return the sum of its digits.

```python
digit_sum(4096)  # 19
digit_sum(7)     # 7
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. A number below 10 is a single digit: that's the base case.
2. `code % 10` is the last digit, and `code // 10` is everything before it.
3. Return the last digit plus `digit_sum` of the rest.

## Starter

```python
```

## Checks

```python
expect_recursive("digit_sum(4096)", "digit_sum", (4096,), 19)
expect_recursive("digit_sum(7)", "digit_sum", (7,), 7, recurse=False)
```

## Hidden checks

```python
expect_recursive("digit_sum(0)", "digit_sum", (0,), 0, recurse=False)
expect_recursive("digit_sum(10)", "digit_sum", (10,), 1)
expect_recursive("digit_sum(999999)", "digit_sum", (999999,), 54)
expect_recursive("digit_sum(1000001)", "digit_sum", (1000001,), 2)
```

## Solution

```python
def digit_sum(code):
    if code < 10:
        return code
    return code % 10 + digit_sum(code // 10)
```

## Restored

Garbled codes fail their check and get resent. Every marker reaches the surface map intact.
