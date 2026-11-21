---
id: string-literals
kind: code
title: Scan escaped string literals
system: Lexer bench
symbol: instrument
scene: tests
skills: parsing
---

## Briefing

Quoted strings are where naive `split('"')` lexers fall apart immediately — because `\"` puts a quote *inside* the string, `\\"` puts a literal backslash *right before* the closing quote, and an unclosed quote must produce a clear `SyntaxError`!

## Objective

Write `parse_string_literal(source)` where `source` begins with `'"'` and ends with the matching closing `'"'` (no extra trailing characters after the closing quote):

- Decode escape sequences inside the quotes:
  - `\n` -> newline (`"\n"`)
  - `\t` -> tab (`"\t"`)
  - `\"` -> double quote (`'"'`)
  - `\\` -> single backslash (`"\\"`)
- Raise `SyntaxError` if:
  - `source` does not start with `'"'`
  - An unknown escape like `\q` appears
  - A trailing lone `\` or missing closing `'"'` occurs (unterminated string)
  - Non-whitespace characters follow the closing quote (or any characters follow it!)

```python
parse_string_literal(r'"hello \"ridge\"\n"')  # 'hello "ridge"\n'
parse_string_literal(r'"path\\"' )             # 'path\\'
```

## Concept

Look at `r'"path\\"'`: a naive check like `if source[i-1] != '\\'` thinks the closing `"` is escaped — when actually the `\` was escaped by the preceding `\`! Scanning character by character and consuming **both** characters of every `\x` escape pair in one step handles `\\"` effortlessly without ever looking backward!

## Hints

1. Start at `i = 1` (after validating `source.startswith('"')`).
2. When `source[i] == "\\"`: check `i + 1 < len(source)`, map `source[i + 1]` through `ESCAPES`, append it, and advance `i += 2`!
3. When `source[i] == '"'`: verify `i == len(source) - 1` (nothing left after the closing quote) and return `"".join(out)`.

## Starter: guided

```python
ESCAPES = {"n": "\n", "t": "\t", '"': '"', "\\": "\\"}


def parse_string_literal(source):
    if not source or source[0] != '"':
        raise SyntaxError("string literal must start with '\"'")
    out = []
    i = 1
    while i < len(source):
        ch = source[i]
        if ch == "\\":
            # TODO: decode ESCAPES[source[i+1]] or raise SyntaxError, advance i += 2
            break
        elif ch == '"':
            # TODO: ensure we are at the very end of source, then return "".join(out)
            break
        else:
            out.append(ch)
            i += 1
    raise SyntaxError("unterminated string literal")
```

## Starter: standard

```python
def parse_string_literal(source):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("decodes escaped quotes and newlines", lambda: get("parse_string_literal")(r'"hi \"kr\"\nline2"'), 'hi "kr"\nline2')
expect("handles escaped backslash right before closing quote", lambda: get("parse_string_literal")(r'"dir\\"'), "dir\\")
def rejects(bad):
    try:
        get("parse_string_literal")(bad)
        return False
    except SyntaxError:
        return True
check("rejects unterminated string", lambda: rejects(r'"oops\"'))
check("rejects unknown escape sequence", lambda: rejects(r'"\q"'))
```

## Hidden checks

```python
expect("empty string literal", lambda: get("parse_string_literal")('""'), "")
def rejects(bad):
    try:
        get("parse_string_literal")(bad)
        return False
    except SyntaxError:
        return True
check("rejects trailing characters after closing quote", lambda: rejects('"ok"extra'))
```

## Solution

```python
ESCAPES = {"n": "\n", "t": "\t", '"': '"', "\\": "\\"}


def parse_string_literal(source):
    if not source or source[0] != '"':
        raise SyntaxError("string literal must start with '\"'")
    out = []
    i = 1
    while i < len(source):
        ch = source[i]
        if ch == "\\":
            if i + 1 >= len(source) or source[i + 1] not in ESCAPES:
                raise SyntaxError("invalid escape sequence")
            out.append(ESCAPES[source[i + 1]])
            i += 2
        elif ch == '"':
            if i != len(source) - 1:
                raise SyntaxError("unexpected characters after closing quote")
            return "".join(out)
        else:
            out.append(ch)
            i += 1
    raise SyntaxError("unterminated string literal")
```

## Restored

Escaped quotes, escaped backslashes before closing quotes, and malformed literals all scan cleanly with zero lookbehind bugs.
