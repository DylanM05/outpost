---
id: maintenance-trie-prefix-count
title: Count matching callsigns
system: Elevation tree
symbol: instrument
scene: tests
skills: trees
reviewSkill: trees
prerequisite: prefix-search
---

## Briefing

Radio dispatch wants to know how many registered callsigns share a given prefix without building a full list of strings on every keystroke.

## Objective

Write `count_with_prefix(words, prefix)`. Build a prefix trie from `words` (deduplicating repeated words), walk down `prefix`, and return the count of distinct words in `words` that start with `prefix`.

```python
count_with_prefix(["kestrel", "kelvin", "kite", "beacon"], "ke")  # 2
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Insert each word into a nested-dict trie with `"*"` marking word ends.
2. Walk to the `prefix` node (returning `0` if any letter is missing), then recursively count all `"*"` markers in that subtree.

## Starter

```python
```

## Checks

```python
words = ["kestrel", "kelvin", "kite", "beacon", "kestrel"]
expect('count_with_prefix(words, "ke")', lambda: get("count_with_prefix")(words, "ke"), 2)
expect('count_with_prefix(words, "k")', lambda: get("count_with_prefix")(words, "k"), 3)
expect('count_with_prefix(words, "z")', lambda: get("count_with_prefix")(words, "z"), 0)
```

## Hidden checks

```python
expect("empty prefix counts all distinct words", lambda: get("count_with_prefix")(words, ""), 4)
expect("empty word list returns 0", lambda: get("count_with_prefix")([], "k"), 0)
```

## Solution

```python
def count_with_prefix(words, prefix):
    root = {}
    for word in words:
        node = root
        for ch in word:
            node = node.setdefault(ch, {})
        node["*"] = True

    node = root
    for ch in prefix:
        if ch not in node:
            return 0
        node = node[ch]

    def count(n):
        total = 1 if "*" in n else 0
        for k, child in n.items():
            if k != "*":
                total += count(child)
        return total

    return count(node)
```

## Restored

The radio console counts prefix matches cleanly across the trie.
