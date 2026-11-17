---
id: name-a-commit
kind: terminal
title: Name a commit
system: Archive vault
symbol: instrument
scene: console
skills: git-history
---

## Briefing

The valley has sent its station settings into `~/stations`: one settings file for each station, and the history of every change to them. Ines Varga, who keeps the archive, writes:

> When you write to us about a change, give us its hash, not its message. Messages repeat. Hashes don't.

Practise on the valley's history.

## Objective

Find the hash of the commit in `~/stations` with the message `Move the valley to 147.330`, and report its first seven characters.

## Concept

Git names every commit with a **hash**, the long string of letters and numbers after `commit` in `git log`:

```text
commit 2d9e4c1a7b0f3e8d5c6a9b2f1e4d7c0a3b6e9f2d
```

Git calculates it from everything in the commit: the files, the author, the time, the message, and the hash of the commit before it. Change any of that, even one letter, and the hash comes out completely different. That's how a hash can name exactly one commit, anywhere: the same hash means the same commit, in your copy of a repository or anyone else's.

Forty characters is a lot to type, so Git accepts the first few, as long as no other commit starts the same way. Seven is the usual length. `git log --oneline` shows each commit on one line, with its short hash and its message:

```bash
git log --oneline
```

## Hints

1. Run the command inside `~/stations`.
2. `git log --oneline` lists each commit's short hash next to its message.
3. Report the seven characters in front of `Move the valley to 147.330`.

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

What are the first seven characters of the commit's hash?

```text
8e44a89
```

## Checks

```python
FULL = "8e44a893c958a25feafe1aaf78a8d66f141a35e4"
check("You read the history with git log", lambda: git_calls("log"), "Run git log --oneline inside ~/stations.")
expect(
    "You reported the commit's hash",
    answer().lower(),
    "8e44a89",
    "Find the line with Move the valley to 147.330, and copy the characters in front of it.",
    accept=lambda value: len(value) >= 7 and FULL.startswith(value),
    reveal=False,
)
```

## Solution

```bash
cd stations
git log --oneline
```

## Restored

`8e44a89`. Seven characters that name one change, in one repository, for good. You can write to the valley about it, and they'll know exactly which one you mean.
