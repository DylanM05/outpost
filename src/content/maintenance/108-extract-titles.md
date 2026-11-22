---
id: maintenance-extract-titles
title: Extract page title with HTMLParser
system: Crawler desk
symbol: equipment
scene: tests
skills: crawling
reviewSkill: crawling
prerequisite: bounded-crawler
---

## Briefing

The crawler's index stores each page's `<title>` text, including decoded HTML entities like `&amp;`. Regex breaks on attributes and nested chunks — use Python's `html.parser.HTMLParser`.

## Objective

Write `extract_title(html_text)` returning the trimmed text inside the **first** `<title>...</title>` element (case-insensitive tag matching, with internal whitespace collapsed to single spaces), or `""` if no `<title>` tag is present.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Subclass `html.parser.HTMLParser`, track `in_title` and `done` flags, and collect chunks from `handle_data(data)` while `in_title` is `True`.
2. In `handle_endtag(tag)`, once `tag.lower() == "title"`, set `in_title = False` and `done = True` so later `<title>` tags are ignored. Collapse whitespace with `" ".join(chunks).split()`.

## Starter

```python
```

## Checks

```python
expect("extracts plain title", lambda: get("extract_title")("<html><head><title>Kestrel Ridge</title></head><body>Hi</body></html>"), "Kestrel Ridge")
expect("decodes entities and collapses whitespace", lambda: get("extract_title")("<TITLE lang='en'>  Supply &amp;\n  Relay  </TITLE>"), "Supply & Relay")
expect("returns empty string when missing", lambda: get("extract_title")("<html><body><h1>No Title</h1></body></html>"), "")
```

## Hidden checks

```python
expect("uses only the first title tag", lambda: get("extract_title")("<title>First</title><title>Second</title>"), "First")
expect("handles empty title tag", lambda: get("extract_title")("<title>   </title>"), "")
```

## Solution

```python
from html.parser import HTMLParser


class _TitleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
        self.done = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if not self.done and tag.lower() == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        if self.in_title and tag.lower() == "title":
            self.in_title = False
            self.done = True

    def handle_data(self, data):
        if self.in_title:
            self.parts.append(data)


def extract_title(html_text):
    parser = _TitleParser()
    parser.feed(html_text)
    parser.close()
    return " ".join("".join(parser.parts).split())
```

## Restored

Page titles are extracted cleanly with full HTML entity decoding and whitespace normalization.
