---
id: parse-precedence
kind: code
title: Recursive-descent expression parser
system: Parser table
symbol: controller
scene: tests
skills: parsing
---

## Briefing

`2 + 3 * 4` means `2 + (3 * 4)`, and `10 - 3 - 2` means `(10 - 3) - 2` (left-associative, not `10 - (3 - 2)`!). A **recursive-descent parser** encodes operator precedence right into its function call hierarchy:

```text
expr   -> term   ( ("+" | "-") term )*
term   -> unary  ( ("*" | "/") unary )*
unary  -> "-" unary | primary
primary -> NUMBER | IDENT | "(" expr ")"
```

## Objective

Write `parse_expr(source)` that tokenizes `source` (integers, identifiers, `+`, `-`, `*`, `/`, `(`, `)`, ignoring whitespace) and parses it into an Abstract Syntax Tree (AST) made of tuples:

- `("num", int_val)`
- `("var", name)`
- `("neg", operand_ast)`
- `("bin", op, left_ast, right_ast)`

Raise `SyntaxError` on empty input, unmatched parentheses, unexpected tokens, or leftover trailing tokens!

```python
parse_expr("2 + 3 * x")
# ("bin", "+", ("num", 2), ("bin", "*", ("num", 3), ("var", "x")))
```

## Concept

Why does `expr -> term (("+" | "-") term)*` automatically give `*` higher precedence than `+` AND left-associativity for `-`?
- Because `expr` parses each `term` completely *before* combining with `+`/`-`, so `3 * 4` groups tighter than `+`!
- Because the `while` loop builds `left = ("bin", op, left, right)` from left to right, `10 - 3 - 2` builds `("bin", "-", ("bin", "-", 10, 3), 2)`!

## Hints

1. Keep a tiny `Parser` class with `self.tokens` and `self.pos = 0`, plus `peek()` and `consume()`.
2. After parsing `ast = parser.expr()`, verify `parser.pos == len(parser.tokens)` — otherwise raise `SyntaxError("unexpected trailing token")`!

## Starter: guided

```python
class _Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    def peek(self):
        return self.tokens[self.pos] if self.pos < len(self.tokens) else None

    def expr(self):
        left = self.term()
        while self.peek() in (("OP", "+"), ("OP", "-")):
            op = self.tokens[self.pos][1]
            self.pos += 1
            right = self.term()
            left = ("bin", op, left, right)
        return left

    def term(self):
        # TODO: parse unary, then while ("OP", "*") or ("OP", "/") combine left-associatively
        pass

    def unary(self):
        # TODO: if ("OP", "-") consume and return ("neg", self.unary()), else self.primary()
        pass

    def primary(self):
        # TODO: NUM -> ("num", v), IDENT -> ("var", v), "(" expr ")" -> inner, else SyntaxError
        pass


def parse_expr(source):
    # TODO: tokenize source, parse expr, ensure all tokens consumed
    pass
```

## Starter: standard

```python
def parse_expr(source):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "respects * tighter than +",
    lambda: get("parse_expr")("2 + 3 * x"),
    ("bin", "+", ("num", 2), ("bin", "*", ("num", 3), ("var", "x"))),
)
expect(
    "left-associative subtraction",
    lambda: get("parse_expr")("10 - 3 - 2"),
    ("bin", "-", ("bin", "-", ("num", 10), ("num", 3)), ("num", 2)),
)
expect(
    "parentheses and unary minus",
    lambda: get("parse_expr")("-(a + 1) * 2"),
    ("bin", "*", ("neg", ("bin", "+", ("var", "a"), ("num", 1))), ("num", 2)),
)
```

## Hidden checks

```python
def rejects(bad):
    try:
        get("parse_expr")(bad)
        return False
    except SyntaxError:
        return True
check("unclosed paren raises SyntaxError", lambda: rejects("(1 + 2"))
check("trailing junk raises SyntaxError", lambda: rejects("1 + 2 3"))
check("empty input raises SyntaxError", lambda: rejects("   "))
```

## Solution

```python
def _lex(source):
    tokens = []
    i = 0
    n = len(source)
    while i < n:
        ch = source[i]
        if ch.isspace():
            i += 1
        elif ch.isdigit():
            start = i
            while i < n and source[i].isdigit():
                i += 1
            tokens.append(("NUM", int(source[start:i])))
        elif ch.isalpha() or ch == "_":
            start = i
            while i < n and (source[i].isalnum() or source[i] == "_"):
                i += 1
            tokens.append(("IDENT", source[start:i]))
        elif ch in "+-*/":
            tokens.append(("OP", ch))
            i += 1
        elif ch in "()":
            tokens.append(("PUNCT", ch))
            i += 1
        else:
            raise SyntaxError(f"unexpected char: {ch!r}")
    return tokens


class _Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    def peek(self):
        return self.tokens[self.pos] if self.pos < len(self.tokens) else None

    def expr(self):
        left = self.term()
        while self.peek() in (("OP", "+"), ("OP", "-")):
            op = self.tokens[self.pos][1]
            self.pos += 1
            left = ("bin", op, left, self.term())
        return left

    def term(self):
        left = self.unary()
        while self.peek() in (("OP", "*"), ("OP", "/")):
            op = self.tokens[self.pos][1]
            self.pos += 1
            left = ("bin", op, left, self.unary())
        return left

    def unary(self):
        if self.peek() == ("OP", "-"):
            self.pos += 1
            return ("neg", self.unary())
        return self.primary()

    def primary(self):
        tok = self.peek()
        if tok is None:
            raise SyntaxError("unexpected end of input")
        kind, val = tok
        if kind == "NUM":
            self.pos += 1
            return ("num", val)
        if kind == "IDENT":
            self.pos += 1
            return ("var", val)
        if tok == ("PUNCT", "("):
            self.pos += 1
            node = self.expr()
            if self.peek() != ("PUNCT", ")"):
                raise SyntaxError("expected ')'")
            self.pos += 1
            return node
        raise SyntaxError(f"unexpected token: {tok!r}")


def parse_expr(source):
    tokens = _lex(source)
    if not tokens:
        raise SyntaxError("empty expression")
    parser = _Parser(tokens)
    node = parser.expr()
    if parser.pos != len(tokens):
        raise SyntaxError("unexpected trailing tokens")
    return node
```

## Restored

Precedence, left-associativity, unary negation, and nested parentheses all parse cleanly into exact AST tuples.
