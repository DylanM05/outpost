---
id: config-precedence
kind: predict
title: Config precedence
system: Control panel
symbol: instrument
scene: console
skills: config, reading-code
---

## Briefing

The Supply Exchange works on your workbench, and now it has to run continuously on the ridge's production grid — where ports, database paths, and signing secrets differ between development, staging, and production. Never hardcode environment settings in source code: read them from **environment variables**, with a clear precedence order. Trace which setting wins here.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

Production services follow **12-factor configuration**:

1. Real environment variables (`env`) override everything (injected by Docker, systemd, or the platform).
2. A local `.env` file (`dotenv`) fills in anything not already set in the environment.
3. Safe hardcoded defaults (`defaults`) cover non-sensitive settings like `PORT` or `LOG_LEVEL`.
4. **Secrets** (`API_SECRET`, database passwords) must have **no default** — if missing, crash loudly at startup rather than booting with `"dev-secret"`.

## Hints

1. `resolve(key)` checks `env` first, then `dotenv`, then `defaults`.
2. Notice `"PORT"` is in both `env` and `dotenv` — `env` wins (`"9000"`).
3. `"LOG_LEVEL"` is only in `defaults` (`"INFO"`), and `"DEBUG"` is in `dotenv` (`"false"`).

## Program

```python
defaults = {"PORT": "8080", "LOG_LEVEL": "INFO", "DEBUG": "true"}
dotenv = {"PORT": "5000", "DEBUG": "false"}
env = {"PORT": "9000"}


def resolve(key):
    if key in env:
        return env[key]
    if key in dotenv:
        return dotenv[key]
    return defaults.get(key)


for name in ["PORT", "DEBUG", "LOG_LEVEL", "API_SECRET"]:
    print(f"{name}={resolve(name)}")
```

## Output

```text
PORT=9000
DEBUG=false
LOG_LEVEL=INFO
API_SECRET=None
```

## Restored

You traced config precedence from process environment down to `.env` and defaults — and spotted the missing secret.
