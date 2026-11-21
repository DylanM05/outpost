---
id: maintenance-balanced-brackets
title: Validate brackets outside string literals
system: Lexer bench
symbol: equipment
scene: tests
skills: parsing
reviewSkill: parsing
prerequisite: lexical-closures
---

## Briefing

A naive bracket matcher panics on `print("(hello")` because it counts the `(` inside the string literal. Make the checker string-aware, including escaped quotes `\"` and `\\`.

## Objective

Write `check_brackets(source)` returning `True` if all `()`, `[]`, and `{}` brackets outside double-quoted string literals are properly matched and nested, and `False` otherwise.

Rules:
- Inside a `"..."` string literal, ignore all bracket characters.
- Inside a string literal, a backslash `\` escapes the immediately following character (so `\"` does not end the string, and `\\"` ends the string after an escaped backslash).
- An unterminated string literal at end of input must return `False`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Track `in_string = False` and `escaped = False` alongside a `stack = []` of expected closing brackets (or opening brackets).
2. While `in_string`: if `escaped`, clear `escaped = False`; elif `ch == "\\"`: set `escaped = True`; elif `ch == '"'`: set `in_string = False`. At EOF, return `not in_string and not stack`.

## Starter

```python
```

## Checks

```python
expect("ignores unbalanced bracket inside string", lambda: get("check_brackets")('call("(not [closed", [1, 2])'), True)
expect("handles escaped quotes inside strings", lambda: get("check_brackets")('x = "quote \\" [ still string" + (1)'), True)
expect("catches mismatched closing bracket", lambda: get("check_brackets")('([)]'), False)
```

## Hidden checks

```python
expect("unterminated string returns False", lambda: get("check_brackets")('("abc'), False)
expect("escaped backslash before closing quote closes string", lambda: get("check_brackets")('("\\\\")'), True)
```

## Solution

```python
PAIRS = {")": "(", "]": "[", "}": "{"}
OPENERS = set(PAIRS.values())


def check_brackets(source):
    stack = []
    in_string = False
    escaped = False
    for ch in source:
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
        else:
            if ch == '"':
                in_string = True
            elif ch in OPENERS:
                stack.append(ch)
            elif ch in PAIRS:
                if not stack or stack.pop() != PAIRS[ch]:
                    return False
    return not in_string and not stack
```

## Restored

The lexer's bracket checker skips string literals and escaped quotes without false alarms.
