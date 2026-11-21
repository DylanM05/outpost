---
id: revert-a-shared-commit
kind: terminal
title: Revert a shared commit
system: Safe undos
symbol: controller
scene: repo
repo: ~/relay
skills: undoing, remotes
---

## Briefing

Earlier today, someone committed and pushed `"Lower heartbeat timeout to 1 second"` to the shared archive `/srv/archive/relay.git`. Since then, Mara pushed `"Add antenna heating schedule"` on top of it.

Because other stations have already pulled from the archive, you must **not** rewrite history with `git reset`. Instead, record a new commit that cleanly reverses only the bad commit, keeping Mara's later commit intact.

## Objective

In `~/relay`:

1. Find the commit whose message is `"Lower heartbeat timeout to 1 second"`.
2. Reverse it safely with `git revert` (creating a new commit on `main`).
3. Push `main` to `origin`.

## Concept

`git reset` rewrites history — safe on a private branch, dangerous once commits are pushed to a shared archive.

`git revert <commit>` is the safe alternative for shared branches: it computes the exact inverse of `<commit>` and applies it as a **brand-new commit** on top of `HEAD`:

```bash
git log --oneline
git revert --no-edit <hash>
git push
```

- The bad commit stays in history so nobody's clone diverges.
- Every commit made *after* the bad commit stays intact.
- Anyone who runs `git pull` gets the fix cleanly with no force-pushing.

## Hints

1. Run `git log --oneline` in `~/relay` to find the hash for `"Lower heartbeat timeout to 1 second"`.
2. Run `git revert --no-edit <hash>` (or `git revert <hash>` and save/exit `nano`).
3. Run `git push` to send the revert commit to `/srv/archive/relay.git`.

## Root setup

```bash
mkdir -p /srv/archive
chown ranger:ranger /srv/archive
```

## Setup

```bash
player_git
mkdir relay
cd relay
git init -q
printf 'TIMEOUT=30\n' > heartbeat.conf
git add heartbeat.conf
commit_as "Ines Varga" "2026-11-18 08:00" "Add heartbeat timeout"
printf 'TIMEOUT=1\n' > heartbeat.conf
git add heartbeat.conf
commit_as "Pell Hansen" "2026-11-18 09:00" "Lower heartbeat timeout to 1 second"
printf 'HEAT_AT=-15\n' > heater.conf
git add heater.conf
commit_as "Mara Okafor" "2026-11-18 10:00" "Add antenna heating schedule"
cd
git clone -q --bare relay /srv/archive/relay.git
rm -rf relay
git clone -q /srv/archive/relay.git
```

## Checks

```python
ARCHIVE = "/srv/archive/relay.git"
all_commits = lambda: commits(ARCHIVE, "main")
bad = [c["hash"] for c in all_commits() if c["message"] == "Lower heartbeat timeout to 1 second"]
mara = [c["hash"] for c in all_commits() if c["message"] == "Add antenna heating schedule"]

expect(
    "heartbeat.conf is back to TIMEOUT=30 in the archive",
    lambda: show(ARCHIVE, "main", "heartbeat.conf"),
    "TIMEOUT=30\n",
)
expect(
    "Mara's heater.conf is still intact in the archive",
    lambda: show(ARCHIVE, "main", "heater.conf"),
    "HEAT_AT=-15\n",
)
check(
    "History was preserved (both prior commits remain ancestors of main)",
    lambda: bool(bad) and bool(mara) and len(all_commits()) >= 4,
    "Use git revert to add a new commit instead of resetting history.",
)
check(
    "A revert commit was pushed to the archive",
    lambda: rev("~/relay", "main") == rev(ARCHIVE, "main") and "revert" in (latest(ARCHIVE, "main")["message"] or "").lower(),
    "Run git revert <hash> and git push.",
)
```

## Hidden checks

```python
expect("Working tree is clean", lambda: status("~/relay"), [])
check("git revert was used", lambda: len(git_calls("revert")) >= 1)
```

## Solution

```bash
cd relay
git --no-pager log --oneline
git revert --no-edit $(git log --grep="Lower heartbeat timeout" --format=%H -1)
git push
```

## Restored

The 1-second timeout is reversed by a clean new commit on top of `main`. Every station can pull the fix without a single rewritten hash.
