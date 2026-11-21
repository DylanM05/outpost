---
id: tag-an-older-commit
kind: terminal
title: Retroactively tag and clean up
system: Release rack
symbol: equipment
scene: repo
repo: ~/logscan
skills: commits, remotes
---

## Briefing

Two tag housecleaning chores wait in `~/logscan`:

1. Nobody tagged the earlier commit `"Add the --level option"` as `v0.9.0` before `"Add summary totals"` landed on top of it.
2. Someone accidentally created a mistyped local tag called `v1.0-typo` that needs to be deleted.

## Objective

In `~/logscan`:

1. Tag the earlier commit `"Add the --level option"` with an annotated tag `v0.9.0` (`git tag -a v0.9.0 <hash> -m "..."`).
2. Delete the mistyped local tag `v1.0-typo` (`git tag -d v1.0-typo`).
3. Push `v0.9.0` to `origin` (`/srv/archive/logscan.git`), and do **not** push `v1.0-typo`.

## Concept

You don't have to tag only `HEAD`. Pass any commit hash at the end of `git tag`:

```bash
git log --oneline
git tag -a v0.9.0 <commit-hash> -m "Release 0.9.0"
```

And to delete a mistaken tag:

```bash
git tag -d v1.0-typo               # deletes it locally
git push origin --delete v1.0-typo # if it had already been pushed
```

Cleaning up mistyped tags before running `git push --tags` keeps the shared archive's release list tidy.

## Hints

1. Run `git log --oneline` to find the hash of `"Add the --level option"`.
2. Run `git tag -a v0.9.0 <hash> -m "Logscan 0.9.0"` and `git tag -d v1.0-typo`.
3. Push only the good tag: `git push origin v0.9.0`.

## Root setup

```bash
mkdir -p /srv/archive
chown ranger:ranger /srv/archive
```

## Setup

```bash
player_git
mkdir logscan
cd logscan
git init -q
printf 'print("base")\n' > logscan.py
git add logscan.py
commit_as "Ines Varga" "2026-11-18 08:00" "Initial logscan"
printf 'print("base --level")\n' > logscan.py
git add logscan.py
commit_as "Ines Varga" "2026-11-18 09:00" "Add the --level option"
printf 'print("base --level totals")\n' > logscan.py
git add logscan.py
commit_as "Mara Okafor" "2026-11-18 10:00" "Add summary totals"
cd
git clone -q --bare logscan /srv/archive/logscan.git
rm -rf logscan
git clone -q /srv/archive/logscan.git
cd logscan
git tag v1.0-typo
```

## Checks

```python
ARCHIVE = "/srv/archive/logscan.git"
TARGET = next(c["hash"] for c in commits("~/logscan", "main") if c["message"] == "Add the --level option")

expect(
    "v0.9.0 is an annotated tag locally",
    lambda: git("cat-file -t refs/tags/v0.9.0", "~/logscan"),
    "tag",
)
expect(
    "v0.9.0 points to 'Add the --level option' (not HEAD)",
    lambda: rev("~/logscan", "v0.9.0"),
    TARGET,
    "Pass the hash of 'Add the --level option' to git tag -a v0.9.0 <hash> -m '...'.",
)
expect(
    "v0.9.0 is pushed to the archive pointing to the right commit",
    lambda: rev(ARCHIVE, "v0.9.0"),
    TARGET,
    "Push v0.9.0 with git push origin v0.9.0.",
)
check(
    "v1.0-typo is deleted locally",
    lambda: rev("~/logscan", "v1.0-typo") is None,
    "Delete the mistyped tag with git tag -d v1.0-typo.",
)
check(
    "v1.0-typo was never pushed to the archive",
    lambda: rev(ARCHIVE, "v1.0-typo") is None,
)
```

## Hidden checks

```python
expect("The archive's v0.9.0 is an annotated tag", lambda: git("cat-file -t refs/tags/v0.9.0", ARCHIVE), "tag")
```

## Solution

```bash
cd logscan
git --no-pager log --oneline
git tag -a v0.9.0 $(git log --grep="Add the --level option" --format=%H -1) -m "Logscan 0.9.0"
git tag -d v1.0-typo
git push origin v0.9.0
```

## Restored

`v0.9.0` marks the exact historical milestone in the archive, and the mistyped tag is gone before anyone else ever saw it.
