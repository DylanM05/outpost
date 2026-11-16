---
id: make-it-stick
kind: terminal
title: Make it stick
system: Relay services
symbol: equipment
scene: files
skills: programs
---

## Briefing

Adding `~/bin` to `PATH` worked until the shell ended. The next operator, or you after a restart, would get "command not found" all over again. Every new shell should start with the crew's tools on its path.

## Objective

Add the line that puts `~/bin` on the `PATH` to the end of `~/.bashrc`, so every new shell gets it. Then load it into this shell with `source`, and run `beacon-check` by name.

## Concept

Each time bash starts in a terminal, it runs the commands in `~/.bashrc` first. That file is where a shell's settings live: the prompt, aliases, and `PATH` changes. Its name starts with a dot, so `ls` hides it, but `ls -a` shows it.

```bash
nano ~/.bashrc
```

Add your line at the end, below what's already there, and save. Changing the file doesn't change shells that are already running. Either start a new one, or run the file in this shell:

```bash
source ~/.bashrc
```

`source` runs a file's commands in the current shell, instead of in a separate program, so its `export`s stay.

## Hints

1. Open the file with `nano ~/.bashrc`, and move to the end with the Down arrow.
2. Add `export PATH="$HOME/bin:$PATH"` on a line of its own, then save with Ctrl+O and Enter, and exit.
3. Run `source ~/.bashrc`, then `beacon-check`.

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
    "A new shell finds beacon-check",
    lambda: run("bash -lic 'command -v beacon-check' 2>/dev/null").out.strip() == "/home/ranger/bin/beacon-check",
    'Add export PATH="$HOME/bin:$PATH" to the end of ~/.bashrc, on its own line.',
)
check(
    "The rest of ~/.bashrc still works",
    lambda: run("bash -lic 'command -v ls' 2>/dev/null").out.strip() != "",
    "Keep $PATH at the end of the new line, so the folders already on the path stay there.",
)
check(
    "beacon-check ran in this shell",
    lambda: read("~/relay/beacon.checked") == "beacon check: ok\n" and "beacon-check" in commands(),
    "Run source ~/.bashrc, then beacon-check by name.",
)
```

## Solution

```bash
# A player adds the line in nano. echo with >> appends it unattended.
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
beacon-check
```

## Restored

Now every shell on the relay starts with the crew's tools on hand. Nobody has to remember the `export` again.
