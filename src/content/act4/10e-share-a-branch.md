---
id: share-a-branch
kind: terminal
title: Share a branch
system: Shared archive
symbol: controller
scene: repo
repo: ~/stations
skills: remotes, branches
---

## Briefing

The ridge wants a faster heartbeat than the rest of the line. That affects every station, so Ines wants to review it before it goes on the archive's `main`. Put the change on a branch, and push the branch to the archive for her to look at.

## Objective

In `~/stations`:

1. Make a branch named `ridge-heartbeat`, and switch to it.
2. Add the line `ridge=30` to the end of `heartbeat.conf`, and commit it with the message `Give the ridge its own heartbeat`.
3. Push the branch to the archive, so its upstream is set. Leave `main` alone.

## Concept

A new branch only exists in your repository until you push it. The first time, tell Git which remote it goes to:

```bash
git push -u origin ridge-heartbeat
```

`-u` (short for `--set-upstream`) makes `origin/ridge-heartbeat` the branch's **upstream**, the remote branch it goes with, so from then on a plain `git push` or `git pull` on this branch knows where to go. `git status` mentions it: "Your branch is up to date with 'origin/ridge-heartbeat'".

On code hosting sites like GitHub, GitLab, and Codeberg, you'd now open a **pull request**: a page that asks the project's maintainers to merge your branch, where they can read the changes, comment, and ask for fixes before it goes in. The archive works the same way, by hand: Ines looks at branches pushed to it, and merges the ones that are right.

## Hints

1. `git switch -c ridge-heartbeat` makes the branch and switches to it.
2. Add the line, then stage and commit as usual.
3. Run `git push -u origin ridge-heartbeat`.

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
check("The archive has ridge-heartbeat", lambda: "ridge-heartbeat" in branches(ARCHIVE), "Push the branch with git push -u origin ridge-heartbeat.")
expect(
    "It has your commit",
    lambda: latest(ARCHIVE, "ridge-heartbeat")["message"],
    "Give the ridge its own heartbeat",
)
check("It adds ridge=30", lambda: "ridge=30" in (show(ARCHIVE, "ridge-heartbeat", "heartbeat.conf") or "").splitlines())
expect(
    "The archive's main hasn't changed",
    lambda: rev(ARCHIVE, "main"),
    "ef9d794c5d97294cb021d0a8a4aa9eaa8cf007cd",
    "Commit on the branch, not on main. Start over to try again.",
    reveal=False,
)
expect(
    "The branch's upstream is set",
    lambda: config("branch.ridge-heartbeat.remote", "~/stations"),
    "origin",
    "Push with -u the first time: git push -u origin ridge-heartbeat.",
)
```

## Solution

```bash
cd stations
git switch -c ridge-heartbeat
echo 'ridge=30' >> heartbeat.conf
git add heartbeat.conf
git commit -m "Give the ridge its own heartbeat"
git push -u origin ridge-heartbeat
git status
```

## Restored

`ridge-heartbeat` is waiting in the archive. Ines can read exactly what you changed, and the rest of the line runs on `main` as before until she says yes.
