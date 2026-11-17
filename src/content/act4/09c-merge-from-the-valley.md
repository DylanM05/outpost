---
id: merge-from-the-valley
kind: terminal
title: Merge from the valley
system: Valley link
symbol: equipment
scene: repo
repo: ~/tools
skills: remotes
---

## Briefing

You've fetched the valley's contact list, and it's useful: the ridge should have it on its own `main`.

## Objective

Bring `origin/main` into your `main` in `~/tools`.

## Concept

A remote-tracking branch can be merged like any other branch. On `main`:

```bash
git merge origin/main
```

You haven't committed anything since the archive got its copy, so this is a fast-forward: your `main` moves up to where `origin/main` is, and the valley's file appears in your folder.

## Hints

1. Be on `main`, inside `~/tools`.
2. Merge the remote-tracking branch by its full name, `origin/main`.
3. Run `git merge origin/main`, then `ls` to see the new file.

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
cd tools
git remote add origin /srv/archive/tools.git
git fetch -q
```

## Checks

```python
check(
    "main has the valley's commit",
    lambda: rev("~/tools", "main") == rev("~/tools", "origin/main") != None,
    "Run git merge origin/main while on main.",
)
expect("The repository is on main", lambda: branch("~/tools"), "main")
check("contacts.txt is in your folder", lambda: "Ines Varga" in (read("~/tools/contacts.txt") or ""))
```

## Solution

```bash
cd tools
git merge origin/main
ls
```

## Restored

The valley's contact list is on the ridge's `main`. The two copies agree again, commit for commit.
