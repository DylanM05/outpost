---
id: start-a-repository
kind: terminal
title: Start a repository
system: Ridge toolkit
symbol: equipment
scene: repo
repo: ~/tools
skills: commits
---

## Briefing

The ridge's tools live in `~/tools`: the beacon program, the status script, and the morning checklist. Nothing records how they got the way they are. When the beacon was set to the wrong frequency last winter, nobody could say who changed it, when, or what it said before.

Git can only keep a folder's history once the folder is a repository.

## Objective

Make `~/tools` a Git repository. Leave the files in it as they are.

## Concept

A **repository** is a folder whose history Git keeps. `git init` turns the folder you're in into one:

```bash
cd tools
git init
```

Git keeps everything it knows about the repository in a hidden folder inside it, `.git`. `ls -a` shows it. Git looks after `.git` itself, so don't change anything in it by hand. Deleting it deletes the history, and leaves the folder as an ordinary folder again.

`git status` tells you what Git thinks of a repository: which branch you're on, and which files it's keeping track of. Right after `git init`, it says there are no commits yet, and lists your files as **untracked**: Git can see them, but isn't keeping their history yet. That comes next.

The panel beside the terminal shows the repository you're working in, and updates after every command.

## Hints

1. `git init` makes the folder you're in a repository, so go into `~/tools` first.
2. Run `cd ~/tools`, then `git init`.
3. If you ran `git init` in your home folder by mistake, `rm -rf ~/.git` undoes it.

## Setup

```bash
player_git
mkdir tools
cat > tools/beacon.py <<'EOF'
# beacon.py: sets the ridge beacon's frequency and power.
FREQUENCY = "147.360"
POWER = 40

print(f"beacon on {FREQUENCY} MHz at {POWER}% power")
EOF
cat > tools/status.py <<'EOF'
# status.py: prints the relay's status.
print("KR-RELAY-1 online")
EOF
printf 'Morning checks\n- beacon lamp\n- relay heartbeat\n- antenna guy wires\n' > tools/checklist.txt
```

## Checks

```python
check("~/tools is a repository", lambda: is_repo("~/tools"), "Run git init inside ~/tools.")
check(
    "Your home folder isn't a repository",
    lambda: not exists("~/.git"),
    "git init ran in your home folder too. Remove it with rm -rf ~/.git, so only ~/tools is a repository.",
)
expect("The tools are all still there", lambda: listing("~/tools"), ["beacon.py", "checklist.txt", "status.py"])
```

## Solution

```bash
cd tools
git init
git status
```

## Restored

`Initialized empty Git repository`. The ridge's tools have a history now, even if it's empty so far.
