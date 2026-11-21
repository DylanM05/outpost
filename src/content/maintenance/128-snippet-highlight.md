---
id: maintenance-snippet-highlight
title: Highlight matched whole words in snippets
system: Search index
symbol: equipment
scene: tests
skills: search-indexing
reviewSkill: search-indexing
prerequisite: tfidf-ranking
---

## Briefing

Search results feel instant when matched query terms stand out in bold — without mangling original capitalization or accidentally highlighting substrings inside longer words (`"log"` must not highlight `"catalog"`).

## Objective

Write `highlight_terms(text, terms)` where `text` is a string and `terms` is an iterable of query words.

Wrap every whole alphanumeric word (`[A-Za-z0-9]+`) in `text` whose lowercased form is in `{t.lower() for t in terms if t}` with `**...**`, preserving original casing and all surrounding punctuation and whitespace.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Build `targets = {t.lower() for t in terms if t}`.
2. Use `re.sub(r"[A-Za-z0-9]+", repl, text)` where `repl(m)` returns `f"**{m.group(0)}**"` if `m.group(0).lower() in targets` else `m.group(0)`.

## Starter

```python
```

## Checks

```python
expect("highlights whole words preserving original case", lambda: get("highlight_terms")("Solar array and SOLAR panel", ["solar"]), "**Solar** array and **SOLAR** panel")
expect("does not highlight partial substrings inside longer words", lambda: get("highlight_terms")("Check catalog log entries.", ["log"]), "Check catalog **log** entries.")
```

## Hidden checks

```python
expect("empty terms leaves text untouched", lambda: get("highlight_terms")("No matches here.", []), "No matches here.")
expect("multiple terms highlighted cleanly", lambda: get("highlight_terms")("Relay-1 online!", ["relay", "ONLINE"]), "**Relay**-1 **online**!")
```

## Solution

```python
import re


def highlight_terms(text, terms):
    targets = {t.lower() for t in terms if t}
    if not targets:
        return text
    return re.sub(
        r"[A-Za-z0-9]+",
        lambda m: f"**{m.group(0)}**" if m.group(0).lower() in targets else m.group(0),
        text,
    )
```

## Restored

Search snippets highlight whole query matches while keeping original casing and punctuation intact.
