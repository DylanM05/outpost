---
id: write-the-status-script
kind: terminal
title: Write the status script
system: Relay scripts
symbol: controller
scene: files
skills: programs
---

## Briefing

Every hour, someone has to tell the outpost what the relay is doing. A short program can say it the same way every time. Nobody's written it yet, so it's yours.

## Objective

Use `nano` to write a new Python program, `~/scripts/status.py`, that prints exactly these two lines. Then run it with `python3`.

```text
KR-RELAY-1 status
beacon: 147.330
```

## Concept

`nano` makes the file if it doesn't exist yet:

```bash
nano scripts/status.py
```

Type the program, save it with Ctrl+O and Enter, exit with Ctrl+X, then run it:

```bash
python3 scripts/status.py
```

From here on this is how you'll write Python: edit in one program, run in another, read the output, and go back to fix things. If you want to see the file without opening the editor, `cat` it.

Indentation matters in Python, and nano doesn't add it for you. Type the spaces yourself after Enter.

## Hints

1. Run `nano scripts/status.py`. The screen is empty because the file is new.
2. Type two lines, each a `print()` call, and save with Ctrl+O and Enter. Exit with Ctrl+X.
3. Run `python3 scripts/status.py` and compare the output with the objective, character by character.

## Setup

```bash
mkdir -p scripts
```

## Checks

```python
check("~/scripts/status.py exists", is_file("~/scripts/status.py"), "Make it with nano scripts/status.py, and save it with Ctrl+O.")
output = run("python3 scripts/status.py")
check(
    "status.py runs without an error",
    lambda: is_file("~/scripts/status.py") and output.code == 0,
    f"Python reported: {output.err.strip().splitlines()[-1] if output.err.strip() else 'nothing'}",
)
expect(
    "status.py prints the two status lines",
    output.out,
    "KR-RELAY-1 status\nbeacon: 147.330\n",
    "Check capitals, spaces, and the colon.",
)
```

## Solution

```bash
# A player writes the file in nano. printf writes the same file unattended.
printf 'print("KR-RELAY-1 status")\nprint("beacon: 147.330")\n' > scripts/status.py
python3 scripts/status.py
```

## Restored

The status script runs, and the hourly report goes out in the same words every time, without anyone typing it.
