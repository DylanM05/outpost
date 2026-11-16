---
id: find-the-spare
kind: terminal
title: Find the spare
system: Supply locker
symbol: equipment
scene: files
skills: reading-files
---

## Briefing

There's a spare antenna mount for `KR-RELAY-4` somewhere in the supply locker. The locker's records are files, one per part, sorted into shelves and bins and boxes, and nobody kept a map. You know the part's file name ends in `.mount`.

## Objective

Use `find` to locate the file in `~/locker` whose name ends in `.mount`, and report its path.

## Concept

`find` searches for files by their names, through a folder and every folder inside it:

```bash
find locker -name "fuse.part"
```

prints the path of every file called `fuse.part` anywhere under `locker`.

Names can include the wildcard `*`, which matches any characters. `"*.part"` matches every name that ends in `.part`. Keep the pattern in quotes, so the shell passes the `*` to `find` instead of expanding it first.

`find` with only a folder lists everything inside it. Add `-type f` to show only files, or `-type d` for only folders.

## Hints

1. Search from your home folder: `find locker -name ...`.
2. The pattern for "ends in .mount" is `"*.mount"`, in quotes.
3. Run `find locker -name "*.mount"` and report the path it prints.

## Setup

```bash
for shelf in north south east; do
  for bin in 01 02 03; do
    mkdir -p "locker/$shelf/bin-$bin"
    echo "fuse, 5A, qty 4" > "locker/$shelf/bin-$bin/fuse.part"
  done
done
mkdir -p locker/east/bin-02/box-b locker/south/bin-03/box-a
echo "cable, 10m, qty 2" > locker/north/bin-01/cable.part
echo "antenna mount for KR-series masts, qty 1" > locker/east/bin-02/box-b/antenna.mount
echo "bracket, qty 6" > locker/south/bin-03/box-a/bracket.part
```

## Report

What's the path of the antenna mount's file?

```text
locker/east/bin-02/box-b/antenna.mount
```

## Checks

```python
check("You searched with find", ran("find"), "Run find, the folder to search, then -name and the pattern.")
expect(
    "You reported where the mount is",
    answer(),
    "locker/east/bin-02/box-b/antenna.mount",
    "Copy the path find prints. Starting from your home folder, it begins with locker/.",
    accept=lambda given: given and _full(given.removeprefix("./")) == _full("~/locker/east/bin-02/box-b/antenna.mount"),
    reveal=False,
)
```

## Solution

```bash
find locker -name "*.mount"
```

## Restored

East shelf, bin 2, box B. The mount is there, still in its wrapping, with `KR-RELAY-4` written on the label in pencil.
