---
id: meet-git
kind: terminal
title: Meet Git
system: Archive terminal
symbol: controller
scene: console
skills: commits
---

## Briefing

The first message up the line comes from the valley's archive station:

> Good to hear you, Kestrel Ridge. Send us your tools and settings so we can keep them safe. We keep everything in Git, so we can see every change anyone has ever made, and undo the bad ones.

The ridge's tools have never been kept that way. Start by checking that the relay machine has Git.

## Objective

Run Git with the `--version` option to see which version the relay machine has.

## Concept

A **version control system** keeps every saved version of a project: what changed, who changed it, when, and why. You can compare any two versions, go back to an old one, and work on several changes at once without them getting in each other's way. **Git** is the version control system almost every software project uses.

Git is one program, `git`, that does many jobs. You tell it which job with a **subcommand**, the word after `git`:

```bash
git status
git commit -m "Fix the beacon"
```

`status` and `commit` are subcommands. Options and arguments come after the subcommand, as they do for any command.

A few options belong to `git` itself and go before any subcommand. `--version` is one of them: it prints the version and stops.

## Hints

1. Options for Git itself go straight after `git`.
2. Type `git`, a space, then `--version`.
3. Run `git --version`.

## Checks

```python
check(
    "You asked Git for its version",
    lambda: any("--version" in args.split() for args in calls("git")) or git_calls("version"),
    "Run git --version.",
)
```

## Solution

```bash
git --version
```

## Restored

Git answers with its version number. The valley's archive and the ridge can now speak the same language.
