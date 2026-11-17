---
id: clone-the-archive
kind: terminal
title: Clone the archive
system: Shared archive
symbol: controller
scene: repo
repo: ~/stations
skills: remotes
---

## Briefing

So far the valley has sent you copies of its repositories. From now on, the station settings live in the archive at `/srv/archive/stations.git`, and everyone works on them from there: the valley, and now the ridge. Get your own copy to work in.

## Objective

Clone the archive's `stations` repository into `~/stations`.

## Concept

`git clone` makes a full copy of a repository:

```bash
git clone /srv/archive/stations.git
```

The copy has every commit and every branch. Git also sets up the place you cloned from as the remote `origin`, fetches its branches as `origin/main` and so on, and checks out `main` for you to work on. It's everything from the last three missions, in one command.

The new folder is named after the repository, without `.git`: here, `stations`, inside the folder you're in. To choose a different name, add it at the end: `git clone /srv/archive/stations.git settings`.

## Hints

1. Run it from your home folder, so the copy lands in `~/stations`.
2. `git clone` takes where the repository is.
3. Run `git clone /srv/archive/stations.git`, then `cd stations` and `git log --oneline`.

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
```

## Checks

```python
check("~/stations is a repository", lambda: is_repo("~/stations"), "Run git clone /srv/archive/stations.git from your home folder.")
expect("Its origin is the archive", lambda: git("remote get-url origin", "~/stations").rstrip("/"), "/srv/archive/stations.git")
expect("main has the archive's history", lambda: rev("~/stations", "main"), "ef9d794c5d97294cb021d0a8a4aa9eaa8cf007cd", reveal=False)
check("Its files are checked out", lambda: listing("~/stations") == ["beacon.conf", "heartbeat.conf", "ridge.conf", "valley.conf"])
```

## Solution

```bash
git clone /srv/archive/stations.git
cd stations
git --no-pager log --oneline
```

## Restored

`~/stations` is the ridge's own copy of the archive's settings, with all their history, already connected to the archive.
