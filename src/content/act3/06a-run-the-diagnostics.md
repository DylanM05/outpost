---
id: run-the-diagnostics
kind: terminal
title: Run the diagnostics
system: Relay scripts
symbol: controller
scene: files
skills: programs
---

## Briefing

Until now, your Python has run inside the game. Out here, Python is just another program on the relay, and the crew's tools are Python files sitting in a folder. The first one checks the relay's hardware and prints a diagnostic code.

## Objective

Run the Python program `~/scripts/diagnostics.py` and report the diagnostic code it prints.

## Concept

A program is a file the computer can run. There are two common kinds:

- **Compiled** programs were translated, ahead of time, into instructions the processor runs directly. `ls`, `cat`, and `grep` are compiled programs.
- **Interpreted** programs are run by another program, the **interpreter**, which reads the code and carries it out as it goes. Python works this way.

To run a Python file, run the interpreter, `python3`, and give it the file as an argument:

```bash
python3 scripts/hello.py
```

The program's `print()` output appears in the terminal, and the prompt comes back when the program finishes. Errors look the same as they did in the game: a traceback ending with the error and a line number.

Run `python3` on its own and you get Python's interactive prompt, `>>>`, where each line runs as you type it. Type `exit()` to get back to the shell.

## Hints

1. The interpreter is `python3`, and the file to run goes after it.
2. From your home folder, run `python3 scripts/diagnostics.py`.
3. The code is the value after `code:` in what it prints.

## Setup

```bash
mkdir -p scripts
cat > scripts/diagnostics.py <<'EOF'
# Checks the relay's hardware and prints a diagnostic code.
readings = {"battery": 81, "panel": 64, "antenna": 12, "radio": 97}


def grade(value):
    if value >= 50:
        return "A"
    if value >= 25:
        return "B"
    return "F"


code = ""
for part, value in readings.items():
    print(f"{part:<8} {value:>3}%  {grade(value)}")
    code += grade(value)
print(f"code: {code}-{sum(readings.values())}")
EOF
```

## Report

What diagnostic code does the program print?

```text
AAFA-254
```

## Checks

```python
check("You ran diagnostics.py with python3", lambda: any("diagnostics.py" in arguments for arguments in calls("python3")), "Run python3 followed by the path to the file.")
expect(
    "You reported the diagnostic code",
    answer().upper().removeprefix("CODE:").strip(),
    "AAFA-254",
    "It's on the last line the program prints, after code:.",
    reveal=False,
)
```

## Solution

```bash
python3 scripts/diagnostics.py
```

## Restored

`AAFA-254`: battery, panel and radio all pass, and the antenna fails, just as the fault log said. The diagnostics agree with you.
