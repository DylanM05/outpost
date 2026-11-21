---
id: branch-by-letter
kind: predict
title: Branch by letter
system: Callsign index
symbol: instrument
scene: console
skills: trees, dictionaries, reading-code
---

## Briefing

Radio operators on the deep ridge type the first few letters of a station's callsign and expect every matching callsign to appear right away. A **trie** (prefix tree) stores words one character per level in nested dictionaries, so words that share a prefix share the same path from the root. Trace how two overlapping callsigns sit inside the same trie.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

Each node in a trie is a dictionary mapping each next character to its child dictionary. A special marker key — `"*"` — records where a complete word ends:

```python
# After adding "CAT" and "CAR":
{"C": {"A": {"T": {"*": True}, "R": {"*": True}}}}
```

Checking whether a word exists walks one dictionary lookup per letter: `O(L)` time where `L` is the length of the word, no matter how many thousands of callsigns are stored! And noticing `"*"` tells `"KET"` apart from `"KESTREL"`, even though `"KET"` is a prefix of `"KESTREL"`.

## Hints

1. Adding `"KE"` creates `root["K"]["E"]["*"] = True`.
2. Adding `"KEL"` reuses `"K"` and `"E"`, then adds `"L": {"*": True}` inside `"E"`.
3. Look carefully at what keys are inside `root["K"]["E"]`, and whether `"K"` itself has `"*"`.

## Program

```python
root = {}

for word in ["KE", "KEL"]:
    node = root
    for ch in word:
        if ch not in node:
            node[ch] = {}
        node = node[ch]
    node["*"] = True

print(sorted(root["K"]["E"].keys()))
print("*" in root["K"])
print("*" in root["K"]["E"])
print("*" in root["K"]["E"]["L"])
```

## Output

```text
['*', 'L']
False
True
True
```

## Restored

You traced how shared prefixes overlap in the trie while `"*"` marks exactly where each callsign ends.
