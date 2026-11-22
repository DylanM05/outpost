---
id: markdown-blocks
kind: code
title: Compile Markdown to safe HTML
system: Lexer bench
symbol: instrument
scene: tests
skills: parsing
---

## Briefing

Document compilers (like static site generators) split text into **blocks** first, then parse **inline** spans inside each block — while HTML-escaping untrusted `<` and `&` characters so raw HTML tags can't sneak through!

## Objective

Write `markdown_to_html(text)` converting a subset of Markdown into HTML (joining rendered blocks with `"\n"`):

1. Split `text` into blocks separated by one or more blank lines (`\n\n`). Ignore empty blocks.
2. Block types:
   - Heading: starts with `# `, `## `, or `### ` -> `<h1>...</h1>`, `<h2>...</h2>`, `<h3>...</h3>`.
   - Unordered list: every non-empty line in the block starts with `"- "` -> `<ul><li>...</li>...</ul>`.
   - Paragraph: anything else -> `<p>...</p>` (join multi-line paragraphs with a single space `" "`).
3. Inside every block's text, **first** HTML-escape `&`, `<`, `>` (via `html.escape(s, quote=False)`), **then** convert inline formatting:
   - `` `code` `` -> `<code>code</code>`
   - `**bold**` -> `<strong>bold</strong>`

```python
markdown_to_html("# Ridge\n\nCheck **power** & `status`.")
# "<h1>Ridge</h1>\n<p>Check <strong>power</strong> &amp; <code>status</code>.</p>"
```

## Concept

Notice the exact pipeline order: **Block structure -> HTML escape -> Inline spans**. Escaping *before* inserting `<strong>` and `<code>` ensures user-typed `<script>` turns into harmless `&lt;script&gt;` while your own generated HTML tags stay valid!

## Hints

1. Split blocks with `re.split(r"\n\s*\n", text.strip())`.
2. For inline conversion on already-escaped text: `re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)` and `re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", ...)`.

## Starter: guided

```python
import html
import re


def _inline(text):
    safe = html.escape(text, quote=False)
    safe = re.sub(r"`([^`]+)`", r"<code>\1</code>", safe)
    safe = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", safe)
    return safe


def markdown_to_html(text):
    if not text.strip():
        return ""
    blocks = re.split(r"\n\s*\n", text.strip())
    rendered = []
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        # TODO: detect heading (#/##/###), unordered list (- ), or paragraph
        pass
    return "\n".join(rendered)
```

## Starter: standard

```python
import html
import re


def markdown_to_html(text):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
md = """# Outpost Guide

Check **power** & `status.py` for <alerts>.

- Inspect **beacon**
- Run `logscan`"""

expect(
    "renders headings, paragraphs, lists, inline spans, and escapes raw HTML",
    lambda: get("markdown_to_html")(md),
    "<h1>Outpost Guide</h1>\n"
    "<p>Check <strong>power</strong> &amp; <code>status.py</code> for &lt;alerts&gt;.</p>\n"
    "<ul><li>Inspect <strong>beacon</strong></li><li>Run <code>logscan</code></li></ul>",
)
```

## Hidden checks

```python
expect("h2 and h3 headings", lambda: get("markdown_to_html")("## Two\n\n### Three"), "<h2>Two</h2>\n<h3>Three</h3>")
expect("empty markdown returns empty string", lambda: get("markdown_to_html")("   \n\n  "), "")
```

## Solution

```python
import html
import re


def _inline(text):
    safe = html.escape(text, quote=False)
    safe = re.sub(r"`([^`]+)`", r"<code>\1</code>", safe)
    safe = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", safe)
    return safe


def markdown_to_html(text):
    if not text.strip():
        return ""
    blocks = re.split(r"\n\s*\n", text.strip())
    rendered = []
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        if len(lines) == 1 and re.match(r"^(#{1,3}) (.+)$", lines[0]):
            m = re.match(r"^(#{1,3}) (.+)$", lines[0])
            lvl = len(m.group(1))
            rendered.append(f"<h{lvl}>{_inline(m.group(2))}</h{lvl}>")
        elif all(line.startswith("- ") for line in lines):
            items = "".join(f"<li>{_inline(line[2:])}</li>" for line in lines)
            rendered.append(f"<ul>{items}</ul>")
        else:
            rendered.append(f"<p>{_inline(' '.join(lines))}</p>")
    return "\n".join(rendered)
```

## Restored

Station manuals compile cleanly from Markdown to escaped HTML blocks and inline spans.
