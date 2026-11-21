---
id: compile-ast
kind: code
title: Constant folding and AST-to-bytecode compiler
system: Bytecode deck
symbol: equipment
scene: tests
skills: bytecode-vm
---

## Briefing

Compiling an AST into stack bytecode is a **post-order traversal**: emit the left operand, emit the right operand, then emit the operator instruction! Even better, adding a **constant-folding optimization pass** collapses constant subtrees like `("bin", "+", ("num", 2), ("num", 3))` into `("num", 5)` at compile time so the VM never wastes instructions computing constants at runtime!

## Objective

Write two functions:

1. `fold_constants(node)` — recursively optimizes an expression AST without mutating it:
   - `("neg", child)`: fold `child`; if it's `("num", v)` return `("num", -v)`, else `("neg", folded_child)`.
   - `("bin", op, left, right)`: fold both sides; if both are `("num", lv)` and `("num", rv)` (and not dividing by `0`!), evaluate `+`, `-`, `*`, `/` (`//`) and return `("num", result)`! Otherwise return `("bin", op, folded_l, folded_r)`.
   - Leaves (`"num"`, `"var"`) return unchanged.
2. `compile_expr(node)` — runs `fold_constants(node)` first, then compiles the AST into a flat list of stack-VM instructions:
   - `("num", n)` -> `[("PUSH", n)]`
   - `("var", name)` -> `[("LOAD", name)]`
   - `("neg", child)` -> `compile(child) + [("NEG",)]`
   - `("bin", op, left, right)` -> `compile(left) + compile(right) + [(OP_NAME,)]`, where `+` -> `"ADD"`, `-` -> `"SUB"`, `*` -> `"MUL"`, `/` -> `"DIV"`, `==` -> `"EQ"`, `!=` -> `"NEQ"`, `<` -> `"LT"`, `<=` -> `"LE"`, `>` -> `"GT"`, `>=` -> `"GE"`.

## Concept

Look at what constant folding achieves on `x + (60 * 60 * 24)`:
- Without folding: `LOAD x`, `PUSH 60`, `PUSH 60`, `MUL`, `PUSH 24`, `MUL`, `ADD` (7 instructions every time!).
- With folding: `LOAD x`, `PUSH 86400`, `ADD` (3 instructions!).
- And guarding `rv != 0` ensures `1 / 0` still raises `ZeroDivisionError` at runtime instead of crashing the compiler if it's inside an untaken branch!

## Hints

1. Fold children *first* (`fl = fold_constants(left)`, `fr = fold_constants(right)`) so nested constant expressions like `(2 + 3) * (4 + 1)` collapse bottom-up all the way to `("num", 25)`!
2. Emit into one shared list `out = []` with a recursive `emit(n)` helper so compilation is $O(\text{nodes})$.

## Starter: guided

```python
BIN_OPS = {
    "+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV",
    "==": "EQ", "!=": "NEQ", "<": "LT", "<=": "LE", ">": "GT", ">=": "GE",
}


def fold_constants(node):
    tag = node[0]
    if tag in ("num", "var"):
        return node
    if tag == "neg":
        child = fold_constants(node[1])
        return ("num", -child[1]) if child[0] == "num" else ("neg", child)
    if tag == "bin":
        _, op, left, right = node
        fl = fold_constants(left)
        fr = fold_constants(right)
        # TODO: if both fl and fr are ("num", ...), fold +, -, *, / (when rv != 0)
        return ("bin", op, fl, fr)
    return node


def compile_expr(node):
    folded = fold_constants(node)
    out = []
    # TODO: post-order emit instructions into out
    return out
```

## Starter: standard

```python
def fold_constants(node):
    pass


def compile_expr(node):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
ast = ("bin", "+", ("var", "x"), ("bin", "*", ("bin", "+", ("num", 2), ("num", 3)), ("num", 4)))
expect("fold_constants collapses nested constant subtree to 20", lambda: get("fold_constants")(ast), ("bin", "+", ("var", "x"), ("num", 20)))
expect("compile_expr emits folded flat bytecode", lambda: get("compile_expr")(ast), [("LOAD", "x"), ("PUSH", 20), ("ADD",)])

# Division by zero must NOT crash compile time
div0 = ("bin", "/", ("num", 1), ("num", 0))
expect("division by zero stays unfolded for runtime", lambda: get("compile_expr")(div0), [("PUSH", 1), ("PUSH", 0), ("DIV",)])
```

## Hidden checks

```python
ast2 = ("bin", "<", ("neg", ("var", "a")), ("bin", "-", ("num", 10), ("num", 3)))
expect("emits NEG and LT cleanly", lambda: get("compile_expr")(ast2), [("LOAD", "a"), ("NEG",), ("PUSH", 7), ("LT",)])
expect("folds unary negation of constant", lambda: get("fold_constants")(("neg", ("num", 5))), ("num", -5))
```

## Solution

```python
BIN_OPS = {
    "+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV",
    "==": "EQ", "!=": "NEQ", "<": "LT", "<=": "LE", ">": "GT", ">=": "GE",
}


def fold_constants(node):
    tag = node[0]
    if tag in ("num", "var"):
        return node
    if tag == "neg":
        child = fold_constants(node[1])
        return ("num", -child[1]) if child[0] == "num" else ("neg", child)
    if tag == "bin":
        _, op, left, right = node
        fl = fold_constants(left)
        fr = fold_constants(right)
        if fl[0] == "num" and fr[0] == "num":
            lv, rv = fl[1], fr[1]
            if op == "+":
                return ("num", lv + rv)
            if op == "-":
                return ("num", lv - rv)
            if op == "*":
                return ("num", lv * rv)
            if op == "/" and rv != 0:
                return ("num", lv // rv)
        return ("bin", op, fl, fr)
    return node


def compile_expr(node):
    folded = fold_constants(node)
    out = []

    def emit(n):
        tag = n[0]
        if tag == "num":
            out.append(("PUSH", n[1]))
        elif tag == "var":
            out.append(("LOAD", n[1]))
        elif tag == "neg":
            emit(n[1])
            out.append(("NEG",))
        elif tag == "bin":
            emit(n[2])
            emit(n[3])
            out.append((BIN_OPS[n[1]],))
        else:
            raise ValueError(f"cannot compile node: {n!r}")

    emit(folded)
    return out
```

## Restored

Constant expressions fold down to single `PUSH` instructions at compile time before hitting the VM.
