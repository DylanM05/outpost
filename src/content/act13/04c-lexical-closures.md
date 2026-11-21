---
id: lexical-closures
kind: code
title: Lexical scopes and closures
system: Parser table
symbol: controller
scene: tests
skills: parsing
---

## Briefing

How do closures (`make_adder(10)(5) == 15`) remember `10` even after `make_adder` has returned — and **never** accidentally read a variable with the same name from the *caller's* scope?

By representing scopes as a linked chain of **`Env` frames** (`Env(bindings, parent)`), and packaging every function value as a **closure** holding `(params, body, defining_env)`!

## Objective

Write an `Env` class and an evaluator `eval_lang(node, env)`:

1. `Env(bindings=None, parent=None)`:
   - `lookup(self, name)` searches `self.bindings`, walking `self.parent` up to the root; raises `NameError` if not found anywhere.
2. `eval_lang(node, env)` supporting:
   - `("num", n)` -> `n`
   - `("var", name)` -> `env.lookup(name)`
   - `("add", left, right)` -> `eval_lang(left, env) + eval_lang(right, env)`
   - `("let", name, val_expr, body_expr)` -> evaluates `val = eval_lang(val_expr, env)` and evaluates `body_expr` in a new child `Env({name: val}, parent=env)` (outer `env` is never mutated!)
   - `("fn", params_list, body_expr)` -> captures the **current** `env` and returns a closure object/tuple `("closure", tuple(params_list), body_expr, env)`
   - `("call", fn_expr, arg_exprs)` -> evaluates `fn_expr` in `env` to get a closure `(params, body, captured_env)`, evaluates each arg in the **caller's** `env`, checks `len(args) == len(params)` (raising `TypeError` on mismatch), and evaluates `body` in a new `Env(dict(zip(params, args)), parent=captured_env)`!

## Concept

Look at the difference between **lexical scoping** (`parent=captured_env`) and the classic bug **dynamic scoping** (`parent=caller_env`):
- In `let x = 10 in let f = fn(y) -> x + y in let x = 999 in f(5)`:
  - **Lexical scoping** binds `f`'s parent to the `x = 10` frame where `f` was **defined** -> returns `15`!
  - Dynamic scoping would accidentally pick up the caller's `x = 999` -> wrong (`1004`)!

## Hints

1. Never mutate `env.bindings` on `let` or `call` — always create a fresh child `Env({...}, parent=...)`.
2. On `"call"`, evaluate `arg_exprs` in the **caller's** `env`, then run `body` in `Env(dict(zip(params, arg_vals)), parent=captured_env)`!

## Starter: guided

```python
class Env:
    def __init__(self, bindings=None, parent=None):
        self.bindings = dict(bindings or {})
        self.parent = parent

    def lookup(self, name):
        if name in self.bindings:
            return self.bindings[name]
        if self.parent is not None:
            return self.parent.lookup(name)
        raise NameError(f"undefined: {name}")


def eval_lang(node, env):
    tag = node[0]
    if tag == "num":
        return node[1]
    if tag == "var":
        return env.lookup(node[1])
    if tag == "add":
        return eval_lang(node[1], env) + eval_lang(node[2], env)
    if tag == "let":
        # TODO: evaluate node[2], bind node[1] in child Env, evaluate node[3]
        pass
    if tag == "fn":
        # TODO: return closure capturing current env
        pass
    if tag == "call":
        # TODO: eval fn_expr & args in caller env, run body in child of captured_env!
        pass
    raise ValueError(f"unknown node: {tag}")
```

## Starter: standard

```python
class Env:
    def __init__(self, bindings=None, parent=None):
        pass

    def lookup(self, name):
        pass


def eval_lang(node, env):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
Env = get("Env")
ev = get("eval_lang")

# let x = 10 in (let f = fn(y) => x + y in (let x = 999 in f(5))) -> MUST be 15 (lexical!), not 1004!
lexical_test = (
    "let", "x", ("num", 10),
    ("let", "f", ("fn", ["y"], ("add", ("var", "x"), ("var", "y"))),
        ("let", "x", ("num", 999),
            ("call", ("var", "f"), [("num", 5)]))),
)
expect("closures capture defining lexical scope, not caller's shadowed x", lambda: ev(lexical_test, Env()), 15)

# Higher-order factory: make_adder = fn(a) => fn(b) => a + b; make_adder(10)(7) -> 17
curried = (
    "let", "make_adder", ("fn", ["a"], ("fn", ["b"], ("add", ("var", "a"), ("var", "b")))),
    ("call", ("call", ("var", "make_adder"), [("num", 10)]), [("num", 7)]),
)
expect("nested closure factory make_adder(10)(7) == 17", lambda: ev(curried, Env()), 17)
```

## Hidden checks

```python
Env = get("Env")
ev = get("eval_lang")
def arity_mismatch():
    prog = ("call", ("fn", ["a", "b"], ("add", ("var", "a"), ("var", "b"))), [("num", 1)])
    try:
        ev(prog, Env())
        return False
    except TypeError:
        return True
check("wrong argument count raises TypeError", arity_mismatch)
```

## Solution

```python
class Env:
    def __init__(self, bindings=None, parent=None):
        self.bindings = dict(bindings or {})
        self.parent = parent

    def lookup(self, name):
        if name in self.bindings:
            return self.bindings[name]
        if self.parent is not None:
            return self.parent.lookup(name)
        raise NameError(f"undefined variable: {name}")


def eval_lang(node, env):
    tag = node[0]
    if tag == "num":
        return node[1]
    if tag == "var":
        return env.lookup(node[1])
    if tag == "add":
        return eval_lang(node[1], env) + eval_lang(node[2], env)
    if tag == "let":
        _, name, val_expr, body_expr = node
        val = eval_lang(val_expr, env)
        return eval_lang(body_expr, Env({name: val}, parent=env))
    if tag == "fn":
        _, params, body = node
        return ("closure", tuple(params), body, env)
    if tag == "call":
        _, fn_expr, arg_exprs = node
        fn_val = eval_lang(fn_expr, env)
        if not (isinstance(fn_val, tuple) and len(fn_val) == 4 and fn_val[0] == "closure"):
            raise TypeError("target is not callable")
        _, params, body, captured_env = fn_val
        if len(arg_exprs) != len(params):
            raise TypeError(f"expected {len(params)} arguments, got {len(arg_exprs)}")
        arg_vals = [eval_lang(arg, env) for arg in arg_exprs]
        call_env = Env(dict(zip(params, arg_vals)), parent=captured_env)
        return eval_lang(body, call_env)
    raise ValueError(f"unknown node: {tag}")
```

## Restored

Closures now carry their defining lexical frame cleanly, immune to variable shadowing in callers.
