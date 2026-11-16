---
id: grep-the-faults
kind: terminal
title: Grep for the faults
system: Log store
symbol: instrument
scene: files
skills: reading-files
---

## Briefing

The line log at this hut collects reports from every relay down the valley. Most lines are routine heartbeats. A few say `FAULT`, and they all come from the same relay. Find out which one, without reading six hundred lines by eye.

## Objective

Use `grep` to show only the lines of `~/logs/line.log` that contain `FAULT`, and report which relay sent them.

## Concept

`grep` searches. Give it a pattern and a file, and it prints only the lines that contain the pattern:

```bash
grep heartbeat logs/line.log
```

The search is **case-sensitive**: `FAULT` and `fault` are different patterns. The `-i` option ignores case.

Put the pattern in quotes when it has spaces or symbols in it, so the shell passes it to `grep` as one argument:

```bash
grep "link lost" logs/line.log
```

The name comes from an old editor command, `g/re/p`: **g**lobally search for a **r**egular **e**xpression and **p**rint the matching lines.

## Hints

1. The pattern goes first, then the file: `grep PATTERN FILE`.
2. Run `grep FAULT logs/line.log` from your home folder.
3. Each line names the relay that sent it, in the form `KR-RELAY-n`. Report that name.

## Setup

```bash
mkdir -p logs
python3 - <<'EOF'
lines = []
for i in range(600):
    relay = f"KR-RELAY-{1 + i % 6}"
    minute = 6 * 60 + i * 2
    stamp = f"{minute // 60 % 24:02d}:{minute % 60:02d}"
    if i in (151, 338, 517):
        lines.append(f"{stamp} KR-RELAY-4 FAULT antenna current out of range")
    else:
        lines.append(f"{stamp} {relay} heartbeat ok, no fault")
open("logs/line.log", "w").write("\n".join(lines) + "\n")
EOF
```

## Report

Which relay reported the faults?

```text
KR-RELAY-4
```

## Checks

```python
check("You searched with grep", ran("grep"), "Run grep, then the pattern, then the file.")
expect(
    "You reported the relay with the faults",
    answer().upper(),
    "KR-RELAY-4",
    "Search for FAULT, in capitals, and read the relay name on those lines.",
    reveal=False,
)
```

## Solution

```bash
grep FAULT logs/line.log
```

## Restored

Three faults, all from `KR-RELAY-4`, all about its antenna. The relay itself is fine: something on its mast isn't.
