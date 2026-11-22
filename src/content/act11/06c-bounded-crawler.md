---
id: bounded-crawler
kind: code
title: Concurrent same-origin web crawler
system: Crawler desk
symbol: instrument
scene: tests
skills: crawling, concurrency
---

## Briefing

Now combine your URL normalizer, HTML link extractor, and bounded worker pool into a real **concurrent same-origin crawler** (just like Boot.dev's *Build a Web Scraper* project)!

## Objective

Write `crawl_site(start_url, fetch_gen, max_pages=10, max_concurrent=3)`:

- `fetch_gen(url)` is a function that returns a **cooperative generator** yielding 0 or more times and returning an HTML string (or raising an exception on 404/network error — failed fetches must not crash the crawl!).
- Normalize URLs to canonical keys (`normalize_url`).
- Stay strictly on the **same hostname** (case-insensitively) as `start_url` — ignore off-domain links completely!
- Track `pages = {}` mapping each visited normalized URL to how many times it has been seen (starting with `pages[norm(start_url)] = 1`).
  - Whenever an extracted same-origin link normalizes to `norm_link`:
    - If `norm_link in pages`: increment `pages[norm_link] += 1` (counting inbound links!) and do **not** queue it again.
    - Else if `len(pages) < max_pages`: set `pages[norm_link] = 1` and queue `link` for fetching!
- Run fetches cooperatively with at most `max_concurrent` active generators at any moment, and return `{"pages": pages, "peak_active": peak_active}`.

## Concept

Notice the crucial **check-and-mark-before-enqueue** pattern:
- If you wait until a page *finishes* downloading before adding it to `pages`, two concurrent workers can both discover `/about` and fetch it twice — or overshoot `max_pages`!
- Marking `pages[norm_link] = 1` the instant you discover it (before queueing the fetch) guarantees every URL is fetched **at most once** and `len(pages)` never exceeds `max_pages`!

## Hints

1. Reuse `normalize_url` and `extract_links` from the previous two missions.
2. Keep `pending = deque([start_url])`, `active = deque()`, `pages = {normalize_url(start_url): 1}`, and `start_host = urlsplit(start_url).hostname.lower()`.
3. In the scheduler loop, whenever `len(active) < max_concurrent and pending`, pop `url` and append `(url, fetch_gen(url))` to `active`. When a generator raises `StopIteration as done`, parse links from `done.value` and enqueue new same-origin URLs while `len(pages) < max_pages`.

## Starter: guided

```python
from collections import deque
from html.parser import HTMLParser
from urllib.parse import urldefrag, urljoin, urlsplit


def _normalize(url):
    p = urlsplit(url.strip())
    scheme = p.scheme.lower()
    host = p.hostname.lower()
    if p.port is not None and not (scheme == "http" and p.port == 80) and not (scheme == "https" and p.port == 443):
        host = f"{host}:{p.port}"
    return f"{host}{p.path.rstrip('/')}" + (f"?{p.query}" if p.query else "")


class _Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            for k, v in attrs:
                if k == "href" and v:
                    self.hrefs.append(v.strip())


def _extract(html_text, base_url):
    p = _Links()
    p.feed(html_text)
    out = []
    for href in p.hrefs:
        if href and not href.startswith("#"):
            res = urldefrag(urljoin(base_url, href)).url
            if urlsplit(res).scheme.lower() in ("http", "https"):
                out.append(res)
    return out


def crawl_site(start_url, fetch_gen, max_pages=10, max_concurrent=3):
    start_host = urlsplit(start_url).hostname.lower()
    pages = {_normalize(start_url): 1}
    pending = deque([start_url])
    active = deque()
    peak_active = 0
    # TODO: run bounded cooperative pool, count inbound links, obey same-origin and max_pages
    return {"pages": pages, "peak_active": peak_active}
```

## Starter: standard

```python
from collections import deque
from html.parser import HTMLParser
from urllib.parse import urldefrag, urljoin, urlsplit


def crawl_site(start_url, fetch_gen, max_pages=10, max_concurrent=3):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
SITE = {
    "https://ridge.local/": '<a href="/a">A</a><a href="/b">B</a><a href="https://valley.local/ext">Ext</a>',
    "https://ridge.local/a": '<a href="/">Home</a><a href="/c">C</a><a href="/b">B</a>',
    "https://ridge.local/b": '<a href="/c">C</a><a href="/broken">Broken</a>',
    "https://ridge.local/c": '<a href="/">Home</a>',
}

def test_crawl():
    fetched = []
    in_flight = [0]
    real_peak = [0]
    def fetch_gen(url):
        fetched.append(url)
        in_flight[0] += 1
        real_peak[0] = max(real_peak[0], in_flight[0])
        try:
            yield
            if url not in SITE:
                raise RuntimeError("404")
            return SITE[url]
        finally:
            in_flight[0] -= 1

    out = get("crawl_site")("https://ridge.local/", fetch_gen, max_pages=10, max_concurrent=2)
    return (out["peak_active"], real_peak[0], out["pages"], len(fetched))

expect(
    "crawls same-origin graph with concurrency <= 2, counts inbound links, skips off-origin, survives 404",
    test_crawl,
    (
        2,
        2,
        {
            "ridge.local": 3,
            "ridge.local/a": 1,
            "ridge.local/b": 2,
            "ridge.local/c": 2,
            "ridge.local/broken": 1,
        },
        5,
    ),
)
```

## Hidden checks

```python
BIG = {f"https://ridge.local/p{i}": f'<a href="/p{i+1}">next</a><a href="/p{i+2}">skip</a>' for i in range(20)}

def test_max_pages():
    def fetch_gen(url):
        yield
        return BIG.get(url, "")
    out = get("crawl_site")("https://ridge.local/p0", fetch_gen, max_pages=4, max_concurrent=3)
    return (len(out["pages"]), out["peak_active"] <= 3)

expect("strictly enforces max_pages=4 without overshoot", test_max_pages, (4, True))
```

## Solution

```python
from collections import deque
from html.parser import HTMLParser
from urllib.parse import urldefrag, urljoin, urlsplit


def _normalize(url):
    p = urlsplit(url.strip())
    scheme = p.scheme.lower()
    host = p.hostname.lower()
    if p.port is not None and not (scheme == "http" and p.port == 80) and not (scheme == "https" and p.port == 443):
        host = f"{host}:{p.port}"
    return f"{host}{p.path.rstrip('/')}" + (f"?{p.query}" if p.query else "")


class _Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            for k, v in attrs:
                if k == "href" and v:
                    self.hrefs.append(v.strip())


def _extract(html_text, base_url):
    p = _Links()
    p.feed(html_text)
    out = []
    for href in p.hrefs:
        if href and not href.startswith("#"):
            res = urldefrag(urljoin(base_url, href)).url
            if urlsplit(res).scheme.lower() in ("http", "https"):
                out.append(res)
    return out


def crawl_site(start_url, fetch_gen, max_pages=10, max_concurrent=3):
    if max_pages < 1 or max_concurrent < 1:
        raise ValueError("limits must be >= 1")
    start_host = urlsplit(start_url).hostname.lower()
    pages = {_normalize(start_url): 1}
    pending = deque([start_url])
    active = deque()
    peak_active = 0

    while active or pending:
        while len(active) < max_concurrent and pending:
            url = pending.popleft()
            active.append((url, fetch_gen(url)))
        peak_active = max(peak_active, len(active))
        url, gen = active.popleft()
        try:
            next(gen)
            active.append((url, gen))
        except StopIteration as done:
            html_text = done.value
            if isinstance(html_text, str):
                for link in _extract(html_text, url):
                    host = (urlsplit(link).hostname or "").lower()
                    if host != start_host:
                        continue
                    norm = _normalize(link)
                    if norm in pages:
                        pages[norm] += 1
                    elif len(pages) < max_pages:
                        pages[norm] = 1
                        pending.append(link)
        except Exception:
            pass

    return {"pages": pages, "peak_active": peak_active}
```

## Restored

The cooperative crawler maps the entire station wiki concurrently without looping, leaking off-origin, or overshooting its concurrency cap.
