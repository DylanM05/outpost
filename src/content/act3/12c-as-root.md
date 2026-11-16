---
id: as-root
kind: terminal
title: Change it as root
system: Relay security
symbol: controller
scene: console
skills: permissions
---

## Briefing

The machine-wide radio settings in `/srv/relay/radio/channel.conf` still say 147.360, and they belong to root. Editing them as yourself gets "Permission denied", and that's on purpose: one wrong change here takes the whole line down. You're allowed to make this change, but you have to ask for root's power to do it.

## Objective

Use `sudo` to edit `/srv/relay/radio/channel.conf` and change the frequency to `147.330`. The file must still belong to root afterwards.

When `sudo` asks for your password, it's `outpost`.

## Concept

`sudo` runs one command as root:

```bash
sudo nano /srv/relay/radio/channel.conf
```

It asks for **your** password, not root's, to make sure it's really you at the keyboard. The terminal shows nothing while you type it, not even dots. Type it and press Enter. Only users the system's rules allow can use `sudo` at all, and you're one of them.

Root can read, change, and delete anything on the machine, which is exactly why you don't stay root. Use `sudo` for the one command that needs it, and work as yourself the rest of the time. If a command fails with "Permission denied", first ask whether you should be touching that file at all.

## Hints

1. Try `nano /srv/relay/radio/channel.conf` first: nano warns that the file isn't writable.
2. Run `sudo nano /srv/relay/radio/channel.conf` and type `outpost` when asked for the password.
3. Change `147.360` to `147.330`, save with Ctrl+O and Enter, and exit with Ctrl+X.

## Root setup

```bash
mkdir -p /srv/relay/radio
printf 'callsign=KR-RELAY-1\nfrequency=147.360\nmode=narrow\n' > /srv/relay/radio/channel.conf
chmod 644 /srv/relay/radio/channel.conf
```

## Checks

```python
expect(
    "channel.conf sets the frequency to 147.330",
    lambda: [line for line in (read("/srv/relay/radio/channel.conf") or "").splitlines() if line.startswith("frequency")],
    ["frequency=147.330"],
    "Edit the file with sudo nano, and save it.",
)
check(
    "The other settings are unchanged",
    lambda: [line for line in (read("/srv/relay/radio/channel.conf") or "").splitlines() if not line.startswith("frequency")] == ["callsign=KR-RELAY-1", "mode=narrow"],
    "Only change the frequency line.",
)
expect("channel.conf still belongs to root", lambda: owner("/srv/relay/radio/channel.conf"), "root", "Edit it with sudo instead of taking it over.")
check("You used sudo", lambda: ran("sudo"), "Put sudo in front of the command that needs root.")
```

## Solution

```bash
# A player runs sudo nano and types the password. sudo -S reads it from a pipe
# instead, and -p "" stops it printing a prompt with no newline after it.
echo outpost | sudo -S -p "" sed -i 's/147.360/147.330/' /srv/relay/radio/channel.conf
```

## Restored

The machine-wide setting matches the beacon at last: 147.330, end to end. You used root's power for one command and gave it back.
