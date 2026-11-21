---
id: load-the-config
title: Load the config
system: Control panel
symbol: instrument
scene: tests
skills: config, errors
---

## Briefing

Nothing is worse than a service that boots cleanly and crashes at 3 a.m. when the first request discovers `PORT="abc"` or `API_SECRET=""`. Validate every environment variable **once at startup**, convert it to the right Python type, and fail fast with a clear `ValueError` if anything is missing or invalid.

## Objective

Write `load_config(env)` where `env` is a dict of string environment variables. Return a validated config dictionary with these keys:

- `"port"`: from `env.get("PORT", "8080")`, parsed as `int`, must satisfy `1 <= port <= 65535`.
- `"debug"`: from `env.get("DEBUG", "false")`, case-insensitive: `"true"`, `"1"`, `"yes"` -> `True`; `"false"`, `"0"`, `"no"` -> `False`; any other string is invalid.
- `"database_url"`: from `env.get("DATABASE_URL")`, required non-empty string (after `.strip()`).
- `"api_secret"`: from `env.get("API_SECRET")`, required string at least 16 characters long (after `.strip()`).
- `"allowed_origins"`: from `env.get("ALLOWED_ORIGINS", "")`, split on `","`, stripped, dropping empty entries (`[]` when blank).

If **any** setting is missing or invalid, raise `ValueError` whose message names the invalid variable(s) (e.g., `"PORT"`, `"API_SECRET"`).

```python
load_config({
    "PORT": "8000",
    "DEBUG": "yes",
    "DATABASE_URL": "sqlite:///exchange.db",
    "API_SECRET": "a-very-long-ridge-secret",
    "ALLOWED_ORIGINS": "https://ridge.local, https://valley.local",
})
# {
#   "port": 8000,
#   "debug": True,
#   "database_url": "sqlite:///exchange.db",
#   "api_secret": "a-very-long-ridge-secret",
#   "allowed_origins": ["https://ridge.local", "https://valley.local"],
# }
```

## Concept

Collecting **all** configuration errors into a list before raising one `ValueError` saves operators from a frustrating cycle of fixing one variable, restarting, discovering the next missing variable, and restarting again:

```python
errors = []
if not db_url:
    errors.append("DATABASE_URL is required")
if len(secret) < 16:
    errors.append("API_SECRET must be at least 16 characters")
if errors:
    raise ValueError("; ".join(errors))
```

Never use `bool(env["DEBUG"])` in Python: `bool("false")` is `True` because `"false"` is a non-empty string! Always parse boolean strings explicitly.

## Hints

1. Parse `PORT` inside `try ... except ValueError:` and check `1 <= port <= 65535`.
2. Parse `DEBUG` by lowercasing and stripping, checking membership in `("true", "1", "yes")` vs `("false", "0", "no")`.
3. Collect all error strings in `errors = []` and raise `ValueError("; ".join(errors))` if `errors` is non-empty.

## Starter: guided

```python
def load_config(env):
    errors = []

    raw_port = env.get("PORT", "8080").strip()
    port = None
    try:
        port = int(raw_port)
        if not (1 <= port <= 65535):
            errors.append("PORT must be between 1 and 65535")
    except ValueError:
        errors.append("PORT must be an integer")

    # Parse DEBUG, DATABASE_URL, API_SECRET (>= 16 chars), and ALLOWED_ORIGINS.
    # Raise ValueError("; ".join(errors)) if errors is non-empty.
    return {}
```

## Starter: standard

```python
def load_config(env):
    return {}
```

## Starter: challenge

```python
```

## Checks

```python
good_env = {
    "PORT": "8000",
    "DEBUG": "yes",
    "DATABASE_URL": "sqlite:///exchange.db",
    "API_SECRET": "a-very-long-ridge-secret",
    "ALLOWED_ORIGINS": "https://ridge.local, https://valley.local",
}
expect(
    "loads valid full config",
    lambda: get("load_config")(good_env),
    {
        "port": 8000,
        "debug": True,
        "database_url": "sqlite:///exchange.db",
        "api_secret": "a-very-long-ridge-secret",
        "allowed_origins": ["https://ridge.local", "https://valley.local"],
    },
)
minimal = {"DATABASE_URL": "sqlite:///app.db", "API_SECRET": "0123456789abcdef"}
expect(
    "fills safe defaults for PORT, DEBUG, ALLOWED_ORIGINS",
    lambda: get("load_config")(minimal),
    {
        "port": 8080,
        "debug": False,
        "database_url": "sqlite:///app.db",
        "api_secret": "0123456789abcdef",
        "allowed_origins": [],
    },
)

def _fails_with(env, needle):
    try:
        get("load_config")(env)
        return False
    except ValueError as exc:
        return needle in str(exc)

check("rejects short API_SECRET", lambda: _fails_with({**minimal, "API_SECRET": "short"}, "API_SECRET"))
check("rejects non-integer PORT", lambda: _fails_with({**minimal, "PORT": "abc"}, "PORT"))
check("rejects invalid DEBUG string", lambda: _fails_with({**minimal, "DEBUG": "maybe"}, "DEBUG"))
```

## Hidden checks

```python
check("rejects port 0", lambda: _fails_with({**minimal, "PORT": "0"}, "PORT"))
check("rejects port 70000", lambda: _fails_with({**minimal, "PORT": "70000"}, "PORT"))
check("rejects missing DATABASE_URL", lambda: _fails_with({"API_SECRET": "0123456789abcdef"}, "DATABASE_URL"))
expect("DEBUG='0' parses as False", lambda: get("load_config")({**minimal, "DEBUG": "0"})["debug"], False, "Don't use bool(s) — bool('0') is True!")
expect("DEBUG='TRUE' parses as True", lambda: get("load_config")({**minimal, "DEBUG": "TRUE"})["debug"], True)
check("reports multiple errors at once", lambda: _fails_with({}, "DATABASE_URL") and _fails_with({}, "API_SECRET"), "Collect all errors before raising ValueError.")
```

## Solution

```python
def load_config(env):
    errors = []

    raw_port = str(env.get("PORT", "8080")).strip()
    port = 8080
    try:
        port = int(raw_port)
        if not (1 <= port <= 65535):
            errors.append("PORT must be between 1 and 65535")
    except ValueError:
        errors.append("PORT must be an integer")

    raw_debug = str(env.get("DEBUG", "false")).strip().lower()
    if raw_debug in ("true", "1", "yes"):
        debug = True
    elif raw_debug in ("false", "0", "no"):
        debug = False
    else:
        debug = False
        errors.append("DEBUG must be a boolean value")

    database_url = str(env.get("DATABASE_URL", "")).strip()
    if not database_url:
        errors.append("DATABASE_URL is required")

    api_secret = str(env.get("API_SECRET", "")).strip()
    if len(api_secret) < 16:
        errors.append("API_SECRET must be at least 16 characters")

    raw_origins = str(env.get("ALLOWED_ORIGINS", ""))
    allowed_origins = [part.strip() for part in raw_origins.split(",") if part.strip()]

    if errors:
        raise ValueError("; ".join(errors))

    return {
        "port": port,
        "debug": debug,
        "database_url": database_url,
        "api_secret": api_secret,
        "allowed_origins": allowed_origins,
    }
```

## Restored

Misconfigured services now stop cleanly at boot with every bad environment variable named up front.
