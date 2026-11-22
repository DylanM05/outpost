---
id: build-script-engine
kind: code
title: Build the Outpost script engine end to end
system: Engine audit
symbol: controller
scene: tests
skills: memory-management, parsing, bytecode-vm
assessment: true
---

## Briefing

Time to fire up the entire engine room! Build a complete, self-contained **Outpost Script Engine** (`run_script(source, max_steps=10000)`) that takes source code as a string, lexes it, parses it into an AST with full operator precedence, folds constants, compiles statements into flat stack bytecode with jump backpatching, and executes it on a step-limited stack VM!

This is the final independent mission for **The engine room**.

## Objective

Implement `run_script(source, max_steps=10000)`:

### Language grammar
- Comments start with `#` and run to the end of the line.
- Statements:
  - `let <ident> = <expr>;` (binds or updates variable)
  - `<ident> = <expr>;` (updates variable)
  - `print(<expr>);` (appends evaluated integer to `output`)
  - `if (<expr>) { <stmts> }` or `if (<expr>) { <stmts> } else { <stmts> }`
  - `while (<expr>) { <stmts> }`
- Expressions (from lowest to highest precedence):
  - Comparisons: `==`, `!=`, `<`, `<=`, `>`, `>=` (evaluate to `1` for true, `0` for false)
  - Additive: `+`, `-` (left-associative)
  - Multiplicative: `*`, `/` (left-associative; `/` is integer floor division `//`)
  - Unary: `-`
  - Primary: integer literals, identifiers, `(<expr>)`

### Behavior & return value
- Raise `SyntaxError` on illegal characters, missing `;`, mismatched `{}` / `()`, or malformed expressions.
- Raise `NameError` when reading an undefined variable.
- Raise `RuntimeError` if VM execution exceeds `max_steps` instructions.
- Return:
  ```python
  {
      "output": [...],      # list of printed ints
      "vars": dict(env),    # final variable bindings
      "bytecode": code,     # non-empty list of compiled bytecode tuples ending in ("HALT",)
  }
  ```

## Concept

You are assembling a real compiler + VM pipeline from scratch:

```text
source text ─▶ Lexer ─▶ Recursive-Descent Parser ─▶ Constant Folder ─▶ Bytecode Compiler ─▶ Stack VM
```

Notice the precedence ladder: `comparison -> additive -> multiplicative -> unary -> primary`, so `a + 1 <= b * 2` parses cleanly as `(a + 1) <= (b * 2)`!

## Hints

1. Put comparison parsing right above additive: `comparison -> additive ( ("=="|"!="|"<"|"<="|">"|">=") additive )?`.
2. In your statement parser, handle `KW "let"`, `KW "print"`, `KW "if"`, `KW "while"`, and `IDENT` (assignment). Parse `{ <stmts> }` with a `parse_block()` helper that consumes `{`, loops until `}`, and consumes `}`.
3. Run your constant folder on expressions, compile statements with jump backpatching, and execute the resulting bytecode on your step-limited stack VM!

## Starter: guided

```python
```

## Starter: standard

```python
```

## Starter: challenge

```python
```

## Checks

```python
fib_script = """
# Compute first 7 Fibonacci numbers
let a = 0;
let b = 1;
let i = 0;
while (i < 7) {
    print(a);
    let next = a + b;
    a = b;
    b = next;
    i = i + 1;
}
"""
res = get("run_script")(fib_script)
expect("runs Fibonacci loop script end to end", lambda: res["output"], [0, 1, 1, 2, 3, 5, 8])
check("compiles to flat bytecode ending in HALT", lambda: isinstance(res["bytecode"], list) and len(res["bytecode"]) > 5 and res["bytecode"][-1] == ("HALT",))

branch_script = """
let x = (2 + 3) * 4 - 6;
if (x >= 14) {
    print(x / 2);
} else {
    print(0);
}
"""
expect("evaluates precedence, comparison, and if/else", lambda: get("run_script")(branch_script)["output"], [7])
```

## Hidden checks

```python
nested_script = """
let total = 0;
let n = 1;
while (n <= 6) {
    if (n / 2 * 2 == n) {
        total = total + n;
    }
    n = n + 1;
}
print(total);
"""
expect("sums even numbers 2 + 4 + 6 = 12", lambda: get("run_script")(nested_script)["output"], [12])

def syntax_err():
    try:
        get("run_script")("let x = 1 + ;")
        return False
    except SyntaxError:
        return True
check("malformed syntax raises SyntaxError", syntax_err)

def inf_loop():
    try:
        get("run_script")("while (1 == 1) { let x = 1; }", max_steps=100)
        return False
    except RuntimeError:
        return True
check("infinite loop trips max_steps RuntimeError", inf_loop)
```

