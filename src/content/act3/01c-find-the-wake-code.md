---
id: find-the-wake-code
kind: terminal
title: Find the wake code
system: Relay hut
symbol: equipment
scene: console
skills: shell
---

## Briefing

The next hut down the line, `KR-RELAY-2`, has gone to sleep. The last operator woke it up once with a call that included a code, and nobody wrote the code down. The shell did, though: it keeps a history of every command it runs, and this one still has the last operator's.

## Objective

Find the last operator's wake-up command in the shell's history, run it again without retyping it, and report the code it uses.

## Concept

The shell saves every command you run in its **history**, and keeps it between sessions.

- Press the **Up arrow** to bring back the command before this one. Keep pressing to step further back, and press **Down** to come forward again. Press Enter to run the command shown, or edit it first.
- Run `history` to list the commands with numbers, oldest first.
- Press **Ctrl+C** to abandon whatever you've typed and get a clean prompt.

Retyping a long command is slow and easy to get wrong. Bringing it back with the Up arrow gets it exactly right.

## Hints

1. Run `history` to list the commands the shell remembers. Look for an `echo` that mentions `KR-RELAY-2`.
2. The code is the number in that command.
3. Press the Up arrow until that command comes back, press Enter to run it, then type the code into the report box.

## Setup

```bash
cat > ~/.bash_history <<'EOF'
echo checking the line
date
echo line quiet, waking the next hut
echo wake 7731 KR-RELAY-2
echo KR-RELAY-2 answered
echo signing off
EOF
```

## Report

What's the code in the wake-up command?

```text
7731
```

## Checks

```python
expect("You found the wake code", answer(), "7731", "It's the number in the echo command that mentions KR-RELAY-2.", reveal=False)
check(
    "You sent the wake-up call again",
    lambda: calls("echo").count("wake 7731 KR-RELAY-2") >= 2,
    "Bring the command back with the Up arrow and press Enter to run it.",
)
```

## Solution

```bash
history
echo wake 7731 KR-RELAY-2
```

## Restored

Two huts down, a relay that's been dark all winter clicks awake. `KR-RELAY-2` answers on the line.
