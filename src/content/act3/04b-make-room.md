---
id: make-room
kind: terminal
title: Make room for the outbound crate
system: Supply locker
symbol: equipment
scene: files
skills: filesystem
---

## Briefing

The mount goes out to `KR-RELAY-4` on the next supply run. Everything that leaves the locker gets its own folder, with an empty manifest file for the crew to fill in, and fragile parts get a folder of their own inside it.

## Objective

Make these, inside `~/locker`:

- a folder `outbound`, with an empty file `manifest.txt` in it
- a folder `outbound/fragile/mounts`, made with one `mkdir` command

## Concept

- `mkdir` (**m**a**k**e **dir**ectory) makes a new folder: `mkdir outbound`.
- `touch` makes a new, empty file: `touch notes.txt`. Run on a file that already exists, it leaves the contents alone and just updates the time it was last changed.

`mkdir` only makes the last folder in a path, so `mkdir a/b/c` fails unless `a/b` already exists. The `-p` option makes every missing folder along the way, and doesn't complain about ones that are already there:

```bash
mkdir -p spares/winter/fuses
```

## Hints

1. Go into the locker first with `cd locker`, or put `locker/` at the start of each path.
2. `mkdir outbound`, then `touch outbound/manifest.txt`.
3. For the nested folders, `mkdir -p outbound/fragile/mounts`.

## Setup

```bash
for shelf in north south east; do
  mkdir -p "locker/$shelf"
done
echo "antenna mount for KR-series masts, qty 1" > locker/east/antenna.mount
```

## Checks

```python
check("~/locker/outbound is a folder", is_dir("~/locker/outbound"), "Make it with mkdir.")
check(
    "~/locker/outbound/manifest.txt is an empty file",
    lambda: is_file("~/locker/outbound/manifest.txt") and read("~/locker/outbound/manifest.txt") == "",
    "Make an empty file with touch.",
)
check(
    "~/locker/outbound/fragile/mounts is a folder",
    is_dir("~/locker/outbound/fragile/mounts"),
    "mkdir -p makes every folder along the path.",
)
check(
    "You made the nested folders with mkdir -p",
    lambda: any(arguments.startswith("-p") for arguments in calls("mkdir")),
    "Use the -p option so one mkdir makes fragile and mounts together.",
)
```

## Solution

```bash
cd locker
mkdir outbound
touch outbound/manifest.txt
mkdir -p outbound/fragile/mounts
```

## Restored

An empty manifest and a padded folder for the mount. The outbound crate is ready to be packed.
