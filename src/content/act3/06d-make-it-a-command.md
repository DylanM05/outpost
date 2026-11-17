---
id: make-it-a-command
kind: terminal
title: Make it a command
system: Relay scripts
symbol: controller
scene: files
skills: programs
---

## Briefing

`python3 scripts/status.py` works, but the relay's scheduler runs programs, not Python files. It needs `status.py` to run on its own, like `ls` or `grep` do.

## Objective

Make `~/scripts/status.py` a program that runs on its own:

1. Add the line `#!/usr/bin/env python3` as the very first line of the file.
2. Mark it executable with `chmod +x`.
3. From inside `~/scripts`, run it as `./status.py`.

## Concept

To run a file directly, the system needs two things:

**Permission.** Every file has permissions saying who may read it, change it, and run it (**execute** it). New files can't be run. `chmod +x` adds permission to execute:

```bash
chmod +x status.py
```

`ls -l` shows permissions at the start of each line. An `x` means the file can be run. The security chapter covers the rest.

**An interpreter.** A Python file is text, not processor instructions. The first line can say which program should run it. This line is called the **shebang**, after its first two characters, `#!` ("hash-bang"):

```python
#!/usr/bin/env python3
print("hello")
```

`/usr/bin/env python3` means "run python3, wherever it's installed". To Python, the line is a comment.

Then run the file by its path. The shell doesn't look in your current folder for commands, so `status.py` alone fails with "command not found". `./status.py` means "the `status.py` in this folder".

Shell scripts use the same trick. A file that starts with `#!/bin/sh` runs in `sh`, the original Bourne shell that bash grew from.

## Hints

1. Open the file with `nano scripts/status.py`, add the shebang as a new first line, and save.
2. `chmod +x scripts/status.py` makes it executable. `ls -l scripts` shows the `x`.
3. `cd scripts`, then run `./status.py`.

## Setup

```bash
mkdir -p scripts
printf 'print("KR-RELAY-1 status")\nprint("beacon: 147.330")\n' > scripts/status.py
```

## Checks

```python
check(
    "status.py starts with the shebang",
    lambda: (read("~/scripts/status.py") or "").split("\n")[0].strip() in ("#!/usr/bin/env python3", "#!/usr/bin/python3"),
    "The very first line must be #!/usr/bin/env python3, with nothing before it.",
)
check("status.py is executable", lambda: "x" in (mode("~/scripts/status.py") or "")[:3], "Run chmod +x on it.")
check(
    "./status.py runs on its own",
    lambda: run("./status.py", cwd="~/scripts").out == "KR-RELAY-1 status\nbeacon: 147.330\n",
    "It needs both the shebang line and execute permission.",
)
check(
    "You ran it as ./status.py",
    lambda: any(program in ("./status.py", "scripts/status.py", "~/scripts/status.py", "/home/ranger/scripts/status.py") for program in commands()),
    "From inside ~/scripts, type ./status.py and press Enter.",
)
```

## Solution

```bash
sed -i '1i #!/usr/bin/env python3' scripts/status.py
chmod +x scripts/status.py
cd scripts
./status.py
```

## Restored

`./status.py` runs like any other command. The scheduler picks it up, and the outpost gets its first automatic status report.
