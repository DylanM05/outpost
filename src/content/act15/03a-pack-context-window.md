---
id: pack-context-window
title: Pack retrieved snippets within a token budget
system: Grounding desk
symbol: controller
scene: tests
skills: tokenization-context, vector-rag
---

## Briefing

Retrieving twenty snippets doesn't help if pasting them all blows past the model's context window and truncates the user's question. Assemble a grounded prompt that always keeps the system prompt and user query, then packs as many highest-ranked unique snippets as fit within `max_tokens`.

## Concept

Count tokens deterministically here as whitespace-separated words: `token_count(text) = len(text.split())`.

Format each included snippet as `f"[{doc_id}] {text}"`.
- The base prompt always requires `token_count(system_prompt) + token_count(query)`. If even the base exceeds `max_tokens`, raise `ValueError`.
- Walk `snippets` (a list of `(doc_id, text)` in priority order):
  - Skip duplicate `doc_id`s (keep the first occurrence only).
  - Format `entry = f"[{doc_id}] {text}"`; if `used + token_count(entry) <= max_tokens`, include it and add its tokens to `used`!
  - If a snippet doesn't fit, skip it and check whether a shorter later snippet still fits (greedy packing).

## Objective

Write `pack_context(system_prompt, query, snippets, max_tokens)` returning a dict:
- `"included_ids"`: list of included `doc_id`s in packed order
- `"tokens_used"`: exact total whitespace-word count across `system_prompt`, all included `[doc_id] text` blocks, and `query`
- `"prompt"`: string joining `[system_prompt, *included_entries, query]` with `"\n\n"`

Raise `ValueError` if `token_count(system_prompt) + token_count(query) > max_tokens`.

## Hints

1. Helper `wc(s) = len(s.split())`. Note that `wc(f"[{doc_id}] {text}")` counts `[doc_id]` as 1 word plus the words in `text`!
2. Maintain `seen = set()`, `included_ids = []`, `entries = []`, and `used = wc(system_prompt) + wc(query)`.

## Starter: guided

```python
def _wc(text):
    return len(text.split())


def pack_context(system_prompt, query, snippets, max_tokens):
    used = _wc(system_prompt) + _wc(query)
    if used > max_tokens:
        raise ValueError("base prompt exceeds token budget")
    seen = set()
    included_ids = []
    entries = []
    for doc_id, text in snippets:
        # Skip duplicates; format entry; pack if used + _wc(entry) <= max_tokens
        pass
    parts = [system_prompt, *entries, query]
    return {
        "included_ids": included_ids,
        "tokens_used": used,
        "prompt": "\n\n".join(parts),
    }
```

## Starter: standard

```python
def pack_context(system_prompt, query, snippets, max_tokens):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _pack():
    snips = [
        ("m1", "Reset breaker B2 first"),
        ("m2", "This snippet is far too long for our small budget today"),
        ("m1", "Duplicate should be skipped"),
        ("m3", "Check voltage"),
    ]
    return get("pack_context")("Be concise.", "How to reset?", snips, 14)
expect("packs fitting unique snippets within budget", _pack, {
    "included_ids": ["m1", "m3"],
    "tokens_used": 13,
    "prompt": "Be concise.\n\n[m1] Reset breaker B2 first\n\n[m3] Check voltage\n\nHow to reset?",
})
```

## Hidden checks

```python
def _too_small():
    try:
        get("pack_context")("System instructions here", "Question?", [], 2)
        return False
    except ValueError:
        return True
expect("raises ValueError when base prompt exceeds max_tokens", _too_small, True)
expect("works with zero snippets", lambda: get("pack_context")("Sys", "Ask", [], 5), {"included_ids": [], "tokens_used": 2, "prompt": "Sys\n\nAsk"})
```

## Solution

```python
def _wc(text):
    return len(text.split())


def pack_context(system_prompt, query, snippets, max_tokens):
    used = _wc(system_prompt) + _wc(query)
    if used > max_tokens:
        raise ValueError("base prompt exceeds token budget")
    seen = set()
    included_ids = []
    entries = []
    for doc_id, text in snippets:
        if doc_id in seen:
            continue
        seen.add(doc_id)
        entry = f"[{doc_id}] {text}"
        cost = _wc(entry)
        if used + cost <= max_tokens:
            used += cost
            included_ids.append(doc_id)
            entries.append(entry)
    return {
        "included_ids": included_ids,
        "tokens_used": used,
        "prompt": "\n\n".join([system_prompt, *entries, query]),
    }
```

## Restored

Prompts stay strictly inside their context budget while packing the best unique evidence snippets.
