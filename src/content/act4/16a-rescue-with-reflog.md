---
id: rescue-with-reflog
kind: terminal
title: Rescue lost commits with reflog
system: Forensic bench
symbol: instrument
scene: repo
repo: ~/tools
skills: git-history, undoing
---

## Briefing

Disaster in `~/tools`: someone ran `git reset --hard HEAD~2` on `main` by mistake, wiping out two committed scripts (`telemetry.py` and `alerts.py`) that hadn't been pushed anywhere yet.

`git log` doesn't show them at all anymore. Fortunately, Git keeps a private journal of every movement of `HEAD` called the **reflog** — and those commits are still sitting inside `.git/objects` waiting to be rescued.

## Objective

In `~/tools`:

1. Inspect `git reflog` to find the commit `HEAD` pointed to right before the accidental `reset: moving to HEAD~2`.
2. Restore `main` to that lost commit (`git reset --hard <hash>` or `git reset --hard HEAD@{1}`) so both `telemetry.py` and `alerts.py` are back on `main`.

## Concept

When you reset or delete a branch, Git does **not** immediately delete the commit objects from disk. Instead, it logs every position `HEAD` has visited in the **reflog**:

```bash
git reflog
```

Typical output looks like:

```text
a1b2c3d HEAD@{0}: reset: moving to HEAD~2
9f8e7d6 HEAD@{1}: commit: Add alert thresholds
4c5d6e7 HEAD@{2}: commit: Add telemetry exporter
```

Once you see the lost hash (`9f8e7d6`, or `HEAD@{1}`), you can jump straight back to it:

```bash
git reset --hard 9f8e7d6
```

Reflog entries are local to your machine and stay around for weeks before garbage collection prunes unreachable objects — which makes `git reflog` the ultimate safety net for local Git mistakes.

## Hints

1. Run `git reflog` inside `~/tools`.
2. Look for the line just below `reset: moving to HEAD~2` — its message is `"Add alert thresholds"`.
3. Run `git reset --hard <that-hash>` (or `git reset --hard HEAD@{1}`) and verify `ls` shows `telemetry.py` and `alerts.py` again.

## Setup

```bash
player_git
mkdir tools
cd tools
git init -q
printf 'STATION = "KR-RIDGE"\n' > station.py
git add station.py
commit_as "Ines Varga" "2026-11-18 08:00" "Add station config"
printf 'def emit(temp): return f"TEMP={temp}"\n' > telemetry.py
git add telemetry.py
commit_as Ranger "2026-11-18 09:00" "Add telemetry exporter"
printf 'MAX_TEMP = 75\n' > alerts.py
git add alerts.py
commit_as Ranger "2026-11-18 09:30" "Add alert thresholds"
git reset -q --hard HEAD~2
```

## Checks

```python
expect("The repository is on main", lambda: branch("~/tools"), "main")
expect(
    "All three commits are back on main",
    lambda: [c["message"] for c in commits("~/tools", "main")],
    ["Add alert thresholds", "Add telemetry exporter", "Add station config"],
    "Use git reflog to find the commit before reset, then git reset --hard <hash>.",
)
expect(
    "telemetry.py and alerts.py are restored in the working tree",
    lambda: tracked("~/tools", "main"),
    ["alerts.py", "station.py", "telemetry.py"],
)
expect("Working tree is clean", lambda: status("~/tools"), [])
```

## Hidden checks

```python
expect("alerts.py has its original contents", lambda: read("~/tools/alerts.py"), "MAX_TEMP = 75\n")
expect("telemetry.py has its original contents", lambda: read("~/tools/telemetry.py"), 'def emit(temp): return f"TEMP={temp}"\n')
```

## Solution

```bash
cd tools
git --no-pager reflog
git reset --hard HEAD@{1}
```

## Restored

Both "lost" commits are back on `main` down to the exact original hashes. Nothing committed in Git is truly gone while it's still in the reflog.
