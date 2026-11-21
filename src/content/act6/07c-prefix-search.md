---
id: prefix-search
title: Prefix search
system: Callsign index
symbol: instrument
scene: tests
skills: trees, recursion
---

## Briefing

Now give the radio desk two tools that make the trie pay off: autocomplete every callsign that starts with what the operator has typed so far, and scan an incoming radio transcript to spot any known callsigns mentioned inside it.

## Objective

Extend `Trie` (already started with `add`) with two methods:

1. `words_with_prefix(self, prefix)`: returns a **sorted** list of all stored words that start with `prefix` (`[]` if none match).
2. `find_matches(self, text)`: returns a `set` of all stored words that appear anywhere as a substring of `text`.

```python
t = Trie()
for name in ["kestrel", "kelvin", "kite", "beacon"]:
    t.add(name)

t.words_with_prefix("ke")                         # ["kelvin", "kestrel"]
t.find_matches("kite passed beacon near kestrel") # {"kite", "beacon", "kestrel"}
```

## Concept

To autocomplete `prefix`:

1. Walk down `self.root` along `prefix`. If any character is missing, return `[]`.
2. From that node, recursively collect every word beneath it:
   - Loop over `sorted(node.keys())` (skipping `self.end_symbol`, or checking it first).
   - If `self.end_symbol in node`, add the current word to the results.
   - For every other key `ch`, recurse on `node[ch]` with `current_word + ch`.

For `find_matches(text)`: start at each index `i` in `text`, walk down `self.root` character by character (`text[j]` for `j >= i`), stop as soon as a character isn't in the current node, and whenever you hit `self.end_symbol`, add `text[i : j + 1]` to the result set.

## Hints

1. Write a helper `_collect(self, node, current_word, words)`: if `self.end_symbol in node`, append `current_word`. Then for each `ch` in `sorted(node)` where `ch != self.end_symbol`, call `self._collect(node[ch], current_word + ch, words)`.
2. In `words_with_prefix(prefix)`: walk down to the prefix node first (returning `[]` if missing), then call `_collect(node, prefix, words)`.
3. In `find_matches(text)`: for `i` in `range(len(text))`, set `node = self.root`, then for `j` in `range(i, len(text))`, break if `text[j] not in node`, advance `node = node[text[j]]`, and if `self.end_symbol in node`, add `text[i : j + 1]` to `found`.

## Starter: guided

```python
class Trie:
    def __init__(self):
        self.root = {}
        self.end_symbol = "*"

    def add(self, word):
        current = self.root
        for ch in word:
            if ch not in current:
                current[ch] = {}
            current = current[ch]
        current[self.end_symbol] = True

    def _collect(self, node, prefix, words):
        if self.end_symbol in node:
            words.append(prefix)
        # Recurse into each child character in sorted order (skipping self.end_symbol).

    def words_with_prefix(self, prefix):
        current = self.root
        for ch in prefix:
            if ch not in current:
                return []
            current = current[ch]
        words = []
        self._collect(current, prefix, words)
        return words

    def find_matches(self, text):
        found = set()
        # For each starting position i in text, walk the trie as far as characters match.
        return found
```

## Starter: standard

```python
class Trie:
    def __init__(self):
        self.root = {}
        self.end_symbol = "*"

    def add(self, word):
        current = self.root
        for ch in word:
            if ch not in current:
                current[ch] = {}
            current = current[ch]
        current[self.end_symbol] = True

    def words_with_prefix(self, prefix):
        return []

    def find_matches(self, text):
        return set()
```

## Starter: challenge

```python
class Trie:
    def __init__(self):
        self.root = {}
        self.end_symbol = "*"

    def add(self, word):
        current = self.root
        for ch in word:
            if ch not in current:
                current[ch] = {}
            current = current[ch]
        current[self.end_symbol] = True
```

## Checks

```python
t = get("Trie")()
for name in ["kestrel", "kelvin", "kite", "beacon", "ke"]:
    t.add(name)
expect('words_with_prefix("ke")', lambda: t.words_with_prefix("ke"), ["ke", "kelvin", "kestrel"])
expect('words_with_prefix("k")', lambda: t.words_with_prefix("k"), ["ke", "kelvin", "kestrel", "kite"])
expect('words_with_prefix("z")', lambda: t.words_with_prefix("z"), [])
expect(
    'find_matches("kite passed beacon near kestrel")',
    lambda: t.find_matches("kite passed beacon near kestrel"),
    {"kite", "beacon", "kestrel", "ke"},
)
```

## Hidden checks

```python
expect('words_with_prefix("") returns all words sorted', lambda: t.words_with_prefix(""), ["beacon", "ke", "kelvin", "kestrel", "kite"])
expect('find_matches on text with no hits', lambda: t.find_matches("quiet wind over snow"), set())
t2 = get("Trie")()
t2.add("north")
t2.add("north-ridge")
expect(
    "find_matches finds both shorter prefix and longer overlapping word",
    lambda: t2.find_matches("check north-ridge now"),
    {"north", "north-ridge"},
    "Don't stop walking after finding a match: a longer word may continue past it.",
)
```

## Solution

```python
class Trie:
    def __init__(self):
        self.root = {}
        self.end_symbol = "*"

    def add(self, word):
        current = self.root
        for ch in word:
            if ch not in current:
                current[ch] = {}
            current = current[ch]
        current[self.end_symbol] = True

    def _collect(self, node, prefix, words):
        if self.end_symbol in node:
            words.append(prefix)
        for ch in sorted(node):
            if ch != self.end_symbol:
                self._collect(node[ch], prefix + ch, words)

    def words_with_prefix(self, prefix):
        current = self.root
        for ch in prefix:
            if ch not in current:
                return []
            current = current[ch]
        words = []
        self._collect(current, prefix, words)
        return words

    def find_matches(self, text):
        found = set()
        for i in range(len(text)):
            node = self.root
            for j in range(i, len(text)):
                ch = text[j]
                if ch not in node:
                    break
                node = node[ch]
                if self.end_symbol in node:
                    found.add(text[i : j + 1])
        return found
```

## Restored

The radio desk autocompletes callsigns on the first two letters and flags every known station mentioned in incoming traffic.
