---
id: compile-statements
kind: code
title: Compile if/else and while with jump backpatching
system: Bytecode deck
symbol: equipment
scene: tests
skills: bytecode-vm
---

## Briefing

When compiling an `if` or `while` statement in a single pass, you need to emit `("JMP_IF_FALSE", target)` **before** you know how many instructions long the body will be!

Compilers solve this with **jump backpatching**: emit a placeholder `("JMP_IF_FALSE", -1)`, remember its index `patch_idx`, compile the body, and then overwrite `code[patch_idx] = ("JMP_IF_FALSE", len(code))`!

## Objective

Write `compile_program(stmts)` compiling a list of statement ASTs into bytecode for our stack VM (ending with `("HALT",)`):

Supported statement nodes:
- `("assign", name, expr)` -> compile `expr`, then emit `("STORE", name)`.
- `("print", expr)` -> compile `expr`, then emit `("PRINT",)`.
- `("if", cond_expr, then_stmts, else_stmts)`:
  1. Compile `cond_expr`.
  2. Emit placeholder `jmp_false_idx = len(code); code.append(("JMP_IF_FALSE", -1))`.
  3. Compile `then_stmts`.
  4. If `else_stmts` is non-empty:
     - Emit placeholder `jmp_end_idx = len(code); code.append(("JMP", -1))`.
     - Backpatch `code[jmp_false_idx] = ("JMP_IF_FALSE", len(code))`.
     - Compile `else_stmts`.
     - Backpatch `code[jmp_end_idx] = ("JMP", len(code))`.
  5. Else:
     - Backpatch `code[jmp_false_idx] = ("JMP_IF_FALSE", len(code))`.
- `("while", cond_expr, body_stmts)`:
  1. Record `loop_start = len(code)`.
  2. Compile `cond_expr`.
  3. Emit placeholder `exit_idx = len(code); code.append(("JMP_IF_FALSE", -1))`.
  4. Compile `body_stmts`.
  5. Emit `("JMP", loop_start)`.
  6. Backpatch `code[exit_idx] = ("JMP_IF_FALSE", len(code))`.

## Concept

Single-pass jump backpatching is how real bytecode compilers (including CPython's compiler and Lua's compiler) turn arbitrarily nested `if`/`else`/`while` trees into flat linear jump offsets in $O(N)$ time!

## Hints

1. Reuse your expression compiler (`num`, `var`, `neg`, `bin`) for `expr` and `cond_expr`.
2. Notice the order inside `if/else`: the `JMP` skipping `else_stmts` MUST be emitted *before* recording the `else` start address for `jmp_false_idx`!

## Starter: guided

```python
BIN_OPS = {
    "+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV",
    "==": "EQ", "!=": "NEQ", "<": "LT", "<=": "LE", ">": "GT", ">=": "GE",
}


def compile_program(stmts):
    code = []

    def emit_expr(node):
        tag = node[0]
        if tag == "num":
            code.append(("PUSH", node[1]))
        elif tag == "var":
            code.append(("LOAD", node[1]))
        elif tag == "neg":
            emit_expr(node[1])
            code.append(("NEG",))
        elif tag == "bin":
            emit_expr(node[2])
            emit_expr(node[3])
            code.append((BIN_OPS[node[1]],))

    def emit_stmt(stmt):
        tag = stmt[0]
        if tag == "assign":
            emit_expr(stmt[2])
            code.append(("STORE", stmt[1]))
        elif tag == "print":
            emit_expr(stmt[1])
            code.append(("PRINT",))
        elif tag == "if":
            # TODO: emit cond, placeholder JMP_IF_FALSE, then_stmts, optional JMP + else_stmts, backpatch!
            pass
        elif tag == "while":
            # TODO: record loop_start, emit cond, placeholder JMP_IF_FALSE, body, JMP loop_start, backpatch!
            pass

    for s in stmts:
        emit_stmt(s)
    code.append(("HALT",))
    return code
```

## Starter: standard

