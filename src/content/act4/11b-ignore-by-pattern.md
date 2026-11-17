---
id: ignore-by-pattern
kind: terminal
title: Ignore by pattern
system: Ignore list
symbol: instrument
scene: repo
repo: ~/tools
skills: commits
---

## Briefing

The ridge's tools write logs now, and a packaging script fills a `build` folder with the bundle the valley downloads. None of that belongs in the archive, with two exceptions. The archive wants `logs/first-light.log`, the log from the morning the relay came back online. And `docs/build` is the hand-written guide to building the bundle, which is very much worth keeping.

## Objective

Write `~/tools/.gitignore` so that Git ignores:

1. every file ending in `.log`, wherever it is, except `logs/first-light.log`
2. the `build` folder at the top of the repository, but not `docs/build`

You don't need to commit it.

## Concept

`.gitignore` patterns can match many names at once:

| Pattern | Ignores |
|---|---|
| `*.log` | any file ending in `.log`, in any folder. `*` matches any characters within a name. |
| `build/` | any folder named `build`, anywhere |
| `/build/` | only the `build` folder at the top: a `/` at the start ties the pattern to the folder the `.gitignore` is in |
| `!keep.log` | `!` makes an exception, for a file an earlier line ignored |
| `# notes` | a comment |

Order matters: an exception has to come after the line it's an exception to. And Git can't make an exception for a file inside a folder it's ignoring altogether, so ignore `*.log`, not the whole `logs/` folder.

A folder can have its own `.gitignore` too, whose patterns apply only inside that folder. That's useful for rules that belong to one part of a project.

To check a rule, `git check-ignore -v` tells you whether Git ignores a path, and which line is responsible:

```bash
git check-ignore -v logs/2026-11-16.log
```

## Hints

1. Start with two lines, `*.log` and `/build/`, and look at `git status`.
2. Add `!logs/first-light.log` after the `*.log` line.
3. Check with `git check-ignore -v`, and with `git status`: first-light, the logs README, and `docs/` should still be listed.

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
mkdir -p logs build docs/build
printf '06:00 beacon on 147.330\n' > beacon.log
printf '06:02 KR-RELAY-1 INFO heartbeat ok\n' > logs/2026-11-15.log
printf '06:04 KR-RELAY-1 INFO heartbeat ok\n' > logs/2026-11-16.log
printf '05:58 KR-RELAY-1 INFO first light: relay online\n' > logs/first-light.log
printf 'Relay logs. They are thrown away after a week.\n' > logs/README.md
printf 'beacon.py\nstatus.py\n' > build/manifest.txt
printf 'PK' > build/tools.zip
printf 'To build the bundle, run the packaging script from the top folder.\n' > docs/build/how-to-build.md
```

## Checks

```python
IGNORED = ["beacon.log", "logs/2026-11-15.log", "logs/2026-11-16.log", "build/manifest.txt", "build/tools.zip"]
KEPT = ["logs/first-light.log", "logs/README.md", "docs/build/how-to-build.md", "beacon.py"]


def ignored(path):
    return run("git check-ignore -q " + path, "~/tools").code == 0


check("~/tools has a .gitignore", lambda: exists("~/tools/.gitignore"), "Make a file named .gitignore at the top of ~/tools.")
expect("The logs and the build folder are ignored", lambda: [p for p in IGNORED if not ignored(p)], [], "Every path listed should be ignored.")
expect(
    "first-light.log, the README, and docs/build are kept",
    lambda: [p for p in KEPT if ignored(p)],
    [],
    "Every path listed is ignored, and shouldn't be. Check it with git check-ignore -v.",
)
```

## Hidden checks

```python
check("A log in a new folder would be ignored", lambda: ignored("relay/new.log"), "Make the .log pattern match in any folder.")
check("A build folder elsewhere would be kept", lambda: not ignored("relay/build/notes.md"), "Only ignore the build folder at the top.")
```

## Solution

```bash
cd tools
printf '*.log\n!logs/first-light.log\n/build/\n' > .gitignore
git status
git check-ignore -v logs/2026-11-16.log
```

## Restored

The logs and the bundle stay on the ridge, where they're made. The first-light log and the build guide go to the archive.
