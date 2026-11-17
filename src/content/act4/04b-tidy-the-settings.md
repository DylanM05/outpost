---
id: tidy-the-settings
kind: terminal
title: Tidy the settings
system: Archive settings
symbol: controller
scene: console
skills: git-config
---

## Briefing

The archive has finished moving its tapes, and `~/stations` still has settings that are out of date. Its backups are on a new shelf now. The two people listed as its contacts have both moved to other stations. The old tape backup settings, in a section of their own, aren't used by anything any more.

## Objective

In the `~/stations` repository's own settings:

1. Change `archive.shelf` to `C-02`.
2. Remove `archive.contact`. It has two values: remove both.
3. Remove the whole `backup` section.

Leave the other `archive` settings as they are.

## Concept

`git config unset` removes a setting:

```bash
git config unset archive.curator
```

A setting can have more than one value, which some settings use as a list. `git config get --all` shows them all. `unset` refuses to guess which value you mean when there are several, so give it `--all` to remove every one.

To remove a whole section, every setting whose name starts with it, use `remove-section`:

```bash
git config remove-section backup
```

Inside a repository, these change the repository's own settings in `.git/config`, unless you add `--global` for yours. `git config list --local`, or `cat .git/config`, shows what's left.

## Hints

1. Run each command inside `~/stations`. `git config set archive.shelf C-02` changes the shelf.
2. `git config unset archive.contact` refuses because there are two values. Add `--all`.
3. `git config remove-section backup` removes the backup settings. Then `git config list --local` to check.

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
git config --add archive.contact tomas@valley.archive
git config --add archive.contact pell@valley.archive
git config set --local backup.tape T-0042
git config set --local backup.weekday friday
```

## Checks

```python
def local_settings():
    return run("git config list --local", "~/stations").out.splitlines()


expect("archive.shelf is C-02", lambda: config("archive.shelf", "~/stations", "local"), "C-02", "git config set archive.shelf C-02")
expect(
    "archive.contact is gone",
    lambda: config("archive.contact", "~/stations", "local", all=True),
    [],
    "git config unset --all archive.contact removes both values.",
)
expect(
    "The backup section is gone",
    lambda: [line for line in local_settings() if line.startswith("backup.")],
    [],
    "git config remove-section backup",
)
expect(
    "The other archive settings are unchanged",
    lambda: [config("archive.station", "~/stations", "local"), config("archive.curator", "~/stations", "local")],
    ["valley", "Ines Varga"],
    "Only change the shelf and remove the contacts. Start over to get the settings back.",
)
```

## Solution

```bash
cd stations
git config set archive.shelf C-02
git config unset --all archive.contact
git config remove-section backup
git config list --local
```

## Restored

`~/stations` says where its backups really are, and nothing else about it is out of date.
