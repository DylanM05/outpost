---
id: read-the-settings
kind: terminal
title: Read the settings
system: Archive settings
symbol: controller
scene: repo
repo: ~/stations
skills: git-config
---

## Briefing

Every repository in the valley's archive carries a few settings of its own, for the archive's records: which station it belongs to, who looks after it, and where its backup tapes are kept. Ines needs to know where `~/stations` is backed up before she retires the old tape shelves.

## Objective

Read the settings of the `~/stations` repository, and report the shelf its backups are kept on.

## Concept

You set your own settings with `git config set` in Sign your work. Reading them works the same way. `git config get` prints one setting's value:

```bash
git config get user.name
```

`git config list` prints every setting that applies where you are, as `name=value` lines. Inside a repository, that includes the repository's own settings as well as yours. `--local` lists only the repository's own, which Git keeps in a file inside it, `.git/config`.

Git uses settings in sections it knows, like `user`, `core`, and `init`, and quietly ignores sections it doesn't. That lets people and tools keep their own settings in a repository too, like the archive's `archive` section here.

## Hints

1. Run the commands inside `~/stations`, so Git includes the repository's own settings.
2. `git config list --local` shows the repository's settings. Look for the one about a shelf.
3. `git config get archive.shelf` prints just that one.

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
git config set --local archive.station valley
git config set --local archive.curator "Ines Varga"
git config set --local archive.shelf B-14
```

## Report

Which shelf are the repository's backups kept on?

```text
B-14
```

## Checks

```python
check(
    "You read the settings with git config",
    lambda: any(args.split()[:1] in (["get"], ["list"], ["--list"], ["-l"], ["--get"]) for args in git_calls("config")),
    "Run git config list inside ~/stations.",
)
expect(
    "You reported the shelf",
    answer().upper(),
    "B-14",
    "Find the archive setting about the shelf.",
    reveal=False,
)
```

## Solution

```bash
cd stations
git config list --local
git config get archive.shelf
```

## Restored

Shelf `B-14`. Ines adds `~/stations` to the list of repositories whose tapes need moving.
