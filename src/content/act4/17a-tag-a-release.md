---
id: tag-a-release
kind: terminal
title: Tag a release
system: Release rack
symbol: equipment
scene: repo
repo: ~/logscan
skills: commits, remotes
---

## Briefing

`logscan` is ready for its first winter release. Branch names like `main` keep moving forward with every commit, so when a station reports a bug on "last Tuesday's build", a branch name isn't enough.

Create an **annotated tag** `v1.0.0` pointing to `main`'s current commit and push the tag to the shared archive `/srv/archive/logscan.git`.

## Objective

In `~/logscan`:

1. Create an annotated tag named `v1.0.0` on `main`'s latest commit with a message (e.g. `git tag -a v1.0.0 -m "First winter release"`).
2. Push the `v1.0.0` tag to `origin` (`/srv/archive/logscan.git`).

## Concept

A **tag** pins a human-readable name (usually a semantic version like `v1.0.0`) permanently to a specific commit. Unlike branches, tags don't move when new commits land.

Git has two kinds of tags:
- **Lightweight tag:** `git tag v1.0.0` — just a pointer to a commit hash.
- **Annotated tag:** `git tag -a v1.0.0 -m "First winter release"` — stored as a full Git object with tagger name, date, and release message. Use annotated tags for real releases!

Important gotcha: **`git push` does not push tags by default.** Push a tag explicitly:

```bash
git push origin v1.0.0
# or push all local tags at once:
git push origin --tags
```

## Hints

1. Inside `~/logscan`, run `git tag -a v1.0.0 -m "First winter release"`.
2. Check it with `git show v1.0.0` — notice the `Tagger:` and message header that only annotated tags carry.
3. Push it with `git push origin v1.0.0`.

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
printf 'print("logscan v1.0.0")\n' > logscan.py
git add logscan.py
commit_as "Ines Varga" "2026-11-18 08:00" "Prepare logscan 1.0.0"
cd
git clone -q --bare logscan /srv/archive/logscan.git
rm -rf logscan
git clone -q /srv/archive/logscan.git
```

## Checks

```python
ARCHIVE = "/srv/archive/logscan.git"

expect(
    "v1.0.0 is an annotated tag locally",
    lambda: git("cat-file -t refs/tags/v1.0.0", "~/logscan"),
    "tag",
    "Create an annotated tag with git tag -a v1.0.0 -m '...'.",
)
check(
    "Local tag v1.0.0 points to main's latest commit",
    lambda: rev("~/logscan", "v1.0.0") == rev("~/logscan", "main"),
)
expect(
    "v1.0.0 is pushed to the archive as an annotated tag",
    lambda: git("cat-file -t refs/tags/v1.0.0", ARCHIVE),
    "tag",
    "Push the tag explicitly: git push origin v1.0.0.",
)
check(
    "The archive's v1.0.0 points to main",
    lambda: rev(ARCHIVE, "v1.0.0") == rev(ARCHIVE, "main"),
)
```

## Hidden checks

```python
check(
    "The annotated tag has a non-empty message",
    lambda: bool(git("tag -n1 v1.0.0", ARCHIVE).replace("v1.0.0", "").strip()),
)
```

## Solution

```bash
cd logscan
git tag -a v1.0.0 -m "First winter release"
git push origin v1.0.0
```

## Restored

`v1.0.0` is pinned in the archive with your signature and message, so any relay can check out the exact 1.0.0 release months from now.
