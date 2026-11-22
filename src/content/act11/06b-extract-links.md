---
id: extract-links
kind: code
title: Parse HTML and resolve links
system: Crawler desk
symbol: instrument
scene: tests
skills: crawling
---

## Briefing

Regexes break fast on HTML (comments, multiline attributes, single vs double quotes, uppercase `<A HREF=...>`). Python's standard library includes a real HTML tokenizer (`html.parser.HTMLParser`) plus RFC-compliant relative URL resolution (`urllib.parse.urljoin`).

## Objective

Write `extract_links(html_text, base_url)`:

- Parse `html_text` with `html.parser.HTMLParser` (not a regex!).
- For every `<a>` tag that has a non-empty `href` attribute:
  - Strip whitespace from `href`.
  - Skip fragment-only links (`href.startswith("#")`) and non-HTTP schemes (`mailto:`, `javascript:`, `tel:`, etc.).
  - Resolve relative paths against `base_url` with `urllib.parse.urljoin(base_url, href)`.
  - Drop any `#fragment` from the resolved URL (`urldefrag(resolved).url`).
  - Keep only resolved URLs whose scheme is `"http"` or `"https"`.
- Return the resolved URLs as a `list[str]` in document order (preserving duplicates if a page links twice — the crawler counts inbound links!).

```python
extract_links('<a href="/logs/1">Day 1</a><a href="day2.html#s">Day 2</a>', "https://ridge.local/logs/")
# ["https://ridge.local/logs/1", "https://ridge.local/logs/day2.html"]
```

## Concept

`HTMLParser` automatically ignores `<!-- <a href="fake"> -->` HTML comments, handles both single and double quotes, decodes HTML entities (`&amp;` -> `&`) inside `href`, and normalizes tag/attribute names to lowercase! Pairing it with `urllib.parse.urljoin` handles `/root-relative`, `sibling.html`, and `../parent/` paths effortlessly.

## Hints

1. Subclass `HTMLParser` and override `handle_starttag(self, tag, attrs)`: when `tag == "a"`, look up `href` in `dict(attrs)`.
2. Check `if not href or href.startswith("#"): continue`, resolve with `urljoin(base_url, href)`, strip fragments with `urldefrag(resolved).url`, and verify `urlsplit(clean).scheme in ("http", "https")`.

## Starter: guided

```python
from html.parser import HTMLParser
from urllib.parse import urldefrag, urljoin, urlsplit


class _LinkCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            for name, val in attrs:
                if name == "href" and val:
                    self.hrefs.append(val.strip())


def extract_links(html_text, base_url):
    parser = _LinkCollector()
    parser.feed(html_text)
    out = []
    for href in parser.hrefs:
        # TODO: skip '#' links, resolve with urljoin, strip fragment, keep http/https
        pass
    return out
```

## Starter: standard

```python
from html.parser import HTMLParser
from urllib.parse import urldefrag, urljoin, urlsplit


def extract_links(html_text, base_url):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
html = """
<html><body>
  <!-- <a href="/commented-out">nope</a> -->
  <a href="/logs/1">Day 1</a>
  <A HREF='day2.html#section'>Day 2</A>
  <a href="mailto:ops@ridge.local">Mail</a>
  <a href="#top">Top</a>
  <a href="https://valley.local/status?a=1&amp;b=2">Valley</a>
</body></html>
"""
expect(
    "resolves relative links, decodes entities, ignores comments/mailto/fragments",
    lambda: get("extract_links")(html, "https://ridge.local/logs/"),
    [
        "https://ridge.local/logs/1",
        "https://ridge.local/logs/day2.html",
        "https://valley.local/status?a=1&b=2",
    ],
)
```

## Hidden checks

```python
expect("handles parent directory ../ resolution", lambda: get("extract_links")('<a href="../index.html">Home</a>', "https://ridge.local/a/b/page.html"), ["https://ridge.local/a/index.html"])
expect("skips javascript: links", lambda: get("extract_links")('<a href="javascript:alert(1)">x</a>', "https://ridge.local/"), [])
```

## Solution

```python
from html.parser import HTMLParser
from urllib.parse import urldefrag, urljoin, urlsplit


class _LinkCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            for name, val in attrs:
                if name == "href" and val:
                    self.hrefs.append(val.strip())


def extract_links(html_text, base_url):
    parser = _LinkCollector()
    parser.feed(html_text)
    out = []
    for href in parser.hrefs:
        if not href or href.startswith("#"):
            continue
        resolved = urldefrag(urljoin(base_url, href)).url
        if urlsplit(resolved).scheme.lower() in ("http", "https"):
            out.append(resolved)
    return out
```

## Restored

Real HTML parsing resolves relative links cleanly while ignoring comments, `mailto:`, and `javascript:` traps.
