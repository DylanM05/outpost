---
id: report-the-link
kind: terminal
title: Report the link with an exit code
system: Relay console
symbol: instrument
scene: files
skills: streams
---

## Briefing

The relay's watchdog runs `linkcheck.py` every minute and restarts the radio when the link is down. The watchdog doesn't read what programs print. It reads their **exit code**, and `linkcheck.py` always reports success, even when it prints `link down`.

## Objective

Change `~/scripts/linkcheck.py` so it exits with code `1` when the link is down, and `0` when it's up. Keep what it prints the same.

## Concept

Every program ends with an **exit code**, a number for whoever started it. `0` means success. Anything else means something went wrong, and programs use different numbers for different problems.

The shell keeps the last exit code in `$?`:

```bash
ls relay
echo $?
ls no-such-folder
echo $?
```

prints `0` after the first `ls`, and a non-zero code after the second.

A Python program exits with `0` when it reaches the end, and `1` when an error stops it. To choose the code yourself, call `sys.exit`:

```python
import sys

sys.exit(1)
```

The program stops right there, with that exit code.

## Hints

1. Run `python3 scripts/linkcheck.py`, then `echo $?`. The link is down right now, and the code is still `0`.
2. In nano, `import sys` at the top, and call `sys.exit(1)` after the program prints `link down`.
3. Check it: run it again and `echo $?`. You can make the link "up" with `echo up > relay/link.state` to test the other case.

## Setup

```bash
mkdir -p scripts relay
echo down > relay/link.state
cat > scripts/linkcheck.py <<'EOF'
# Checks the link to the next relay and reports it.
import os

with open(os.path.expanduser("~/relay/link.state")) as state:
    link = state.read().strip()

if link == "up":
    print("link up")
else:
    print("link down")
EOF
```

## Checks

```python
# Try both states as the player, then put the player's state back.
saved = read("~/relay/link.state")
down = run("mkdir -p relay && echo down > relay/link.state && python3 scripts/linkcheck.py")
up = run("echo up > relay/link.state && python3 scripts/linkcheck.py")
run("cat > relay/link.state" if saved is not None else "rm relay/link.state", input=saved)

expect("With the link down, it prints link down", down.out, "link down\n")
expect("With the link down, it exits with code 1", down.code, 1, "Call sys.exit(1) when the link is down.")
expect("With the link up, it prints link up", up.out, "link up\n")
expect("With the link up, it exits with code 0", up.code, 0, "Only exit with 1 when the link is down.")
```

## Solution

```bash
# A player edits the program in nano: add import sys and sys.exit(1).
sed -i '1a import sys' scripts/linkcheck.py
sed -i 's/    print("link down")/    print("link down")\n    sys.exit(1)/' scripts/linkcheck.py
python3 scripts/linkcheck.py
echo $?
```

## Restored

The watchdog sees the `1`, restarts the radio, and the link comes back up. Two minutes later, `linkcheck.py` exits with `0`.
