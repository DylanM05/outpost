---
id: balanced-packets
title: Balanced packets
system: Command stack
symbol: equipment
scene: tests
skills: linear-structures, strings
---

## Briefing

Telemetry packets from the deep survey stations nest groups inside `()`, `[]`, and `{}`. Radio static sometimes chops off a closing bracket or scrambles the nesting order — like `([)]`. A simple counter for each bracket type gets fooled by `([)]`, so the receiver needs a stack to verify that every closer matches the most recent opener.

## Objective

Write `is_balanced(packet)`. It takes a string `packet` and returns `True` if all parentheses `()`, square brackets `[]`, and curly braces `{}` are properly matched and nested, and `False` otherwise. Ignore any other characters in the string.

```python
is_balanced("([1, 2], {3})")  # True
is_balanced("([)]")           # False
is_balanced("((()")           # False
is_balanced("]")              # False
```

## Concept

Why does a stack solve bracket matching? Because the **last** opening bracket you saw is always the **first** one that must be closed.

Walk through the characters of `packet`:

- When you see an opening bracket (`(`, `[`, `{`), push it onto the stack.
- When you see a closing bracket (`)`, `]`, `}`), check the top of the stack:
  - If the stack is empty, there's nothing to close — return `False`.
  - If the popped opener doesn't match this closer, the nesting is broken — return `False`.
- At the end of the string, the packet is balanced only if the stack is empty (no unclosed openers left behind).

A dictionary mapping each closer to its opener — `{")": "(", "]": "[", "}": "{"}` — keeps the matching check tiny and bug-free.

## Hints

1. Keep a dictionary `MATCH = {")": "(", "]": "[", "}": "{"}` and an empty `stack = []`.
2. For each character `ch` in `packet`: if `ch in "([{"`, push it. Else if `ch in MATCH`, check `if not stack or stack.pop() != MATCH[ch]: return False`.
3. After the loop, `return len(stack) == 0`.

## Starter: guided

```python
MATCH = {")": "(", "]": "[", "}": "{"}


def is_balanced(packet):
    stack = []
    for ch in packet:
        if ch in "([{":
            stack.append(ch)
        elif ch in MATCH:
            # Check if stack is empty or the top doesn't match MATCH[ch].
            pass
    # Only balanced if no unclosed brackets remain.
    return True


print(is_balanced("([1, 2], {3})"))
print(is_balanced("([)]"))
```

## Starter: standard

```python
def is_balanced(packet):
    return False
```

## Starter: challenge

```python
```

## Checks

```python
expect('is_balanced("([1, 2], {3})")', lambda: get("is_balanced")("([1, 2], {3})"), True)
expect('is_balanced("([)]")', lambda: get("is_balanced")("([)]"), False)
expect('is_balanced("((()")', lambda: get("is_balanced")("((()"), False)
expect('is_balanced("]")', lambda: get("is_balanced")("]"), False)
```

## Hidden checks

```python
expect("empty string is balanced", lambda: get("is_balanced")(""), True)
expect("plain text without brackets", lambda: get("is_balanced")("station-4 ok"), True)
expect("deeply nested valid", lambda: get("is_balanced")("{[()(()[])]}"), True)
expect("mismatched types", lambda: get("is_balanced")("{]"), False)
expect("extra closer at end", lambda: get("is_balanced")("()[]}"), False)
expect("opener at end", lambda: get("is_balanced")("()[{"), False)
```

## Solution

```python
MATCH = {")": "(", "]": "[", "}": "{"}


def is_balanced(packet):
    stack = []
    for ch in packet:
        if ch in "([{":
            stack.append(ch)
        elif ch in MATCH:
            if not stack or stack.pop() != MATCH[ch]:
                return False
    return len(stack) == 0
```

## Restored

Corrupted telemetry packets are caught on arrival before bad data reaches the deep survey log.
