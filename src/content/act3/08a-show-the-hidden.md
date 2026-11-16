---
id: show-the-hidden
kind: terminal
title: Show the hidden files
system: Relay console
symbol: instrument
scene: console
skills: streams
---

## Briefing

The relay's calibration code is kept in `~/relay`, but `ls` there shows only the config folder and a log. Files whose names start with a dot don't show up in a plain listing, and the calibration file is one of them.

## Objective

Use `ls` with the right option to list every file in `~/relay`, including hidden ones. Then report the calibration code stored in the hidden file.

## Concept

Most commands take **options** that change what they do. Short options are a dash and a letter, and long options are two dashes and a word:

```bash
ls -l
ls --all
```

Short options can be combined: `ls -la` is `ls -l -a`. Options usually go before the other arguments.

To find out what options a command has, ask it. Most commands print a summary with `--help`:

```bash
ls --help
```

For the full story, read its manual page with `man ls`. It opens in `less`, so `/` searches and `q` quits.

Files whose names start with `.` are **hidden**. Programs keep settings in them, like `.bashrc`, so they stay out of the way. `ls -a` shows them too, along with `.` and `..`, the current folder and its parent.

## Hints

1. Run `ls --help` and look for the option that shows entries starting with `.`.
2. `ls -a relay` lists everything in the folder, hidden files included.
3. `cat` the hidden file to read the code. Remember the dot at the start of its name.

## Setup

```bash
mkdir -p relay/config
printf 'callsign=KR-RELAY-1\n' > relay/config/radio.conf
echo "06:00 relay started" > relay/relay.log
printf 'calibrated 2026-11-02 by the valley crew\ncode: CAL-5521\n' > relay/.calibration
```

## Report

What's the calibration code?

```text
CAL-5521
```

## Checks

```python
check(
    "You listed hidden files with ls",
    lambda: any(re.search(r"(^|\s)(-[a-zA-Z]*[aA][a-zA-Z]*|--all|--almost-all)(\s|$)", arguments) for arguments in calls("ls")),
    "ls -a shows files whose names start with a dot.",
)
expect(
    "You reported the calibration code",
    answer().upper().removeprefix("CODE:").strip(),
    "CAL-5521",
    "It's in the hidden file in ~/relay, on the line that starts with code:.",
    reveal=False,
)
```

## Solution

```bash
ls --help
ls -a relay
cat relay/.calibration
```

## Restored

`CAL-5521`, from the valley crew's last visit. With the calibration code, the relay's readings line up with the valley's again.
