---
id: read-gits-manual
kind: terminal
title: Read Git's manual
system: Archive terminal
symbol: controller
scene: console
skills: commits
---

## Briefing

The archive's instructions say every change you send must come with a short message saying what it does, and that `git commit` takes the message "with an option, so you don't need an editor". They don't say which option. Git's own manual does.

## Objective

Find the option of `git commit` that gives the commit's message on the command line, and report it.

## Concept

Every Git subcommand has a manual page. Any of these opens the one for `git commit`:

```bash
git help commit
git commit --help
man git-commit
```

It opens in `less`, like any manual page: space for the next page, `/` to search, `q` to quit.

For a quick reminder instead of the whole manual, `-h` prints a short summary of a subcommand's options, straight into the terminal:

```bash
git commit -h
```

Git has well over a hundred subcommands, and nobody remembers all their options. Reading the manual is normal, even for people who've used Git for years.

## Hints

1. `git commit -h` lists the options with a short description of each. Look for the one about the message.
2. In the full manual (`git help commit`), type `/message` and press Enter to search for it.
3. It's a single letter, `-m`, and it has a long form too, `--message`.

## Report

Which option of `git commit` gives the message on the command line?

```text
-m
```

## Checks

```python
check(
    "You read the help for git commit",
    lambda: git_calls("help") or any(set(args.split()) & {"-h", "--help"} for args in git_calls("commit")) or "git-commit" in calls("man"),
    "Run git commit -h, or git help commit.",
)
expect(
    "You reported the message option",
    answer().split()[0].split("=")[0] if answer() else "",
    "-m",
    "Look for the option whose description mentions the commit message.",
    accept=lambda value: value in ("-m", "--message"),
    reveal=False,
)
```

## Solution

```bash
git commit -h
```

## Restored

`-m`, for **m**essage. Every change the ridge sends to the archive will say what it's for.