## Solution

```python
KEYWORDS = {"let", "if", "else", "while", "print"}
TWO_OPS = {"==", "!=", "<=", ">="}
ONE_OPS = set("+-*/=<>")
PUNCT = set("(){},;")
BIN_OPS = {
    "+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV",
    "==": "EQ", "!=": "NEQ", "<": "LT", "<=": "LE", ">": "GT", ">=": "GE",
}


def _lex(source):
    tokens = []
    i = 0
    n = len(source)
    while i < n:
        ch = source[i]
        if ch.isspace():
            i += 1
        elif ch == "#":
            while i < n and source[i] != "\n":
                i += 1
        elif ch.isdigit():
            s = i
            while i < n and source[i].isdigit():
                i += 1
            tokens.append(("NUM", int(source[s:i])))
        elif ch.isalpha() or ch == "_":
            s = i
            while i < n and (source[i].isalnum() or source[i] == "_"):
                i += 1
            w = source[s:i]
            tokens.append(("KW" if w in KEYWORDS else "IDENT", w))
        elif source[i : i + 2] in TWO_OPS:
            tokens.append(("OP", source[i : i + 2]))
            i += 2
        elif ch in ONE_OPS:
            tokens.append(("OP", ch))
            i += 1
        elif ch in PUNCT:
            tokens.append(("PUNCT", ch))
            i += 1
        else:
            raise SyntaxError(f"unexpected character: {ch!r}")
    return tokens


class _Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    def peek(self):
        return self.tokens[self.pos] if self.pos < len(self.tokens) else None

    def expect(self, kind, value=None):
        tok = self.peek()
        if tok is None or tok[0] != kind or (value is not None and tok[1] != value):
            raise SyntaxError(f"expected {(kind, value)}, got {tok}")
        self.pos += 1
        return tok[1]

    def parse_program(self):
        stmts = []
        while self.peek() is not None:
            stmts.append(self.parse_stmt())
        return stmts

    def parse_block(self):
        self.expect("PUNCT", "{")
        stmts = []
        while self.peek() != ("PUNCT", "}"):
            if self.peek() is None:
                raise SyntaxError("unclosed '{'")
            stmts.append(self.parse_stmt())
        self.expect("PUNCT", "}")
        return stmts

    def parse_stmt(self):
        tok = self.peek()
        if tok == ("KW", "let"):
            self.pos += 1
            name = self.expect("IDENT")
            self.expect("OP", "=")
            expr = self.parse_expr()
            self.expect("PUNCT", ";")
            return ("assign", name, expr)
        if tok is not None and tok[0] == "IDENT":
            name = self.expect("IDENT")
            self.expect("OP", "=")
            expr = self.parse_expr()
            self.expect("PUNCT", ";")
            return ("assign", name, expr)
        if tok == ("KW", "print"):
            self.pos += 1
            self.expect("PUNCT", "(")
            expr = self.parse_expr()
            self.expect("PUNCT", ")")
            self.expect("PUNCT", ";")
            return ("print", expr)
        if tok == ("KW", "if"):
            self.pos += 1
            self.expect("PUNCT", "(")
            cond = self.parse_expr()
            self.expect("PUNCT", ")")
            then_body = self.parse_block()
            else_body = []
            if self.peek() == ("KW", "else"):
                self.pos += 1
                else_body = self.parse_block()
            return ("if", cond, then_body, else_body)
        if tok == ("KW", "while"):
            self.pos += 1
            self.expect("PUNCT", "(")
            cond = self.parse_expr()
            self.expect("PUNCT", ")")
            body = self.parse_block()
            return ("while", cond, body)
        raise SyntaxError(f"unexpected token in statement: {tok}")

    def parse_expr(self):
        left = self.parse_add()
        if self.peek() is not None and self.peek()[0] == "OP" and self.peek()[1] in ("==", "!=", "<", "<=", ">", ">="):
            op = self.tokens[self.pos][1]
            self.pos += 1
            right = self.parse_add()
            return ("bin", op, left, right)
        return left

    def parse_add(self):
        left = self.parse_mul()
        while self.peek() in (("OP", "+"), ("OP", "-")):
            op = self.tokens[self.pos][1]
            self.pos += 1
            left = ("bin", op, left, self.parse_mul())
        return left

    def parse_mul(self):
        left = self.parse_unary()
        while self.peek() in (("OP", "*"), ("OP", "/")):
            op = self.tokens[self.pos][1]
            self.pos += 1
            left = ("bin", op, left, self.parse_unary())
        return left

    def parse_unary(self):
        if self.peek() == ("OP", "-"):
            self.pos += 1
            return ("neg", self.parse_unary())
        return self.parse_primary()

    def parse_primary(self):
        tok = self.peek()
        if tok is None:
            raise SyntaxError("unexpected end of expression")
        if tok[0] == "NUM":
            self.pos += 1
            return ("num", tok[1])
        if tok[0] == "IDENT":
            self.pos += 1
            return ("var", tok[1])
        if tok == ("PUNCT", "("):
            self.pos += 1
            node = self.parse_expr()
            self.expect("PUNCT", ")")
            return node
        raise SyntaxError(f"unexpected token in expression: {tok}")


def _fold(node):
    tag = node[0]
    if tag in ("num", "var"):
        return node
    if tag == "neg":
        c = _fold(node[1])
        return ("num", -c[1]) if c[0] == "num" else ("neg", c)
    if tag == "bin":
        _, op, l, r = node
        fl, fr = _fold(l), _fold(r)
        if fl[0] == "num" and fr[0] == "num":
            lv, rv = fl[1], fr[1]
            if op == "+": return ("num", lv + rv)
            if op == "-": return ("num", lv - rv)
            if op == "*": return ("num", lv * rv)
            if op == "/" and rv != 0: return ("num", lv // rv)
        return ("bin", op, fl, fr)
    return node


def _compile(stmts):
    code = []

    def emit_expr(node):
        n = _fold(node)
        tag = n[0]
        if tag == "num":
            code.append(("PUSH", n[1]))
        elif tag == "var":
            code.append(("LOAD", n[1]))
        elif tag == "neg":
            emit_expr(n[1])
            code.append(("NEG",))
        elif tag == "bin":
            emit_expr(n[2])
            emit_expr(n[3])
            code.append((BIN_OPS[n[1]],))

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
            jf = len(code)
            code.append(("JMP_IF_FALSE", -1))
            for s in then_body:
                emit_stmt(s)
            if else_body:
                je = len(code)
                code.append(("JMP", -1))
                code[jf] = ("JMP_IF_FALSE", len(code))
                for s in else_body:
                    emit_stmt(s)
                code[je] = ("JMP", len(code))
            else:
                code[jf] = ("JMP_IF_FALSE", len(code))
        elif tag == "while":
            _, cond, body = stmt
            loop_start = len(code)
            emit_expr(cond)
            je = len(code)
            code.append(("JMP_IF_FALSE", -1))
            for s in body:
                emit_stmt(s)
            code.append(("JMP", loop_start))
            code[je] = ("JMP_IF_FALSE", len(code))

    for s in stmts:
        emit_stmt(s)
    code.append(("HALT",))
    return code


def _run_vm(code, max_steps):
    stack, env, output = [], {}, []
    ip = 0
    steps = 0
    while 0 <= ip < len(code):
        steps += 1
        if steps > max_steps:
            raise RuntimeError("step limit exceeded")
        instr = code[ip]
        ip += 1
        op = instr[0]
        if op == "PUSH": stack.append(instr[1])
        elif op == "LOAD":
            if instr[1] not in env:
                raise NameError(f"undefined variable: {instr[1]}")
            stack.append(env[instr[1]])
        elif op == "STORE": env[instr[1]] = stack.pop()
        elif op == "PRINT": output.append(stack.pop())
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
            if not stack.pop():
                ip = instr[1]
        elif op == "HALT":
            break
    return env, output


def run_script(source, max_steps=10000):
    tokens = _lex(source)
    stmts = _Parser(tokens).parse_program()
    code = _compile(stmts)
    env, output = _run_vm(code, max_steps)
    return {"output": output, "vars": env, "bytecode": code}
```

## Restored

Source text lexes, parses, constant-folds, compiles to flat stack bytecode, and executes safely on your own virtual machine. The engine room is online!
