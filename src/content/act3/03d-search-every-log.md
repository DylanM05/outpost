---
id: search-every-log
kind: terminal
title: Search every log
system: Log store
symbol: instrument
scene: files
skills: reading-files
---

## Briefing

`KR-RELAY-4`'s antenna faults started after somebody worked on its mast. The work was logged, but the relay keeps a separate log file for each day, in its own folder, and nobody remembers which day it was.

## Objective

Use `grep` to search every file in `~/logs/daily` at once for `antenna`, and report the day the antenna was worked on.

## Concept

`grep` can search more than one file. List several files, and it prints each match with the name of the file it came from:

```bash
grep antenna logs/daily/2026-11-10.log logs/daily/2026-11-11.log
```

Typing every name out is slow. The shell can do it for you: `*` is a **wildcard** that matches any characters in a name, so `logs/daily/*.log` means every file in `logs/daily` whose name ends in `.log`. The shell replaces it with the full list of names before `grep` runs.

Or give `grep` a folder and the `-r` option (**r**ecursive), and it searches every file inside it, including files in folders within folders:

```bash
grep -r antenna logs/daily
```

## Hints

1. Search the folder with `grep -r antenna logs/daily`, or every log in it with `grep antenna logs/daily/*.log`.
2. Each match starts with the name of the file it's in.
3. The files are named by date. Report the date from the file name, like `2026-11-10`.

## Setup

```bash
mkdir -p logs/daily
python3 - <<'EOF'
notes = {
    12: "crew on the KR-RELAY-4 mast: antenna mount replaced, cable rerouted",
}
for day in range(8, 16):
    lines = []
    for hour in range(6, 22, 2):
        lines.append(f"{hour:02d}:00 KR-RELAY-4 heartbeat ok")
        if day in notes and hour == 12:
            lines.append(f"12:40 {notes[day]}")
        if day == 14 and hour == 10:
            lines.append("10:20 KR-RELAY-4 FAULT current out of range")
    open(f"logs/daily/2026-11-{day:02d}.log", "w").write("\n".join(lines) + "\n")
EOF
```

## Report

On which day was the antenna worked on?

```text
2026-11-12
```

## Checks

```python
check("You searched with grep", ran("grep"), "Run grep with -r and the folder, or with a wildcard for the files.")
expect(
    "You reported the day of the antenna work",
    answer(),
    "2026-11-12",
    "The file name in front of the match is the date.",
    accept=lambda given: given.removesuffix(".log").split("/")[-1] == "2026-11-12",
    reveal=False,
)
```

## Solution

```bash
grep -r antenna logs/daily
```

## Restored

November 12th: a new antenna mount went up, and the faults began two days later. The crew who fitted it gets a call, and the mount goes on the repair list.
