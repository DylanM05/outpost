---
id: recover-the-archive
kind: terminal
title: Recover the archive
system: Valley archive
symbol: controller
scene: repo
repo: ~/stations
skills: git-history, undoing, commits, remotes
assessment: true
---

## Briefing

The valley's relay won't start. Its settings in the archive are broken: `valley.conf` has lost its frequency, and `heartbeat.conf` is gone altogether. Somebody committed the damage last week, and other people have committed good work since, so the archive can't just be wound back. Your clone of it is in `~/stations`, and it has an uncommitted edit of yours in `ridge.conf` that went wrong too.

This is an independent mission. There's no step-by-step lesson, and hints unlock after your second submission. Use what you've learned in the archive, and Git's manual when you need it.

## Objective

1. Find the commit that broke the settings, and report its hash (at least seven characters).
2. In a new commit, put `valley.conf` and `heartbeat.conf` back exactly as they were just before that commit. Keep everything the commits after it did.
3. Throw away your uncommitted change to `ridge.conf`.
4. Push the repair to the archive. Its history must keep every commit it has now.

## Concept

This mission brings together the archive's tools:

| You need to | Reach for |
|---|---|
| Find when something changed | `git log`, with `--oneline` or `--stat` |
| See what a commit did | `git show <commit>` |
| Name the commit before another | `<commit>~1` |
| Get a file as an old commit had it | `git show <commit>:<file>`, or `git restore --source` |
| Throw away an uncommitted change | `git restore` |
| Share your commit | `git push` |

Don't reset the archive's history away, and don't force a push: the commits after the bad one are good, and other stations already have them.

## Hints

1. `git log --stat` lists which files each commit touched. Look for the one that changed `valley.conf` and deleted `heartbeat.conf`.
2. `git restore --source 693bedc~1 valley.conf heartbeat.conf` brings both back as they were just before it. `git show 693bedc~1:valley.conf > valley.conf` does the same for one file.
3. `git restore ridge.conf` throws away your edit. Then stage the two files, commit, and `git push`.

## Root setup

```bash
mkdir -p /srv/archive
chown ranger:ranger /srv/archive
```

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
printf 'callsign=KR-VALLEY\n' > valley.conf
git rm -q heartbeat.conf
git add valley.conf
commit_as "Pell Hansen" "2026-11-05 17:20" "Tidy the station settings"
sed -i 's/power=20/power=35/' beacon.conf
git add beacon.conf
commit_as "Mara Okafor" "2026-11-08 09:45" "Raise the beacon power"
echo 'beacon=147.330' >> ridge.conf
git add ridge.conf
commit_as "Tomas Reid" "2026-11-12 15:30" "Add the ridge beacon"
cd
git clone -q --bare stations /srv/archive/stations.git
rm -rf stations
git clone -q /srv/archive/stations.git
echo 'frequency=???' >> stations/ridge.conf
```

## Report

What's the hash of the commit that broke the settings?

```text
693bedc
```

## Checks

```python
ARCHIVE = "/srv/archive/stations.git"
BROKE = "693bedc47f668cd77199323bd213dc913197cc42"
LATEST = "55c51bc87b0392432c118d4f3bf8f2d8704f2c6f"


def has(ref, commit):
    return run(f"git merge-base --is-ancestor {commit} {ref}", ARCHIVE).code == 0


expect(
    "You reported the commit that broke the settings",
    answer().lower(),
    "693bedc",
    "Look for the commit that changed valley.conf and deleted heartbeat.conf.",
    accept=lambda value: len(value) >= 7 and BROKE.startswith(value),
    reveal=False,
)
expect("valley.conf is repaired in the archive", lambda: show(ARCHIVE, "main", "valley.conf"), "callsign=KR-VALLEY\nfrequency=147.330\n")
expect("heartbeat.conf is back in the archive", lambda: show(ARCHIVE, "main", "heartbeat.conf"), "interval=60\n")
check(
    "The archive keeps every commit it had",
    lambda: has("main", LATEST),
    "The commits after the bad one are missing. Start over, and repair it with a new commit instead of resetting.",
)
check(
    "The later changes are still there",
    lambda: show(ARCHIVE, "main", "beacon.conf") == "power=35\n" and "beacon=147.330" in (show(ARCHIVE, "main", "ridge.conf") or ""),
)
check("Your uncommitted change to ridge.conf is gone", lambda: read("~/stations/ridge.conf") == show("~/stations", "HEAD", "ridge.conf"))
check("Your main and the archive's match", lambda: rev("~/stations", "main") == rev(ARCHIVE, "main"))
```

## Hidden checks

```python
expect(
    "Nothing else in the archive changed",
    lambda: sorted(tracked(ARCHIVE, "main")),
    ["beacon.conf", "heartbeat.conf", "ridge.conf", "valley.conf"],
)
expect("ridge.conf is as the archive had it", lambda: show(ARCHIVE, "main", "ridge.conf"), "callsign=KR-RIDGE\nfrequency=147.330\nbeacon=147.330\n")
```

## Solution

```bash
cd stations
git --no-pager log --oneline --stat
git restore --source 693bedc~1 valley.conf heartbeat.conf
git restore ridge.conf
git add valley.conf heartbeat.conf
git commit -m "Restore the valley and heartbeat settings"
git push
```

## Restored

The valley's relay starts on the first try. Pell's commit is still in the history, with your repair right after it, so anyone can see what went wrong and how it was put right. The archive is whole, and so is the line: Kestrel Ridge, the relays, and the valley, each with a record of everything that's happened to them.
