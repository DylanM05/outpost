---
id: read-the-manual-page
kind: terminal
title: Read the manual page
system: Operator's bunk
symbol: instrument
scene: console
skills: shell
---

## Briefing

Last week you counted faults with `grep FAULT ... | wc -l`. The valley crew says `grep` can count by itself, with the right option, but nobody remembers which one. The relay has every command's manual on board.

## Objective

Open the manual page for `grep` with `man`, find the option that makes `grep` print a count of matching lines instead of the lines themselves, and report it.

## Concept

Almost every command has a **manual page**:

```bash
man grep
```

opens it in `less`, so the same keys work: Space for the next page, `/` to search, `n` for the next match, `q` to quit.

Manual pages share a layout:

- **NAME**: the command and a one-line summary
- **SYNOPSIS**: how to call it. Parts in `[brackets]` are optional, and `...` means "more of these".
- **DESCRIPTION**, then **OPTIONS**: each option, with its short and long forms

Searching works best on words you expect in the description. Here, try `/count`.

`--help` gives a quick summary. `man` is the full manual, and it's there even when there's no internet.

## Hints

1. Run `man grep`.
2. Type `/count` and press Enter. Press `n` until you reach an option whose description is about counting matching lines.
3. Report the short option, a dash and one letter. Press `q` to leave the manual.

## Report

Which option makes grep print a count of matching lines?

```text
-c
```

## Checks

```python
check("You read grep's manual page", lambda: "grep" in calls("man") or any(a.endswith(" grep") for a in calls("man")), "Run man grep.")
expect(
    "You reported the counting option",
    answer(),
    "-c",
    "Search the manual for count.",
    accept=lambda given: given in ("-c", "--count", "c"),
    reveal=False,
)
```

## Solution

```bash
# A player reads the page in less. Piped like this, man prints it instead.
man grep | grep -A 2 -e "-c, --count"
```

## Restored

`grep -c FAULT logs/line.log`: one command where there were two. The crew adds a note to the bunk's cheat sheet.
