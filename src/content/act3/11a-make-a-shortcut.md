---
id: make-a-shortcut
kind: terminal
title: Make a shortcut
system: Operator's bunk
symbol: instrument
scene: console
skills: shell
---

## Briefing

The operator's bunk is where the shift settles in, and the first thing every operator does is make the shell their own. You've typed `ls -la` more times today than you can count. Give it a shorter name, one that every new shell will know.

## Objective

Add an alias named `ll` for `ls -la` to `~/.bashrc`. Load it into this shell with `source`, and use it.

## Concept

An **alias** is a shortcut the shell expands before running a command:

```bash
alias ll='ls -la'
```

After that, typing `ll relay` runs `ls -la relay`. The quotes keep `ls -la` together as one value, and there are no spaces around the `=`, just like a variable.

`alias` on its own lists every alias the shell knows. Yours already has two: `~/.bashrc` sets `ls` to `ls --color=auto`, which is why folders show in blue.

An alias typed at the prompt lasts until the shell ends. To keep it, put the same line in `~/.bashrc`, and `source` it or start a new shell.

## Hints

1. Open `~/.bashrc` in nano. You'll see the two aliases that are already there.
2. Add `alias ll='ls -la'` on a new line, then save and exit.
3. Run `source ~/.bashrc`, then `ll`.

## Checks

```python
defined = run("bash -lic 'alias ll' 2>/dev/null").out.strip()
check(
    "A new shell knows ll as ls -la",
    lambda: re.fullmatch(r"alias ll='ls (-la|-al|-l -a|-a -l)'", defined) is not None,
    "Add alias ll='ls -la' to ~/.bashrc, on a line of its own.",
)
check("You used ll", lambda: "ll" in commands(), "Run source ~/.bashrc, then ll.")
```

## Solution

```bash
# A player adds the line in nano. echo with >> appends it unattended.
echo "alias ll='ls -la'" >> ~/.bashrc
source ~/.bashrc
ll
```

## Restored

Two letters instead of six characters, in every shell from now on. It's a small thing, and it's yours.
