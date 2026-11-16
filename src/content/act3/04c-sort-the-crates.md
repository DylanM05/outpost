---
id: sort-the-crates
kind: terminal
title: Sort the delivery
system: Supply locker
symbol: equipment
scene: files
skills: filesystem
---

## Briefing

The last supply run left its parts in the locker's inbox, still mixed up with the delivery note. Parts belong on the parts shelf, and the note becomes the locker's inventory.

## Objective

In `~/locker`:

- Move every `.part` file from `inbox` into `parts`.
- Rename `inbox/note.txt` to `inbox/inventory.txt`.

## Concept

`mv` (**m**o**v**e) does two jobs, depending on where you send the file:

```bash
mv fuse.part parts
```

`parts` is a folder, so `fuse.part` moves into it and keeps its name. When the destination isn't an existing folder, `mv` **renames** instead:

```bash
mv fuse.part spare-fuse.part
```

Give `mv` several files and a folder last, and it moves them all into the folder. The wildcard `*` saves typing their names: `mv inbox/*.part parts` moves every file in `inbox` whose name ends in `.part`.

Be careful renaming onto a name that's already taken: `mv` replaces that file without asking.

## Hints

1. Work from inside the locker: `cd locker`.
2. `mv inbox/*.part parts` moves every part in one command.
3. Then `mv inbox/note.txt inbox/inventory.txt`.

## Setup

```bash
mkdir -p locker/inbox locker/parts
echo "fuse, 5A, qty 4" > locker/inbox/fuse.part
echo "cable, 10m, qty 2" > locker/inbox/cable.part
echo "antenna lead, qty 1" > locker/inbox/lead.part
echo "bracket, qty 6" > locker/parts/bracket.part
printf 'Delivery for the Kestrel Ridge relay line\nfuse x4, cable x2, antenna lead x1\n' > locker/inbox/note.txt
```

## Checks

```python
expect(
    "The parts shelf has every part",
    lambda: listing("~/locker/parts"),
    ["bracket.part", "cable.part", "fuse.part", "lead.part"],
    "Move the .part files from inbox into parts.",
)
expect(
    "The inbox holds only the inventory",
    lambda: listing("~/locker/inbox"),
    ["inventory.txt"],
    "Rename note.txt to inventory.txt, and move the parts out.",
)
check(
    "The inventory still has the delivery note's contents",
    lambda: (read("~/locker/inbox/inventory.txt") or "").startswith("Delivery for the Kestrel Ridge"),
    "Rename the file with mv rather than making a new one.",
)
```

## Solution

```bash
cd locker
mv inbox/*.part parts
mv inbox/note.txt inbox/inventory.txt
```

## Restored

Four parts on the shelf and an inventory in the inbox. For the first time this winter, the locker's files match what's on its shelves.
