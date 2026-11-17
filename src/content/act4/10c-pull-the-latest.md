---
id: pull-the-latest
kind: terminal
title: Pull the latest
system: Shared archive
symbol: controller
scene: repo
repo: ~/stations
skills: remotes
---

## Briefing

Tomas Reid has slowed the station heartbeat, and pushed the change to the archive. Your `~/stations` is from before that. Get up to date before you change anything else.

## Objective

Bring the archive's latest commits into your `main` in `~/stations`.

## Concept

`git pull` fetches from the remote, then merges the remote's branch into the one you're on. It's `git fetch` and `git merge origin/main` in one command:

```bash
git pull
```

You haven't committed anything since you cloned, so the merge is a fast-forward.

Pull before you start work, so you build on the latest version. The longer you work on an old one, the more your changes and everyone else's drift apart.

## Hints

1. Run `git pull` inside `~/stations`, on `main`.
2. `cat heartbeat.conf` afterwards: the interval should have changed.
3. `git log --oneline` shows Tomas's commit at the top.

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
git clone -q /srv/archive/stations.git /tmp/valley
cd /tmp/valley
sed -i 's/interval=60/interval=90/' heartbeat.conf
git add heartbeat.conf
commit_as "Tomas Reid" "2026-11-17 14:00" "Slow the heartbeat to 90 seconds"
git push -q
cd
rm -rf /tmp/valley
```

## Checks

```python
check(
    "main has Tomas's commit",
    lambda: rev("~/stations", "main") == rev("/srv/archive/stations.git", "main"),
    "Run git pull inside ~/stations.",
)
expect("heartbeat.conf says 90", lambda: read("~/stations/heartbeat.conf"), "interval=90\n")
```

## Solution

```bash
cd stations
git pull
cat heartbeat.conf
```

## Restored

Your copy is up to date: ninety seconds between heartbeats, the same as the archive and the valley.
