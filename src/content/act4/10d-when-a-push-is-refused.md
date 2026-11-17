---
id: when-a-push-is-refused
kind: terminal
title: When a push is refused
system: Shared archive
symbol: controller
scene: repo
repo: ~/stations
skills: remotes
---

## Briefing

You committed the ridge's beacon frequency in `~/stations` this morning, and didn't push it. While you were out on the ridge, Tomas pushed a change of his own to the archive. Now your push won't go through.

## Objective

Get your commit, `Add the ridge beacon frequency`, into the archive, without losing Tomas's commit.

## Concept

Try `git push`, and the archive refuses:

```text
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to '/srv/archive/stations.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally.
```

The archive's `main` has a commit yours doesn't. Pushing would replace its `main` with yours, and Tomas's commit would be lost, so Git won't do it. Bring his work into yours first, then push:

```bash
git pull
git push
```

Both branches have moved on, so the pull makes a merge commit, and opens `nano` for its message. Save and exit to keep the one Git wrote, or add `--no-edit` to the pull. Then the archive's `main` is part of your history, and the push goes through.

`git pull` can combine the two lines by merging or by rebasing. A new Git install won't pull branches that have both moved on until you choose, and stops with "Need to specify how to reconcile divergent branches". This machine is set to merge, with `git config set --global pull.rebase false`; `true` rebases instead. Set it on your own computer too.

Never get round a refused push with `git push --force`. It does exactly what Git just refused to do: it throws away the archive's commits that you don't have.

## Hints

1. Run `git push` to see the refusal for yourself.
2. Run `git pull`. When `nano` opens with the merge message, save and exit.
3. Then run `git push` again.

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
cd stations
echo 'beacon=147.330' >> ridge.conf
git add ridge.conf
commit_as Ranger "2026-11-17 07:45" "Add the ridge beacon frequency"
cd
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
ARCHIVE = "/srv/archive/stations.git"
messages = lambda: [c["message"] for c in commits(ARCHIVE, "main")]
check("The archive has your commit", lambda: "Add the ridge beacon frequency" in messages(), "Pull, then push.")
check(
    "The archive still has Tomas's commit",
    lambda: "Slow the heartbeat to 90 seconds" in messages(),
    "Tomas's commit is gone from the archive. Start over, and pull before pushing instead of forcing.",
)
check("Your main and the archive's match", lambda: rev("~/stations", "main") == rev(ARCHIVE, "main"), "Push after the pull.")
check(
    "The archive's files have both changes",
    lambda: "beacon=147.330" in (show(ARCHIVE, "main", "ridge.conf") or "") and show(ARCHIVE, "main", "heartbeat.conf") == "interval=90\n",
)
```

## Solution

```bash
cd stations
git push
git pull --no-edit
git push
git --no-pager log --oneline --graph
```

## Restored

Both changes are in the archive: Tomas's heartbeat and the ridge's beacon, joined by a merge commit. Nobody's work was thrown away to make room.
