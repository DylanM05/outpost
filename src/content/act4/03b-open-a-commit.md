---
id: open-a-commit
kind: terminal
title: Open a commit
system: Archive vault
symbol: instrument
scene: repo
repo: ~/stations
skills: git-history
---

## Briefing

Pell Hansen, the valley's newest technician, shortened the station heartbeat. Ines says Pell sent the change to someone senior, who checked it and put it in the archive, but she can't remember who. `git log` names only the author, the person who wrote the change. The commit itself records more.

## Objective

Look inside the commit `Shorten the heartbeat interval` in `~/stations` with `git cat-file`, and report who **committed** it.

## Concept

Commands like `add`, `commit`, and `log` are made for people. Git calls them **porcelain**, like the smooth outside of a sink. Underneath are **plumbing** commands, which work directly on what Git stores. They're less friendly, and show you exactly how Git works.

Git stores each commit as an **object**: a short piece of text, saved in a file inside `.git/objects` and named by the commit's hash. The file is compressed, so `cat` shows gibberish. The plumbing command `git cat-file` reads it. `-p` prints it, and `-t` says what type of object it is:

```bash
git cat-file -p 8e44a89
```

```text
tree 2e1f0c...
parent ef0cad...
author Tomas Reid <tomas@valley.archive> 1791555600 +0000
committer Tomas Reid <tomas@valley.archive> 1791555600 +0000

Move the valley to 147.330
```

That's all a commit is. `tree` is the snapshot of the files, which comes next. `parent` is the commit before it. The **author** wrote the change, and the **committer** put it in the repository, each with the time in seconds since 1970. Usually they're the same person, but not always.

## Hints

1. Find the commit's hash first, with `git log --oneline`.
2. Run `git cat-file -p` with that hash.
3. Read the `committer` line, not the `author` line.

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

Who committed `Shorten the heartbeat interval`?

```text
Ines Varga
```

## Checks

```python
check("You opened a commit with git cat-file", lambda: git_calls("cat-file"), "Run git cat-file -p with the commit's hash.")
expect(
    "You reported the committer",
    answer().lower(),
    "ines varga",
    "Read the committer line of the commit, rather than its author.",
    accept=lambda name: name in ("ines varga", "ines", "varga"),
    reveal=False,
)
```

## Solution

```bash
cd stations
git log --oneline
git cat-file -p e8047e7
```

## Restored

Pell wrote it, and Ines Varga committed it herself. She'd forgotten, but the archive hadn't.
