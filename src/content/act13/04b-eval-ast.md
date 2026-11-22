---
id: eval-ast
kind: code
title: Tree-walking AST evaluator
system: Parser table
symbol: controller
scene: tests
skills: parsing
---

## Briefing

The simplest way to run a parsed AST is a **tree-walking interpreter**: recursively evaluate child nodes and combine their values — taking care that logical `and`/`or` **short-circuit** (never evaluating the right operand when the left already decides the answer, e.g. `x != 0 and 10 / x > 1`!).

## Objective

Write `eval_ast(node, env)` where `env` is a dict mapping variable names to values and `node` is an AST tuple:

- `("num", n)` -> `n`
- `("var", name)` -> `env[name]` (raise `NameError` if `name` is not in `env`)
- `("neg", expr)` -> `-eval_ast(expr, env)`
- `("bin", op, left, right)` -> supports `+`, `-`, `*`, `/` (integer floor division `//`, raising `ZeroDivisionError` on `0`), `==`, `!=`, `<`, `<=`, `>`, `>=`
- `("and", left, right)` -> short-circuiting logical AND: evaluate `left`; if falsy return `False` **without** evaluating `right`; else return `bool(eval_ast(right, env))`
- `("or", left, right)` -> short-circuiting logical OR: evaluate `left`; if truthy return `True` **without** evaluating `right`; else return `bool(eval_ast(right, env))`

## Concept

Why can't `and` and `or` be handled by the same eager `l = eval_ast(left); r = eval_ast(right)` code as `+` and `*`?

Because in `x != 0 and 10 / x > 1`, evaluating `10 / x` eagerly when `x == 0` crashes with `ZeroDivisionError`! Short-circuiting evaluates `right` *only* when `left` doesn't already settle the outcome.

## Hints

1. Dispatch on `tag = node[0]`.
2. For `"var"`, check `if name not in env: raise NameError(name)`.
3. For `"and"` / `"or"`, evaluate `node[1]` first and return immediately if short-circuited!

## Starter: guided

```python
def eval_ast(node, env):
    tag = node[0]
    if tag == "num":
        return node[1]
    if tag == "var":
        if node[1] not in env:
            raise NameError(f"undefined variable: {node[1]}")
        return env[node[1]]
    if tag == "neg":
        return -eval_ast(node[1], env)
    if tag == "and":
        # TODO: evaluate node[1] first; short-circuit False if falsy
        pass
    if tag == "or":
        # TODO: evaluate node[1] first; short-circuit True if truthy
        pass
    if tag == "bin":
        _, op, left, right = node
        lval = eval_ast(left, env)
        rval = eval_ast(right, env)
        # TODO: handle +, -, *, / (//), ==, !=, <, <=, >, >=
        pass
    raise ValueError(f"unknown AST node: {tag}")
```

## Starter: standard

```python
def eval_ast(node, env):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
ast_math = ("bin", "+", ("num", 2), ("bin", "*", ("var", "x"), ("neg", ("num", 3))))
expect("evaluates arithmetic and variables", lambda: get("eval_ast")(ast_math, {"x": 4}), -10)

# Short-circuit guard: right side divides by zero if eagerly evaluated!
guard_and = ("and", ("bin", "!=", ("var", "x"), ("num", 0)), ("bin", ">", ("bin", "/", ("num", 10), ("var", "x")), ("num", 1)))
expect("and short-circuits before division by zero", lambda: get("eval_ast")(guard_and, {"x": 0}), False)
expect("and evaluates right side when left is true", lambda: get("eval_ast")(guard_and, {"x": 2}), True)

guard_or = ("or", ("bin", "==", ("var", "x"), ("num", 0)), ("bin", ">", ("bin", "/", ("num", 10), ("var", "x")), ("num", 1)))
expect("or short-circuits before division by zero", lambda: get("eval_ast")(guard_or, {"x": 0}), True)
```

## Hidden checks

```python
def undef():
    try:
        get("eval_ast")(("var", "missing"), {})
        return False
    except NameError:
        return True
check("undefined variable raises NameError", undef)
expect("floor division 7 / 2 == 3", lambda: get("eval_ast")(("bin", "/", ("num", 7), ("num", 2)), {}), 3)
```

## Solution

```python
def eval_ast(node, env):
    tag = node[0]
    if tag == "num":
        return node[1]
    if tag == "var":
        if node[1] not in env:
            raise NameError(f"undefined variable: {node[1]}")
        return env[node[1]]
    if tag == "neg":
        return -eval_ast(node[1], env)
    if tag == "and":
        return bool(eval_ast(node[2], env)) if eval_ast(node[1], env) else False
    if tag == "or":
        return True if eval_ast(node[1], env) else bool(eval_ast(node[2], env))
    if tag == "bin":
        _, op, left, right = node
        lv = eval_ast(left, env)
        rv = eval_ast(right, env)
        if op == "+":
            return lv + rv
        if op == "-":
            return lv - rv
        if op == "*":
            return lv * rv
        if op == "/":
            return lv // rv
        if op == "==":
            return lv == rv
        if op == "!=":
            return lv != rv
        if op == "<":
            return lv < rv
        if op == "<=":
            return lv <= rv
        if op == ">":
            return lv > rv
        if op == ">=":
            return lv >= rv
    raise ValueError(f"unknown AST node: {node!r}")
```

## Restored

The tree-walker evaluates expressions cleanly and short-circuits boolean guards before unsafe right-hand expressions ever run.
