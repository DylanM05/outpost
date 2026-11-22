---
id: graphql-parser
title: Parse GraphQL selection sets with arguments and nested sub-fields
system: Graph rail
symbol: controller
scene: tests
skills: graphql-batching
---

## Briefing

GraphQL lets clients declare the exact shape of JSON they need:
```graphql
{ user(id: 7) { name posts { title } } }
```
Before executing a query or checking its nesting depth, the server parses the selection tree into a clean AST!

## Concept

Write `parse_gql_query(query_str)` parsing a GraphQL selection set (optionally prefixed by `query`, with commas treated as whitespace!):
- Supported syntax:
  - Optional leading keyword `query` before the outer `{ ... }`.
  - Fields inside `{ ... }`: `name` with optional `(arg1: val1, arg2: val2)` and optional nested `{ ... }`.
  - Argument values: integers (`7`, `-3`), double-quoted strings (`"ada"`), booleans (`true`, `false`), or `null`.
- AST node format for a selection set: a list of field dicts:
  `{"name": str, "args": dict, "fields": list | None}`
  (where `"fields"` is `None` for leaf scalar fields and a non-empty `list` for nested selection sets!).
- Raise `ValueError` on syntax errors (unbalanced braces, empty selection set `{}`, trailing junk, malformed args).

## Objective

Implement `parse_gql_query(query_str)` returning the top-level list of field AST dicts.

## Hints

1. Tokenize with a tiny regex matching `{`, `}`, `(`, `)`, `:`, `"[^"]*"`, `-?\d+`, and `[A-Za-z_][A-Za-z0-9_]*` (skipping whitespace and commas `,`, which GraphQL treats as insignificant whitespace!).
2. A recursive-descent helper `parse_selection_set()` consumes `{`, parses one or more fields until `}`, and requires `pos == len(tokens)` at the end.

## Starter: guided

```python
import re

_TOKEN_RE = re.compile(r'\s*(?:,|(\{|\}|\(|\)|:)|"([^"]*)"|(-?\d+)|([A-Za-z_][A-Za-z0-9_]*)|(\S))')


def parse_gql_query(query_str):
    # Tokenize and recursively parse { field(arg: val) { ... } } into AST dicts.
    pass
```

## Starter: standard

```python
import re


def parse_gql_query(query_str):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _nested():
    q = 'query { user(id: 7, active: true) { name, posts(limit: 2) { title } } }'
    return get("parse_gql_query")(q)
expect("parses nested GraphQL fields and typed arguments", _nested, [
    {
        "name": "user",
        "args": {"id": 7, "active": True},
        "fields": [
            {"name": "name", "args": {}, "fields": None},
            {
                "name": "posts",
                "args": {"limit": 2},
                "fields": [{"name": "title", "args": {}, "fields": None}],
            },
        ],
    }
])
```

## Hidden checks

```python
expect("parses string and null arguments", lambda: get("parse_gql_query")('{ find(tag: "ops", parent: null) { id } }'), [
    {"name": "find", "args": {"tag": "ops", "parent": None}, "fields": [{"name": "id", "args": {}, "fields": None}]}
])

def _bad_syntax():
    errs = 0
    for q in ["{}", "{ user { name }", "{ user(id: ) }", "not a query"]:
        try:
            get("parse_gql_query")(q)
        except ValueError:
            errs += 1
    return errs
expect("rejects empty selection sets, unclosed braces, and invalid args", _bad_syntax, 4)
```

## Solution

```python
import re

_TOKEN_RE = re.compile(r'(\{|\}|\(|\)|:)|"([^"]*)"|(-?\d+)|([A-Za-z_][A-Za-z0-9_]*)|([\s,]+)|(\S)')


def _tokenize(src):
    tokens = []
    for m in _TOKEN_RE.finditer(src):
        punct, string, num, ident, ws, bad = m.groups()
        if ws:
            continue
        if bad:
            raise ValueError(f"unexpected character: {bad}")
        if punct:
            tokens.append(("PUNCT", punct))
        elif string is not None:
            tokens.append(("STR", string))
        elif num is not None:
            tokens.append(("INT", int(num)))
        elif ident is not None:
            tokens.append(("IDENT", ident))
    return tokens


def parse_gql_query(query_str):
    tokens = _tokenize(query_str)
    pos = 0

    def peek():
        return tokens[pos] if pos < len(tokens) else (None, None)

    def expect_tok(kind, val=None):
        nonlocal pos
        if pos >= len(tokens):
            raise ValueError("unexpected end of query")
        tk, tv = tokens[pos]
        if tk != kind or (val is not None and tv != val):
            raise ValueError(f"expected {val or kind}, got {tv}")
        pos += 1
        return tv

    def parse_value():
        nonlocal pos
        if pos >= len(tokens):
            raise ValueError("expected value")
        tk, tv = tokens[pos]
        pos += 1
        if tk in ("INT", "STR"):
            return tv
        if tk == "IDENT":
            if tv == "true":
                return True
            if tv == "false":
                return False
            if tv == "null":
                return None
        raise ValueError(f"invalid argument value: {tv}")

    def parse_args():
        expect_tok("PUNCT", "(")
        args = {}
        if peek() == ("PUNCT", ")"):
            raise ValueError("empty argument list")
        while True:
            key = expect_tok("IDENT")
            expect_tok("PUNCT", ":")
            args[key] = parse_value()
            if peek() == ("PUNCT", ")"):
                expect_tok("PUNCT", ")")
                return args

    def parse_selection_set():
        expect_tok("PUNCT", "{")
        fields = []
        while peek() != ("PUNCT", "}"):
            if pos >= len(tokens):
                raise ValueError("unclosed '{'")
            name = expect_tok("IDENT")
            args = parse_args() if peek() == ("PUNCT", "(") else {}
            sub = parse_selection_set() if peek() == ("PUNCT", "{") else None
            fields.append({"name": name, "args": args, "fields": sub})
        expect_tok("PUNCT", "}")
        if not fields:
            raise ValueError("empty selection set")
        return fields

    if peek() == ("IDENT", "query"):
        pos += 1
    ast = parse_selection_set()
    if pos != len(tokens):
        raise ValueError("unexpected trailing tokens")
    return ast
```

## Restored

The graph rail now parses nested GraphQL queries with typed arguments into clean selection ASTs.
