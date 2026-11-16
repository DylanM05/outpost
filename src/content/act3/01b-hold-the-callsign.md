---
id: hold-the-callsign
kind: terminal
title: Hold the call sign
system: Relay hut
symbol: equipment
scene: console
skills: shell
---

## Briefing

Every message on the relay line starts with the call sign of the hut that sent it. This hut's is `KR-RELAY-1`, and you're about to type it a lot. Have the shell remember it for you.

## Objective

Store `KR-RELAY-1` in a shell variable named `callsign`. Then print this line with `echo`, using the variable instead of typing the call sign out:

```text
Calling from KR-RELAY-1
```

## Concept

The shell has **variables**, much like Python. Create one with a name, `=`, and a value, with **no spaces** around the `=`:

```bash
mast=north
```

Put a `$` in front of the name to use it. Before running a command, the shell replaces `$mast` with the variable's value:

```bash
echo The $mast mast is up
```

That prints `The north mast is up`. `echo` never sees `$mast`. The shell swaps in `north` before `echo` runs.

The spaces rule is strict. `mast = north` doesn't make a variable: the shell reads it as a command named `mast` with the arguments `=` and `north`, and reports that there's no such command.

Shell variables last as long as this shell does. Start a new terminal, and they're gone.

## Hints

1. First make the variable: its name, `=`, and the value, with no spaces anywhere.
2. Then run `echo` with the words `Calling from` followed by `$callsign`.
3. Run `callsign=KR-RELAY-1`, then `echo Calling from $callsign`.

## Checks

```python
check(
    "You stored KR-RELAY-1 in callsign",
    lambda: "KR-RELAY-1" in assigned("callsign"),
    "Make the variable with callsign=KR-RELAY-1, with no spaces around the =.",
)
check(
    "echo printed the line using $callsign",
    lambda: any(re.fullmatch(r"Calling from \$\{?callsign\}?", words) for words in calls("echo")),
    "Run echo with the words Calling from, then $callsign, instead of typing the call sign out.",
)
```

## Solution

```bash
callsign=KR-RELAY-1
echo Calling from $callsign
```

## Restored

The relay stamps `KR-RELAY-1` on the head of the message and sends it down the line. You'll never have to type it out again this shift.
