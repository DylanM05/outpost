---
id: wake-the-relay
kind: terminal
title: Wake the relay
system: Relay hut
symbol: equipment
scene: console
skills: shell
---

## Briefing

The relay line carries every message between Kestrel Ridge and the valley, passed from one hilltop hut to the next. The first hut's relay still has power, but it has no screen to tap and no mouse. All it has is a terminal. Say something to it.

## Objective

In the relay terminal, use the `echo` command to print this line:

```text
relay online
```

## Concept

The dark panel is a **terminal**: a window where you type commands and read what they print. The program that reads your commands and runs them is the **shell**. This one is **bash**, the shell most Linux machines use.

The shell shows a **prompt** when it's ready for a command:

```text
ranger@relay:~$
```

That's your user name (`ranger`), the machine's name (`relay`), and the folder you're in. `~` is short for your home folder. The `$` marks the end of the prompt.

Type a command after the prompt and press Enter. The shell runs it, shows anything it prints, then gives you a new prompt:

```bash
echo hello there
```

`echo` is the **command**: the program to run. `hello there` is its **arguments**: the words after the command, separated by spaces. `echo` prints its arguments back.

The relay is a real Linux computer running inside this page. Nothing you type here can reach your own computer, and Start over puts everything back the way it was.

## Hints

1. Click inside the terminal, then type after the `$`.
2. Type the command, a space, then the words to print. Press Enter to run it.
3. Run `echo relay online`, then press Submit.

## Checks

```python
check("You ran echo", ran("echo"), "Type echo, then a space, then the words to print, and press Enter.")
check(
    "echo printed relay online",
    lambda: "relay online" in calls("echo"),
    "Print exactly relay online: two words, all lowercase.",
)
```

## Solution

```bash
echo relay online
```

## Restored

The relay clicks, and the hut's line lamp turns green. Somewhere down the valley, the next relay hears it.
