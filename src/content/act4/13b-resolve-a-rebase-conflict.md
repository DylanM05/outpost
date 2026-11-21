---
id: resolve-a-rebase-conflict
kind: terminal
title: Resolve a rebase conflict
system: Conflict desk
symbol: controller
scene: repo
repo: ~/tools
skills: branches
---

## Briefing

Your `ridge-tune` branch adds a `SQUELCH=3` line to `relay.conf`, while `main` raised `GAIN=8` on the exact same bottom of the file. You want a straight linear history by rebasing `ridge-tune` onto `main`, keeping **both** `GAIN=8` and `SQUELCH=3`.

## Objective

In `~/tools`:

1. Rebase `ridge-tune` onto `main` (`git rebase main`).
2. Resolve the conflict in `relay.conf` so it contains:
   ```text
   CHANNEL=4
   GAIN=8
   SQUELCH=3
   ```
3. Stage `relay.conf` and finish the rebase with `git rebase --continue`.

## Concept

Rebasing replays your commits one by one onto the target branch. If a replayed commit touches the same lines that moved on `main`, Git pauses mid-rebase and writes conflict markers into the file.

Look carefully at the marker labels during a rebase — they feel reversed compared to `git merge`:
- `HEAD` is now the commit you're rebasing **onto** (`main`).
- The bottom section is the commit from **your branch** being replayed.

To continue after editing the file and removing all conflict markers:

```bash
git add relay.conf
git rebase --continue
```

Git may open `nano` to confirm the replayed commit's message; save and exit (or run `GIT_EDITOR=true git rebase --continue` to accept the existing message as-is). If you ever want to cancel and go back to before the rebase started, run `git rebase --abort`.

## Hints

1. Stay on `ridge-tune` and run `git rebase main`.
2. Edit `relay.conf` to contain `CHANNEL=4`, `GAIN=8`, and `SQUELCH=3` with no conflict markers.
3. Run `git add relay.conf`, then `GIT_EDITOR=true git rebase --continue` (or `git rebase --continue` and save/exit `nano`).

## Setup

```bash
player_git
mkdir tools
cd tools
git init -q
cat > relay.conf <<'EOF'
CHANNEL=4
GAIN=5
EOF
git add relay.conf
commit_as "Ines Varga" "2026-11-18 08:00" "Add relay configuration"
git switch -q -c ridge-tune
cat > relay.conf <<'EOF'
CHANNEL=4
GAIN=5
SQUELCH=3
EOF
git add relay.conf
commit_as Ranger "2026-11-18 09:00" "Add squelch setting"
git switch -q main
cat > relay.conf <<'EOF'
CHANNEL=4
GAIN=8
EOF
git add relay.conf
commit_as "Mara Okafor" "2026-11-18 09:45" "Raise relay gain to 8"
git switch -q ridge-tune
```

## Checks

```python
EXPECTED = "CHANNEL=4\nGAIN=8\nSQUELCH=3\n"

expect("The repository is back on ridge-tune", lambda: branch("~/tools"), "ridge-tune", "Finish the rebase with git rebase --continue.")
check(
    "ridge-tune sits cleanly on top of main",
    lambda: git("merge-base main ridge-tune", "~/tools") == rev("~/tools", "main"),
    "Rebase ridge-tune onto main rather than merging.",
)
check(
    "History is strictly linear (no merge commits)",
    lambda: all(len(c["parents"]) <= 1 for c in commits("~/tools", "ridge-tune")),
)
expect(
    "relay.conf has both GAIN=8 and SQUELCH=3",
    lambda: show("~/tools", "ridge-tune", "relay.conf"),
    EXPECTED,
)
expect("No rebase is left in progress", lambda: status("~/tools"), [])
```

## Hidden checks

```python
expect(
    "main itself was not modified",
    lambda: show("~/tools", "main", "relay.conf"),
    "CHANNEL=4\nGAIN=8\n",
)
```

## Solution

```bash
cd tools
git rebase main
cat > relay.conf <<'EOF'
CHANNEL=4
GAIN=8
SQUELCH=3
EOF
git add relay.conf
GIT_EDITOR=true git rebase --continue
```

## Restored

`ridge-tune` replays cleanly on top of `main` with both settings intact and a straight commit line.
