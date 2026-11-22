---
id: surrogate-invalidation
title: Purge CDN entries instantly with surrogate keys
system: Edge cache
symbol: equipment
scene: tests
skills: cdn-caching
---

## Briefing

When an article or video updates, purging the entire CDN cache causes a thundering herd against your origin — while purging URL-by-URL misses thumbnails, playlists, and JSON feeds! Modern CDNs tag cached responses with **surrogate keys** (like `"video:42"` or `"author:ada"`) so one tag purge instantly invalidates every dependent URL in $O(k)$ time.

## Concept

Implement `SurrogateCache`:
- `set(url, value, tags)`: stores `value` at `url` associated with the iterable of string `tags`. If `url` already existed with old tags, clean up its old reverse-index entries first so stale tag references never linger!
- `get(url)` -> returns `value` or `None`.
- `purge_tag(tag)` -> removes every URL carrying `tag`, cleans up all of their remaining tag reverse-index mappings, and returns a **sorted** list of purged URLs!
- `purge_prefix(prefix)` -> removes every URL starting with `prefix` (also cleaning up tag indexes) and returns a **sorted** list of purged URLs.

## Objective

Implement `SurrogateCache` with `set`, `get`, `purge_tag`, and `purge_prefix`.

## Hints

1. Maintain both `self.url_tags[url] = set(tags)` and `self.tag_urls[tag] = set_of_urls`.
2. Write a shared `_remove_url(url)` helper that deletes `url` from `self.values`, `self.url_tags`, and every tag bucket in `self.tag_urls` (deleting empty buckets too).

## Starter: guided

```python
class SurrogateCache:
    def __init__(self):
        self.values = {}
        self.url_tags = {}
        self.tag_urls = {}

    def _remove_url(self, url):
        pass

    def set(self, url, value, tags=()):
        pass

    def get(self, url):
        return self.values.get(url)

    def purge_tag(self, tag):
        pass

    def purge_prefix(self, prefix):
        pass
```

## Starter: standard

```python
class SurrogateCache:
    def __init__(self):
        pass

    def set(self, url, value, tags=()):
        pass

    def get(self, url):
        pass

    def purge_tag(self, tag):
        pass

    def purge_prefix(self, prefix):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _surrogate():
    c = get("SurrogateCache")()
    c.set("/v/42/index.m3u8", "m3u8", ["video:42", "feed"])
    c.set("/v/42/thumb.jpg", "jpg", ["video:42"])
    c.set("/v/99/index.m3u8", "m3u8-99", ["video:99", "feed"])
    p1 = c.purge_tag("video:42")
    p2 = c.purge_tag("feed")  # only /v/99/index.m3u8 should remain!
    return (p1, p2, c.get("/v/42/thumb.jpg"), c.get("/v/99/index.m3u8"))
expect("purges all URLs matching a surrogate tag and cleans reverse indexes", _surrogate, (
    ["/v/42/index.m3u8", "/v/42/thumb.jpg"],
    ["/v/99/index.m3u8"],
    None,
    None,
))
```

## Hidden checks

```python
def _retag_and_prefix():
    c = get("SurrogateCache")()
    c.set("/img/1.png", "v1", ["old"])
    c.set("/img/1.png", "v2", ["new"])
    p_old = c.purge_tag("old")  # must not purge because tag was replaced!
    c.set("/img/2.png", "v2b", ["new"])
    c.set("/api/status", "ok", ["api"])
    p_pref = c.purge_prefix("/img/")
    return (p_old, p_pref, c.get("/api/status"), c.purge_tag("new"))
expect("replacing tags removes old index links and prefix purge cleans tags", _retag_and_prefix, (
    [],
    ["/img/1.png", "/img/2.png"],
    "ok",
    [],
))
```

## Solution

```python
class SurrogateCache:
    def __init__(self):
        self.values = {}
        self.url_tags = {}
        self.tag_urls = {}

    def _remove_url(self, url):
        self.values.pop(url, None)
        old_tags = self.url_tags.pop(url, set())
        for t in old_tags:
            urls = self.tag_urls.get(t)
            if urls is not None:
                urls.discard(url)
                if not urls:
                    del self.tag_urls[t]

    def set(self, url, value, tags=()):
        if url in self.values:
            self._remove_url(url)
        tag_set = set(tags)
        self.values[url] = value
        self.url_tags[url] = tag_set
        for t in tag_set:
            self.tag_urls.setdefault(t, set()).add(url)

    def get(self, url):
        return self.values.get(url)

    def purge_tag(self, tag):
        targets = sorted(self.tag_urls.get(tag, ()))
        for url in targets:
            self._remove_url(url)
        return targets

    def purge_prefix(self, prefix):
        targets = sorted(u for u in self.values if u.startswith(prefix))
        for url in targets:
            self._remove_url(url)
        return targets
```

## Restored

The edge cache now invalidates dependent media assets instantaneously via surrogate keys.