```python
def compile_program(stmts):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _exec(code):
    stack, env, out, ip = [], {}, [], 0
    for _ in range(5000):
        if ip >= len(code):
            break
        instr = code[ip]; ip += 1; op = instr[0]
        if op == "PUSH": stack.append(instr[1])
        elif op == "LOAD": stack.append(env[instr[1]])
        elif op == "STORE": env[instr[1]] = stack.pop()
        elif op == "PRINT": out.append(stack.pop())
        elif op == "NEG": stack.append(-stack.pop())
        elif op == "ADD": b, a = stack.pop(), stack.pop(); stack.append(a + b)
        elif op == "SUB": b, a = stack.pop(), stack.pop(); stack.append(a - b)
        elif op == "MUL": b, a = stack.pop(), stack.pop(); stack.append(a * b)
        elif op == "DIV": b, a = stack.pop(), stack.pop(); stack.append(a // b)
        elif op == "EQ": b, a = stack.pop(), stack.pop(); stack.append(1 if a == b else 0)
        elif op == "NEQ": b, a = stack.pop(), stack.pop(); stack.append(1 if a != b else 0)
        elif op == "LT": b, a = stack.pop(), stack.pop(); stack.append(1 if a < b else 0)
        elif op == "LE": b, a = stack.pop(), stack.pop(); stack.append(1 if a <= b else 0)
        elif op == "GT": b, a = stack.pop(), stack.pop(); stack.append(1 if a > b else 0)
        elif op == "GE": b, a = stack.pop(), stack.pop(); stack.append(1 if a >= b else 0)
        elif op == "JMP": ip = instr[1]
        elif op == "JMP_IF_FALSE":
            if not stack.pop(): ip = instr[1]
        elif op == "HALT": break
    return out, env

# Compute factorial(5) = 120 and test if/else branch
stmts = [
    ("assign", "n", ("num", 5)),
    ("assign", "acc", ("num", 1)),
    ("while", ("bin", ">", ("var", "n"), ("num", 1)), [
        ("assign", "acc", ("bin", "*", ("var", "acc"), ("var", "n"))),
        ("assign", "n", ("bin", "-", ("var", "n"), ("num", 1))),
    ]),
    ("if", ("bin", "==", ("var", "acc"), ("num", 120)), [
        ("print", ("var", "acc")),
    ], [
        ("print", ("num", -1)),
    ]),
]
expect("compiled while + if/else executes factorial(5) == 120", lambda: _exec(get("compile_program")(stmts)), ([120], {"n": 1, "acc": 120}))
```

## Hidden checks

```python
# Test else branch taken AND nested if inside while
def _exec(code):
    stack, env, out, ip = [], {}, [], 0
    for _ in range(5000):
        if ip >= len(code): break
        instr = code[ip]; ip += 1; op = instr[0]
        if op == "PUSH": stack.append(instr[1])
        elif op == "LOAD": stack.append(env[instr[1]])
        elif op == "STORE": env[instr[1]] = stack.pop()
        elif op == "PRINT": out.append(stack.pop())
        elif op == "ADD": b, a = stack.pop(), stack.pop(); stack.append(a + b)
        elif op == "EQ": b, a = stack.pop(), stack.pop(); stack.append(1 if a == b else 0)
        elif op == "LT": b, a = stack.pop(), stack.pop(); stack.append(1 if a < b else 0)
        elif op == "JMP": ip = instr[1]
        elif op == "JMP_IF_FALSE":
            if not stack.pop(): ip = instr[1]
        elif op == "HALT": break
    return out

stmts = [
    ("assign", "i", ("num", 0)),
    ("while", ("bin", "<", ("var", "i"), ("num", 3)), [
        ("if", ("bin", "==", ("var", "i"), ("num", 1)), [
            ("print", ("num", 100)),
        ], [
            ("print", ("var", "i")),
        ]),
        ("assign", "i", ("bin", "+", ("var", "i"), ("num", 1))),
    ]),
]
expect("nested if/else inside while hits both branches accurately", lambda: _exec(get("compile_program")(stmts)), [0, 100, 2])
```

## Solution

```python
BIN_OPS = {
    "+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV",
    "==": "EQ", "!=": "NEQ", "<": "LT", "<=": "LE", ">": "GT", ">=": "GE",
}


def compile_program(stmts):
    code = []

    def emit_expr(node):
        tag = node[0]
        if tag == "num":
            code.append(("PUSH", node[1]))
        elif tag == "var":
            code.append(("LOAD", node[1]))
        elif tag == "neg":
            emit_expr(node[1])
            code.append(("NEG",))
        elif tag == "bin":
            emit_expr(node[2])
            emit_expr(node[3])
            code.append((BIN_OPS[node[1]],))
        else:
            raise ValueError(f"unknown expr: {node!r}")

    def emit_stmt(stmt):
        tag = stmt[0]
        if tag == "assign":
            emit_expr(stmt[2])
            code.append(("STORE", stmt[1]))
        elif tag == "print":
            emit_expr(stmt[1])
            code.append(("PRINT",))
        elif tag == "if":
            _, cond, then_body, else_body = stmt
            emit_expr(cond)
            jmp_false = len(code)
            code.append(("JMP_IF_FALSE", -1))
            for s in then_body:
                emit_stmt(s)
            if else_body:
                jmp_end = len(code)
                code.append(("JMP", -1))
                code[jmp_false] = ("JMP_IF_FALSE", len(code))
                for s in else_body:
                    emit_stmt(s)
                code[jmp_end] = ("JMP", len(code))
            else:
                code[jmp_false] = ("JMP_IF_FALSE", len(code))
        elif tag == "while":
            _, cond, body = stmt
            loop_start = len(code)
            emit_expr(cond)
            jmp_exit = len(code)
            code.append(("JMP_IF_FALSE", -1))
            for s in body:
                emit_stmt(s)
            code.append(("JMP", loop_start))
            code[jmp_exit] = ("JMP_IF_FALSE", len(code))
        else:
            raise ValueError(f"unknown stmt: {stmt!r}")

    for s in stmts:
        emit_stmt(s)
    code.append(("HALT",))
    return code
```

## Restored

Nested `if`/`else` and `while` trees now compile in a single pass with exact backpatched jump targets.
