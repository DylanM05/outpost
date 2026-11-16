---
id: maintenance-most-common-label
title: Find the most common crate
system: Index vault
symbol: instrument
scene: work
skills: hashing
reviewSkill: hashing
prerequisite: fill-the-lift
---

## Briefing

The vault reorders whatever it stocks most of. It needs the most common label in the day's deliveries.

## Objective

Write `most_common(labels)`. `labels` has at least one label. Return the label that appears most often. If several are tied, return the one that appears first in the list. Read each label only once or twice: the hidden test counts 2,000 labels with a budget of 4,000 reads.

```python
most_common(["seed", "fuel", "fuel", "seed", "ice"])  # "seed": tied with fuel, and first
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. `labels.count(label)` reads the whole list each time it's called. Count everything in one pass with a dictionary instead.
2. Dictionaries keep keys in the order they were added, which is the order labels first appear.
3. Go through the counts in that order, and only replace the best label when a count is strictly bigger.

## Starter

```python
```

## Checks

```python
expect(
    'most_common(["seed", "fuel", "fuel", "seed", "ice"])',
    lambda: get("most_common")(["seed", "fuel", "fuel", "seed", "ice"]),
    "seed",
)
expect('most_common(["ice", "rope", "rope"])', lambda: get("most_common")(["ice", "rope", "rope"]), "rope")
```

## Hidden checks

```python
expect('most_common(["solo"])', lambda: get("most_common")(["solo"]), "solo")
expect('most_common(["b", "a", "a", "b"])', lambda: get("most_common")(["b", "a", "a", "b"]), "b", "Ties go to the label that appears first.")
names = ["fuel", "seed", "ice", "rope", "tools", "medical", "rations", "parts"]
plain = [names[(i * 5 + i // 7) % 8] for i in range(2000)]
counts = {}
for label in plain:
    counts[label] = counts.get(label, 0) + 1
best = plain[0]
for label in counts:
    if counts[label] > counts[best]:
        best = label
deliveries = tracked(plain)
expect_within(
    "most_common(2,000 labels)",
    lambda: get("most_common")(deliveries),
    best,
    deliveries,
    4000,
    "Count every label in one pass with a dictionary.",
)
```

## Solution

```python
def most_common(labels):
    counts = {}
    for label in labels:
        if label in counts:
            counts[label] += 1
        else:
            counts[label] = 1
    best = labels[0]
    for label in counts:
        if counts[label] > counts[best]:
            best = label
    return best
```

## Restored

The vault reorders its most common crate before it runs out, and nobody has to count shelves by hand.
