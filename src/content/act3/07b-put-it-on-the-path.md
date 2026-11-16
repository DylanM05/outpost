---
id: put-it-on-the-path
kind: terminal
title: Put it on the path
system: Relay services
symbol: equipment
scene: files
skills: programs
---

## Briefing

The crew keeps its own tools in `~/bin`. One of them, `beacon-check`, tests the beacon, but typing `beacon-check` gets "command not found", even though the file is right there and executable. The shell isn't looking in `~/bin`.

## Objective

Add `~/bin` to the `PATH` of this shell, then run `beacon-check` by its name alone.

## Concept

When you type a command without a path, like `ls`, the shell searches a list of folders for a program with that name. The list is the environment variable `PATH`: folders separated by `:`.

```bash
echo $PATH
```

`which` shows where the shell finds a command:

```bash
which ls
```

To make the shell search another folder, put it at the front of `PATH` and keep everything already there:

```bash
export PATH="$HOME/bin:$PATH"
```

The `$PATH` on the right is the old list, so the new folder goes first and the rest follow. If you leave it out, `PATH` holds only your folder, and `ls`, `cat`, and nearly every other command stop being found. Starting a new shell, or pressing Start over, fixes it.

Like any `export`, this lasts until the shell ends.

## Hints

1. Try `beacon-check` first, and `echo $PATH` to see the folders the shell searches.
2. `export PATH="$HOME/bin:$PATH"` adds `~/bin` in front.
3. Run `beacon-check`. `which beacon-check` should now show `/home/ranger/bin/beacon-check`.

## Setup

```bash
mkdir -p bin relay
cat > bin/beacon-check <<'EOF'
#!/bin/sh
# Tests the beacon and records the result.
echo "beacon check: ok" | tee "$HOME/relay/beacon.checked"
EOF
chmod +x bin/beacon-check
```

## Checks

```python
check(
    "beacon-check ran",
    lambda: read("~/relay/beacon.checked") == "beacon check: ok\n",
    "Add ~/bin to PATH, then run beacon-check.",
)
check(
    "You ran it by name, without a path",
    lambda: "beacon-check" in commands(),
    "Type just beacon-check, with no folder in front, after changing PATH.",
)
check(
    "You added ~/bin to PATH and kept the rest",
    lambda: any("bin" in value and ("$PATH" in value or "${PATH}" in value) for value in assigned("PATH")),
    'Use export PATH="$HOME/bin:$PATH", keeping $PATH at the end.',
)
```

## Solution

```bash
export PATH="$HOME/bin:$PATH"
beacon-check
```

## Restored

`beacon check: ok`. From now on, the crew's own tools work like any other command, as long as this shell lasts.
