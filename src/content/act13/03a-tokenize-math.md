---
id: tokenize-math
kind: code
title: Write a hand-rolled lexer
system: Lexer bench
symbol: instrument
scene: tests
skills: parsing
---

## Briefing

Every compiler and interpreter starts with a **lexer** (tokenizer): scanning raw source characters left-to-right and grouping them into meaningful **tokens** (`NUMBER`, `IDENT`, `KEYWORD`, `OP`, `PUNCT`), stripping whitespace and comments so the parser never has to think about spaces again!

## Objective

Write `tokenize(source)` scanning `source: str` into a list of `(kind, value)` tuples:

- Skip whitespace (`" "`, `"\t"`, `"\n"`, `"\r"`) and `#` comments (everything from `#` to end of line).
- **Integers:** consecutive ASCII digits -> `("NUM", int(digits))`.
- **Keywords & Identifiers:** starts with letter or `_`, followed by letters/digits/`_`:
  - If in `{"let", "if", "else", "while", "print"}` -> `("KW", word)`.
  - Otherwise -> `("IDENT", word)`.
- **Two-character operators** (match these *before* single-char `=` / `<` / `>`!): `==`, `!=`, `<=`, `>=` -> `("OP", sym)`.
- **Single-character operators:** `+`, `-`, `*`, `/`, `=`, `<`, `>` -> `("OP", ch)`.
- **Punctuation:** `(`, `)`, `{`, `}`, `,`, `;` -> `("PUNCT", ch)`.
- Any other unexpected character (like `@` or `$` or lone `!`) -> raise `SyntaxError`.

```python
tokenize("let x = 10 + 2; # sum")
# [("KW", "let"), ("IDENT", "x"), ("OP", "="), ("NUM", 10), ("OP", "+"), ("NUM", 2), ("PUNCT", ";")]
```

## Concept

Notice the **maximal munch** rule: when the lexer sees `=`, it peeks one character ahead (`source[i : i + 2]`) to check if it's `==` before emitting single `=`. That single 1-character lookahead handles `==`, `!=`, `<=`, and `>=` cleanly!

## Hints

1. Use an index `i = 0` and `while i < len(source):` (easier than `for` because multi-character tokens advance `i` by more than 1!).
2. Check 2-char operators `source[i : i + 2] in ("==", "!=", "<=", ">=")` *before* checking single-char operators!

## Starter: guided

```python
KEYWORDS = {"let", "if", "else", "while", "print"}
TWO_CHAR_OPS = {"==", "!=", "<=", ">="}
ONE_CHAR_OPS = set("+-*/=<>")
PUNCT = set("(){},;")


def tokenize(source):
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
            start = i
            while i < n and source[i].isdigit():
                i += 1
            tokens.append(("NUM", int(source[start:i])))
        # TODO: handle IDENT/KW, TWO_CHAR_OPS, ONE_CHAR_OPS, PUNCT, else raise SyntaxError
        else:
            raise SyntaxError(f"unexpected char: {ch!r}")
    return tokens
```

## Starter: standard

```python
def tokenize(source):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "tokenizes let statement, operators, and comments",
    lambda: get("tokenize")("let x_1 = 42 + 7; # comment\nif (x_1 >= 10) { print(x_1); }"),
    [
        ("KW", "let"), ("IDENT", "x_1"), ("OP", "="), ("NUM", 42), ("OP", "+"), ("NUM", 7), ("PUNCT", ";"),
        ("KW", "if"), ("PUNCT", "("), ("IDENT", "x_1"), ("OP", ">="), ("NUM", 10), ("PUNCT", ")"),
        ("PUNCT", "{"), ("KW", "print"), ("PUNCT", "("), ("IDENT", "x_1"), ("PUNCT", ")"), ("PUNCT", ";"), ("PUNCT", "}"),
    ],
)
def rejects_bad():
    try:
        get("tokenize")("x = 1 @ 2")
        return False
    except SyntaxError:
        return True
check("unexpected character raises SyntaxError", rejects_bad)
```

## Hidden checks

```python
expect("distinguishes == vs = and != vs invalid !", lambda: get("tokenize")("a==b!=c<=d"), [("IDENT", "a"), ("OP", "=="), ("IDENT", "b"), ("OP", "!="), ("IDENT", "c"), ("OP", "<="), ("IDENT", "d")])
def rejects_bang():
    try:
        get("tokenize")("!x")
        return False
    except SyntaxError:
        return True
check("lone '!' raises SyntaxError", rejects_bang)
```

## Solution

```python
KEYWORDS = {"let", "if", "else", "while", "print"}
TWO_CHAR_OPS = {"==", "!=", "<=", ">="}
ONE_CHAR_OPS = set("+-*/=<>")
PUNCT = set("(){},;")


def tokenize(source):
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
            start = i
            while i < n and source[i].isdigit():
                i += 1
            tokens.append(("NUM", int(source[start:i])))
        elif ch.isalpha() or ch == "_":
            start = i
            while i < n and (source[i].isalnum() or source[i] == "_"):
                i += 1
            word = source[start:i]
            tokens.append(("KW" if word in KEYWORDS else "IDENT", word))
        elif source[i : i + 2] in TWO_CHAR_OPS:
            tokens.append(("OP", source[i : i + 2]))
            i += 2
        elif ch in ONE_CHAR_OPS:
            tokens.append(("OP", ch))
            i += 1
        elif ch in PUNCT:
            tokens.append(("PUNCT", ch))
            i += 1
        else:
            raise SyntaxError(f"unexpected character: {ch!r}")
    return tokens
```

## Restored

Source text now flows into a clean, unambiguous token stream with maximal-munch operator lookahead.
