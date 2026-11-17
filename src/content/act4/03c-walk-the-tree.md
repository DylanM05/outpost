---
id: walk-the-tree
kind: terminal
title: Walk the tree
system: Archive vault
symbol: instrument
scene: repo
repo: ~/stations
skills: git-history
---

## Briefing

The ridge's oldest radio still has a hand-written label with a frequency on it, and the ranger would like to know whether it's the one the archive started with. The ridge's settings have changed since, but a commit is a snapshot: the very first one still holds `ridge.conf` exactly as it was.

## Objective

Starting from the first commit in `~/stations`, follow its tree to the `ridge.conf` it saved, using `git cat-file`. Report the frequency that file had.

## Concept

A commit doesn't hold the files itself. Its `tree` line points to a **tree** object, which lists the files like a folder does:

```bash
git cat-file -p 2e1f0c4
```

```text
100644 blob 9f3b2a71...	heartbeat.conf
100644 blob c04d8e52...	ridge.conf
```

Each line is a file's permissions, its type, a hash, and its name. Folders inside the repository show up as more trees. `blob` means the contents of a file, and `git cat-file -p` on a blob's hash prints them.

Git stores whole files, not just the changes. When a commit leaves a file unchanged, its tree points to the same blob as the commit before, so an unchanged file costs nothing to store again. That's why every commit can be a full snapshot.

Once you know how it works, there's a porcelain shortcut: `git show <commit>:<file>` prints a file as it was in any commit.

## Hints

1. `git log --oneline` lists the commits. The first one is at the bottom.
2. `git cat-file -p` on that commit shows its tree's hash. Do the same with the tree's hash, then with the blob for `ridge.conf`.
3. The shortcut gives the same answer: `git show ef0cadc:ridge.conf`.

## Setup

```bash
player_git
mkdir stations
cd stations
git init -q
printf 'callsign=KR-RIDGE\nfrequency=147.360\n' > ridge.conf
printf 'callsign=KR-VALLEY\nfrequency=147.390\n' > valley.conf
printf 'interval=120\n' > heartbeat.conf
git add .
commit_as "Ines Varga" "2026-10-02 09:00" "Add the station settings"
sed -i 's/147.390/147.330/' valley.conf
git add valley.conf
commit_as "Tomas Reid" "2026-10-09 14:20" "Move the valley to 147.330"
sed -i 's/120/60/' heartbeat.conf
git add heartbeat.conf
COMMITTER="Ines Varga" commit_as "Pell Hansen" "2026-10-15 11:40" "Shorten the heartbeat interval"
sed -i 's/147.360/147.330/' ridge.conf
git add ridge.conf
commit_as "Tomas Reid" "2026-10-21 08:15" "Move the ridge to 147.330"
printf 'power=20\n' > beacon.conf
git add beacon.conf
commit_as "Mara Okafor" "2026-11-02 16:05" "Add the beacon settings"
```

## Report

What frequency did `ridge.conf` have in the first commit?

```text
147.360
```

## Checks

```python
check(
    "You followed the commit to its files",
    lambda: git_calls("cat-file") or any(":" in args for args in git_calls("show")),
    "Use git cat-file -p on the commit, then on its tree, then on the blob.",
)
expect(
    "You reported the first frequency",
    answer().removeprefix("frequency=").strip(),
    "147.360",
    "Read ridge.conf as the first commit saved it, not as it is now.",
    accept=lambda value: value in ("147.360", "147.36"),
    reveal=False,
)
```

## Solution

```bash
cd stations
git log --oneline
git cat-file -p ef0cadc
git cat-file -p 10b16ca
git cat-file -p 412c5ef
```

## Restored

`147.360`, the number on the old radio's label. It's the setting the archive started with, two retunings ago.
