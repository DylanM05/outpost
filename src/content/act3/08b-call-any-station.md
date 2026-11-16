---
id: call-any-station
kind: terminal
title: Call any station
system: Relay console
symbol: instrument
scene: files
skills: streams
---

## Briefing

The crew's calling program only ever calls `KR-RELAY-2`, because the station is written into the code. Every time they need a different station, someone edits the program. It should take the station from the command line, the way `cat` takes a file name.

## Objective

Change `~/scripts/call.py` so it calls whichever station you give it as the first argument:

```bash
python3 scripts/call.py KR-RELAY-5
```

should print exactly `Calling KR-RELAY-5`.

## Concept

The words after a command are its **arguments**. The ones that aren't options are called **positional arguments**, because their meaning comes from their position: first, second, and so on. In `cp a.txt b.txt`, the first is what to copy and the second is where.

A Python program gets its arguments as a list of strings, `sys.argv`:

```python
import sys

print(sys.argv)
```

Run as `python3 show.py KR-RELAY-5 now`, that prints:

```text
['show.py', 'KR-RELAY-5', 'now']
```

`sys.argv[0]` is the program's own name, so the first real argument is `sys.argv[1]`. Arguments are always strings, even when they look like numbers.

## Hints

1. Open the program with `nano scripts/call.py`. It needs `import sys` at the top.
2. Replace the fixed station with `sys.argv[1]`.
3. Save, then test it with two different stations: `python3 scripts/call.py KR-RELAY-5`.

## Setup

```bash
mkdir -p scripts
cat > scripts/call.py <<'EOF'
# Calls a relay station.
station = "KR-RELAY-2"
print(f"Calling {station}")
EOF
```

## Checks

```python
calling = run("python3 scripts/call.py KR-RELAY-5")
expect(
    "python3 scripts/call.py KR-RELAY-5",
    calling.out,
    "Calling KR-RELAY-5\n",
    "Take the station from sys.argv[1]." if calling.code == 0 else f"Python reported: {(calling.err.strip().splitlines() or [''])[-1]}",
)
```

## Hidden checks

```python
expect("python3 scripts/call.py KR-VALLEY", run("python3 scripts/call.py KR-VALLEY").out, "Calling KR-VALLEY\n")
```

## Solution

```bash
# A player edits the file in nano. printf writes the same program unattended.
printf 'import sys\n\nstation = sys.argv[1]\nprint(f"Calling {station}")\n' > scripts/call.py
python3 scripts/call.py KR-RELAY-5
```

## Restored

`Calling KR-RELAY-5`. The same program now calls the whole valley, and nobody has to edit it again.
