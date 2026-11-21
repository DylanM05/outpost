---
id: maintenance-rpn-calc
title: Postfix calculator
system: Command stack
symbol: equipment
scene: tests
skills: linear-structures
reviewSkill: linear-structures
prerequisite: wait-times
---

## Briefing

Old field calculators evaluate expressions in postfix (Reverse Polish) notation like `["3", "4", "+", "2", "*"]` -> `(3 + 4) * 2 = 14`, which needs no parentheses — just a stack.

## Objective

Write `eval_rpn(tokens)`. `tokens` is a non-empty list of strings, each an integer or one of `"+"`, `"-"`, `"*"`. Push numbers onto a stack; on an operator, pop the top two values (`b` then `a`, so `a - b` keeps the right order!) and push the result. Return the final integer on the stack.

```python
eval_rpn(["3", "4", "+", "2", "*"])  # 14
eval_rpn(["10", "3", "-"])           # 7
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Watch subtraction order: `b = stack.pop()`, `a = stack.pop()`, then push `a - b`.
2. Any token not in `("+", "-", "*")` converts with `int(token)` and pushes onto `stack`.

## Starter

```python
```

## Checks

```python
expect('eval_rpn(["3", "4", "+", "2", "*"])', lambda: get("eval_rpn")(["3", "4", "+", "2", "*"]), 14)
expect('eval_rpn(["10", "3", "-"])', lambda: get("eval_rpn")(["10", "3", "-"]), 7)
```

## Hidden checks

```python
expect("single number", lambda: get("eval_rpn")(["42"]), 42)
expect("negative numbers and nested ops", lambda: get("eval_rpn")(["5", "1", "2", "+", "4", "*", "+", "3", "-"]), 14)
```

## Solution

```python
def eval_rpn(tokens):
    stack = []
    for tok in tokens:
        if tok == "+":
            b, a = stack.pop(), stack.pop()
            stack.append(a + b)
        elif tok == "-":
            b, a = stack.pop(), stack.pop()
            stack.append(a - b)
        elif tok == "*":
            b, a = stack.pop(), stack.pop()
            stack.append(a * b)
        else:
            stack.append(int(tok))
    return stack[0]
```

## Restored

The field calculator evaluates nested postfix formulas cleanly on a single stack.
