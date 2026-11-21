---
id: build-the-trie
title: Build the trie
system: Callsign index
symbol: instrument
scene: tests
skills: trees, classes, dictionaries
---

## Briefing

The radio desk holds hundreds of station, beacon, and relay callsigns. Build a `Trie` class so looking up any callsign or checking whether a prefix has any stations under it takes only one dictionary hop per character.

## Objective

Write a `Trie` class with:

- `__init__(self)`: initializes `self.root = {}` and `self.end_symbol = "*"`.
- `add(self, word)`: inserts `word` into the trie character by character, marking the final node with `self.end_symbol: True`.
- `exists(self, word)`: returns `True` if the exact `word` was added, `False` otherwise.
- `starts_with(self, prefix)`: returns `True` if at least one added word starts with `prefix`, `False` otherwise.

```python
index = Trie()
index.add("kestrel")
index.add("kelvin")
index.exists("kestrel")     # True
index.exists("kest")        # False
index.starts_with("kest")   # True
index.starts_with("west")   # False
```

## Concept

Both `exists` and `starts_with` walk from `self.root` one character at a time:

```python
current = self.root
for ch in word:
    if ch not in current:
        return False
    current = current[ch]
```

The only difference is the final line: `starts_with` returns `True` as soon as the prefix path exists (as long as the trie isn't empty for `""`), while `exists` returns `self.end_symbol in current`.

## Hints

1. In `add(word)`: walk `current = self.root`; for each `ch`, create `current[ch] = {}` if missing, then move `current = current[ch]`. After the loop, set `current[self.end_symbol] = True`.
2. In `exists(word)`: walk the letters; if any letter is missing, return `False`. At the end, return `self.end_symbol in current`.
3. In `starts_with(prefix)`: if the trie has no words (`not self.root`), return `False`. Otherwise walk the letters of `prefix` and return `True` if every letter is found.

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
        # Mark the end of the word.

    def exists(self, word):
        current = self.root
        # Walk each character, returning False if missing, then check end_symbol.
        return False

    def starts_with(self, prefix):
        if not self.root:
            return False
        # Walk each character of prefix and return True if the path exists.
        return False
```

## Starter: standard

```python
class Trie:
    def __init__(self):
        self.root = {}
        self.end_symbol = "*"

    def add(self, word):
        pass

    def exists(self, word):
        return False

    def starts_with(self, prefix):
        return False
```

## Starter: challenge

```python
```

## Checks

```python
t = get("Trie")()
t.add("kestrel")
t.add("kelvin")
t.add("kite")
expect('exists("kestrel")', lambda: t.exists("kestrel"), True)
expect('exists("kest")', lambda: t.exists("kest"), False)
expect('starts_with("kest")', lambda: t.starts_with("kest"), True)
expect('starts_with("ke")', lambda: t.starts_with("ke"), True)
expect('starts_with("west")', lambda: t.starts_with("west"), False)
```

## Hidden checks

```python
empty = get("Trie")()
expect("empty trie exists('a')", lambda: empty.exists("a"), False)
expect("empty trie starts_with('')", lambda: empty.starts_with(""), False)
expect("empty trie starts_with('a')", lambda: empty.starts_with("a"), False)

t2 = get("Trie")()
t2.add("ridge")
t2.add("ridge-north")
expect("shorter prefix exists when explicitly added", lambda: (t2.exists("ridge"), t2.exists("ridge-north"), t2.exists("ridge-")), (True, True, False))
expect("non-empty trie starts_with('')", lambda: t2.starts_with(""), True)
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

    def exists(self, word):
        current = self.root
        for ch in word:
            if ch not in current:
                return False
            current = current[ch]
        return self.end_symbol in current

    def starts_with(self, prefix):
        if not self.root:
            return False
        current = self.root
        for ch in prefix:
            if ch not in current:
                return False
            current = current[ch]
        return True
```

## Restored

The callsign index stores overlapping names compactly and confirms prefixes in one hop per letter.
