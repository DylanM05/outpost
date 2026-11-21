---
id: maintenance-eval-rpn-ast
title: Flatten an expression AST to postfix RPN
system: Parser table
symbol: equipment
scene: tests
skills: parsing
reviewSkill: parsing
prerequisite: lexical-closures
---

## Briefing

Before emitting stack-machine instructions, compilers often lower an expression AST into postfix (Reverse Polish Notation) order via post-order traversal.

## Objective

Write `ast_to_rpn(node)` where `node` is a nested tuple representing an arithmetic AST:
- `("num", value)` — a numeric leaf
- `("bin", op, left, right)` — a binary operation with operator string `op` (e.g. `"+"`, `"-"`, `"*"`, `"/"`)

Return a flat list in post-order: left subtree tokens, then right subtree tokens, then `op` (for a leaf, just `[value]`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `node[0]`: for `"num"`, return `[node[1]]`.
2. For `"bin"`, unpack `_, op, left, right = node` and return `ast_to_rpn(left) + ast_to_rpn(right) + [op]`.

## Starter

```python
```

## Checks

```python
expect("single number leaf", lambda: get("ast_to_rpn")(("num", 7)), [7])
expect("nested (2 + 3) * 4 in RPN", lambda: get("ast_to_rpn")(("bin", "*", ("bin", "+", ("num", 2), ("num", 3)), ("num", 4))), [2, 3, "+", 4, "*"])
expect("right-nested 10 - (6 / 2)", lambda: get("ast_to_rpn")(("bin", "-", ("num", 10), ("bin", "/", ("num", 6), ("num", 2)))), [10, 6, 2, "/", "-"])
```

## Hidden checks

```python
expect("deep left chain preserves operand order", lambda: get("ast_to_rpn")(("bin", "-", ("bin", "-", ("num", 9), ("num", 4)), ("num", 1))), [9, 4, "-", 1, "-"])
```

## Solution

```python
def ast_to_rpn(node):
    kind = node[0]
    if kind == "num":
        return [node[1]]
    if kind == "bin":
        _, op, left, right = node
        return ast_to_rpn(left) + ast_to_rpn(right) + [op]
    raise ValueError(f"unknown node kind: {kind}")
```

## Restored

Expression ASTs now flatten cleanly into post-order RPN ready for stack evaluation.
