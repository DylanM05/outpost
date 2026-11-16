---
id: file-by-number
kind: predict
title: File by number
system: Index vault
symbol: instrument
scene: console
skills: hashing, reading-code
---

## Briefing

The index vault holds every marker code ever issued, and it never searches a drawer from one end to the other. Each code has one drawer it belongs in, worked out from the code itself. Trace the vault's filing system.

## Objective

Predict exactly what this program prints.

## Concept

Searching a list means checking items one at a time: `code in codes` reads through the list until it finds a match, so it's linear. A **hash table** avoids that. It works out where an item belongs **from the item itself**, using a function called a **hash**, and only ever looks there.

This vault uses five drawers, and files each code in drawer `code % 5`, the remainder after dividing by 5. To store a code, put it in its drawer. To check for a code, work out its drawer and look in that one drawer only.

Two codes can land in the same drawer. That's a **collision**, and it's why each drawer holds a list. Real hash tables keep drawers short by adding more drawers as they fill, so a lookup checks only an item or two, however many items are stored. That's **constant time** on average, `O(1)`.

Python's `set` and `dict` are hash tables. `code in seen` for a set, and `stock[label]` for a dictionary, take about as long with ten million items as with ten.

## Hints

1. Work out each code's drawer first: `12 % 5` is 2, `7 % 5` is 2, and `30 % 5` is 0.
2. Codes go into their drawer's list in the order they're filed, so drawer 2 fills up in order 12, 7, then 22.
3. Looking for 22 only checks drawer `22 % 5`, which holds three codes.

## Program

```python
drawers = [[], [], [], [], []]


def drawer_for(code):
    return code % 5


for code in [12, 7, 30, 22, 5]:
    drawers[drawer_for(code)].append(code)

for i in range(len(drawers)):
    print(i, drawers[i])

target = 22
print(target in drawers[drawer_for(target)])
print(len(drawers[drawer_for(target)]))
```

## Output

```text
0 [30, 5]
1 []
2 [12, 7, 22]
3 []
4 []
True
3
```

## Restored

Every code has its drawer, and checking for one means opening a single drawer instead of walking the whole vault.
