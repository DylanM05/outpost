---
id: scrambled-labels
title: Scrambled labels
system: Index vault
symbol: instrument
scene: work
skills: hashing, dictionaries
---

## Briefing

A label printer in the vault scrambled the letters of every label it printed. "tea" came out as "eat" on one crate and "ate" on another. Nothing is lost, since each label still has the right letters, but the crates need regrouping, and the vault's regrouping program compares every label with every group so far.

## Objective

`group_labels(labels)` returns a list of groups. Each group is a list of the labels that have exactly the same letters, in any order. Groups come in the order their first label appears, and labels within a group keep their original order. Make it read each label's letters only once or twice.

```python
group_labels(["tea", "pots", "eat", "stop", "ate", "rope"])
# [["tea", "eat", "ate"], ["pots", "stop"], ["rope"]]
```

The tests count letters read, as well as labels. The hidden test groups 1,200 labels and allows 15,000 reads.

## Concept

Two labels have the same letters exactly when their sorted letters match: `sorted("tea")` and `sorted("eat")` are both `['a', 'e', 't']`. That makes the sorted letters a perfect dictionary key. Each key holds one group, as a list of labels:

1. Work out the key for a label.
2. If the key isn't in the dictionary yet, start a new empty group for it.
3. Append the label to its key's group.

There's one catch. `sorted()` returns a list, and **a list can't be a dictionary key**. Keys have to be **hashable**, which means they can't change: a key that changed after it was filed would sit in the wrong drawer forever. Strings, numbers, and tuples can be keys. Lists, sets, and dictionaries can't, and trying gives `TypeError: unhashable type: 'list'`. `tuple(sorted(label))` turns the sorted letters into a tuple, which works.

Dictionaries remember the order their keys were added, and `groups.values()` gives the values in that order. `list(groups.values())` turns them into a list of groups, first-seen first.

## Hints

1. Create `groups = {}`, and loop over the labels once.
2. `key = tuple(sorted(label))`. If `key not in groups`, set `groups[key] = []`. Then `groups[key].append(label)`.
3. Return `list(groups.values())`.

## Starter: guided

```python
def group_labels(labels):
    groups = {}
    for label in labels:
        key = sorted(label)  # A list can't be a key. Make it a tuple.
        if key not in groups:
            groups[key] = []
        groups[key].append(label)
    return list(groups.values())


print(group_labels(["tea", "pots", "eat", "stop", "ate", "rope"]))
```

## Starter: standard

```python
def group_labels(labels):
    # Correct, but each label is compared with every group so far, sorting
    # letters again every time.
    groups = []
    for label in labels:
        placed = False
        for group in groups:
            if sorted(group[0]) == sorted(label):
                group.append(label)
                placed = True
                break
        if not placed:
            groups.append([label])
    return groups
```

## Starter: challenge

```python
```

## Checks

```python
def reference(labels):
    found = {}
    for label in labels:
        found.setdefault(tuple(sorted(label)), []).append(label)
    return list(found.values())

hint = "Group the labels in a dictionary keyed by their sorted letters, instead of comparing with every group."
expect(
    'group_labels(["tea", "pots", "eat", "stop", "ate", "rope"])',
    lambda: get("group_labels")(["tea", "pots", "eat", "stop", "ate", "rope"]),
    [["tea", "eat", "ate"], ["pots", "stop"], ["rope"]],
)
alphabet = "abcdefghijklmnopqrstuvwxyz"
plain = []
for k in range(60):
    word = "".join(alphabet[(k * step) % 26] for step in (1, 3, 7, 11))
    plain.append(word[k % 4:] + word[:k % 4])
crates = tracked(plain)
expect_within("group_labels(60 labels)", lambda: get("group_labels")(crates), reference(plain), crates, 600, hint)
```

## Hidden checks

```python
expect("group_labels([])", lambda: get("group_labels")([]), [])
expect('group_labels(["ice"])', lambda: get("group_labels")(["ice"]), [["ice"]])
expect(
    'group_labels(["dog", "god", "dog"])',
    lambda: get("group_labels")(["dog", "god", "dog"]),
    [["dog", "god", "dog"]],
)
expect(
    'group_labels(["ab", "abb", "ba", "bab"])',
    lambda: get("group_labels")(["ab", "abb", "ba", "bab"]),
    [["ab", "ba"], ["abb", "bab"]],
    "Labels need the same letters the same number of times.",
)
plain = []
for k in range(1200):
    base = k % 300
    word = "".join(alphabet[(base * step + step) % 26] for step in (1, 2, 5, 9, 13))
    plain.append(word[k % 5:] + word[:k % 5])
vault = tracked(plain)
expect_within("group_labels(1,200 labels)", lambda: get("group_labels")(vault), reference(plain), vault, 15000, hint)
```

## Solution

```python
def group_labels(labels):
    groups = {}
    for label in labels:
        key = tuple(sorted(label))
        if key not in groups:
            groups[key] = []
        groups[key].append(label)
    return list(groups.values())
```

## Restored

Every crate is back with its kind, scrambled label or not. The vault prints new labels on a printer that works.
