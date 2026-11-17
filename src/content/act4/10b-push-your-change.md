---
id: push-your-change
kind: terminal
title: Push your change
system: Shared archive
symbol: controller
scene: repo
repo: ~/stations
skills: remotes
---

## Briefing

The ridge has a beacon of its own now, and the archive's settings for the ridge don't mention it. Add it, and this time, send the change to the archive yourself.

## Objective

In `~/stations`:

1. Add the line `beacon=147.330` to the end of `ridge.conf`.
2. Commit it, with the message `Add the ridge beacon frequency`.
3. Push it to the archive.

## Concept

`git push` sends your branch's new commits to the remote, and moves the remote's branch to match:

```bash
git push
```

A clone already knows which remote branch its `main` goes with, `origin/main`, so a plain `git push` is enough. Pushing only sends commits: anything you haven't committed stays on your machine.

After a push, `git status` says your branch is up to date with `origin/main`, and the panel shows `main` and `origin/main` on the same commit.

## Hints

1. `echo 'beacon=147.330' >> ridge.conf` adds the line, or edit it with `nano`.
2. Stage it and commit it as usual.
3. Run `git push`, then `git status`.

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
cd
git clone -q --bare stations /srv/archive/stations.git
rm -rf stations
git clone -q /srv/archive/stations.git
```

## Checks

```python
ARCHIVE = "/srv/archive/stations.git"
expect(
    "The archive has your commit",
    lambda: latest(ARCHIVE, "main")["message"],
    "Add the ridge beacon frequency",
    "Commit, then run git push.",
)
check("It adds the beacon to ridge.conf", lambda: "beacon=147.330" in (show(ARCHIVE, "main", "ridge.conf") or "").splitlines())
expect("It's signed by you", lambda: latest(ARCHIVE, "main")["author"], "Ranger")
check("Your main and the archive's match", lambda: rev("~/stations", "main") == rev(ARCHIVE, "main"))
```

## Solution

```bash
cd stations
echo 'beacon=147.330' >> ridge.conf
git add ridge.conf
git commit -m "Add the ridge beacon frequency"
git push
git status
```

## Restored

The archive knows about the ridge's beacon. Anyone who works on the settings from now on gets your change.
