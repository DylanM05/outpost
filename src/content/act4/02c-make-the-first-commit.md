---
id: make-the-first-commit
kind: terminal
title: Make the first commit
system: Ridge toolkit
symbol: equipment
scene: repo
repo: ~/tools
skills: commits
---

## Briefing

The tools are staged. Save them as the first version in the ridge's history.

## Objective

Commit the staged files in `~/tools`, with this message:

```text
Add the ridge tools
```

## Concept

`git commit` saves everything that's staged as a **commit**: a snapshot of the files, together with who made it, when, and a message saying why:

```bash
git commit -m "Add the ridge tools"
```

Each commit also remembers the commit that came before it, so together they form the repository's **history**. Once a change is committed, you can always get back to it.

Write the message as a short summary of what the commit does, as if finishing the sentence "This commit will...": "Add the ridge tools", "Fix the beacon frequency". Someone reading the history later, including you, should be able to tell what each commit is for without opening it.

If you leave out `-m`, Git opens `nano` for you to write the message. Save and exit (Ctrl+O, Enter, Ctrl+X) and the commit is made.

After the commit, `git status` has nothing to commit, apart from the untracked notes, which Git still leaves alone.

## Hints

1. Run the command in `~/tools`, where the repository is.
2. Put the message in quotes, so the shell passes it to Git as one argument.
3. Run `git commit -m "Add the ridge tools"`.

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
printf 'ask valley about the spare antenna\nbeacon sounds rough at night??\n' > tools/notes-to-self.txt
cd tools
git init -q
git add beacon.py status.py checklist.txt
```

## Checks

```python
expect("~/tools has one commit", lambda: len(commits("~/tools")), 1, "Commit once, with git commit -m.")
expect(
    "The commit's message",
    lambda: latest("~/tools")["message"],
    "Add the ridge tools",
    "Give the message in quotes after -m. To try again with the right message, Start over.",
)
expect("The commit holds the three tools", lambda: tracked("~/tools"), ["beacon.py", "checklist.txt", "status.py"])
expect("The commit is signed by you", lambda: latest("~/tools")["author"], "Ranger")
```

## Solution

```bash
cd tools
git commit -m "Add the ridge tools"
git status
```

## Restored

The ridge's tools have their first commit. Whatever happens to them from now on, this version can always come back.
