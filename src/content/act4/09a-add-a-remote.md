---
id: add-a-remote
kind: terminal
title: Add a remote
system: Valley link
symbol: equipment
scene: repo
repo: ~/tools
skills: remotes
---

## Briefing

The archive keeps a copy of the ridge's tools now, in `/srv/archive/tools.git`, where the relay line can reach it. The valley has already added something to its copy. Your repository doesn't know the archive's copy exists yet. Introduce them.

## Objective

Add the archive's copy, `/srv/archive/tools.git`, to `~/tools` as a remote named `origin`.

## Concept

Every copy of a Git repository has the whole history. A **remote** is another copy of the same repository that yours knows by a name, so you can swap commits with it. Most remotes are on a server, often a code hosting site like GitHub, but a remote can be anywhere Git can reach, including a folder on the same machine.

`git remote add` gives one a name:

```bash
git remote add origin /srv/archive/tools.git
```

`origin` is the usual name for the main shared copy, the one everybody's work goes to. `git remote -v` lists your remotes and where they are.

Adding a remote doesn't copy anything yet. It just tells your repository where the other copy is.

Copies that are only for sharing, like the archive's, are **bare** repositories: just the history, with no files checked out to work on. That's why the folder's name ends in `.git`.

## Hints

1. Run it inside `~/tools`.
2. `git remote add` takes the name first, then where the remote is.
3. Run `git remote add origin /srv/archive/tools.git`, then `git remote -v` to check.

## Root setup

```bash
mkdir -p /srv/archive
chown ranger:ranger /srv/archive
```

## Setup

```bash
player_git
mkdir tools
cd tools
git init -q
cat > beacon.py <<'EOF'
# beacon.py: sets the ridge beacon's frequency and power.
FREQUENCY = "147.360"
POWER = 40

print(f"beacon on {FREQUENCY} MHz at {POWER}% power")
EOF
cat > status.py <<'EOF'
# status.py: prints the relay's status.
print("KR-RELAY-1 online")
EOF
printf 'Morning checks\n- beacon lamp\n- relay heartbeat\n- antenna guy wires\n' > checklist.txt
git add .
commit_as Ranger "2026-11-16 08:00" "Add the ridge tools"
sed -i 's/147.360/147.330/' beacon.py
git add beacon.py
commit_as Ranger "2026-11-16 08:40" "Fix the beacon frequency"
echo '- antenna current' >> checklist.txt
git add checklist.txt
commit_as Ranger "2026-11-16 09:30" "Add the antenna current check"
git clone -q --bare . /srv/archive/tools.git
git clone -q /srv/archive/tools.git /tmp/valley-tools
cd /tmp/valley-tools
printf 'Valley archive: Ines Varga, channel 3\nValley relay: Tomas Reid, channel 5\n' > contacts.txt
git add contacts.txt
commit_as "Ines Varga" "2026-11-17 12:00" "Add the valley contact list"
git push -q
cd
rm -rf /tmp/valley-tools
```

## Checks

```python
expect(
    "~/tools has a remote named origin",
    lambda: git("remote", "~/tools").split(),
    ["origin"],
    "Run git remote add origin /srv/archive/tools.git inside ~/tools.",
)
expect(
    "origin is the archive's copy",
    lambda: git("remote get-url origin", "~/tools").rstrip("/"),
    "/srv/archive/tools.git",
    "To fix a mistyped location, git remote set-url origin /srv/archive/tools.git.",
)
```

## Solution

```bash
cd tools
git remote add origin /srv/archive/tools.git
git remote -v
```

## Restored

`origin` is the archive's copy of the ridge's tools. The two repositories know about each other now.
