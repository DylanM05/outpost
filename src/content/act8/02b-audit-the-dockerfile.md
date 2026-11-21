---
id: audit-the-dockerfile
title: Audit the dockerfile
system: Container bay
symbol: equipment
scene: tests
skills: containers, security
---

## Briefing

Before any container image is built for Kestrel Ridge's grid, an automated auditor checks its `Dockerfile` for five classic production mistakes: unpinned base images, broken layer caching, baked-in secrets, running as `root`, and missing health checks. Build that auditor.

## Objective

Write `audit_dockerfile(text)` that parses the non-empty, non-comment (`#`) lines of a Dockerfile and returns a sorted list of unique issue codes found:

1. `"unpinned-base"`: any `FROM <image>` line whose `<image>` (ignoring `AS <alias>` and `--platform=...` flags) has no `:` tag or ends with `:latest` (ignore `FROM scratch`).
2. `"cache-bust"`: a `COPY . ` (copying the whole context `.`) appears *before* a `RUN` line that installs packages (`pip install` or `npm ci` or `npm install`).
3. `"baked-secret"`: any `ENV` or `ARG` line whose variable name contains `SECRET`, `PASSWORD`, or `API_KEY` (case-insensitive).
4. `"runs-as-root"`: the Dockerfile has no `USER` instruction, or its **last** `USER` instruction is `root` or `0`.
5. `"no-healthcheck"`: the Dockerfile has no `HEALTHCHECK` instruction.

```python
audit_dockerfile("FROM python:latest\nCOPY . .\nRUN pip install -r requirements.txt\n")
# ["cache-bust", "no-healthcheck", "runs-as-root", "unpinned-base"]
```

## Concept

Every one of these five rules prevents a real production incident:

- **Pinned base images (`python:3.14-alpine`, not `python:latest`)**: stops silent upstream breaking changes from breaking your build overnight.
- **Dependency-first `COPY`**: keeps builds fast by reusing the package-install layer.
- **No secrets in `ENV`/`ARG`**: anything in an image layer can be extracted by anyone with `docker history` or `docker inspect`! Inject secrets at runtime instead.
- **Non-root `USER`**: if an attacker exploits your app, running as an unprivileged user limits the blast radius.
- **`HEALTHCHECK`**: tells the container runtime when a wedged process needs restarting.

## Hints

1. Ignore blank lines and lines starting with `#`. Split each instruction into `cmd = parts[0].upper()` and the rest of the line.
2. For `FROM`: skip any tokens starting with `--` (like `--platform=linux/386`), then take the next token as `image`. Flag `"unpinned-base"` if `image != "scratch"` and (`":" not in image` or `image.endswith(":latest")`).
3. Track `copied_all = False` (set when `cmd == "COPY"` and `"."` is a source token before the destination, e.g. `parts[1] == "."`). If `cmd == "RUN"` contains `"pip install"` / `"npm ci"` / `"npm install"` while `copied_all` is `True`, flag `"cache-bust"`.
4. Track `last_user = None` (updated on every `USER <name>`) and `has_healthcheck = False`. After the loop, flag `"runs-as-root"` if `last_user in (None, "root", "0")`, and `"no-healthcheck"` if `not has_healthcheck`.

## Starter: guided

```python
def audit_dockerfile(text):
    issues = set()
    copied_all = False
    last_user = None
    has_healthcheck = False

    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        cmd = parts[0].upper()
        # Check FROM, COPY, RUN, ENV/ARG, USER, and HEALTHCHECK.

    if last_user in (None, "root", "0"):
        issues.add("runs-as-root")
    if not has_healthcheck:
        issues.add("no-healthcheck")
    return sorted(issues)
```

## Starter: standard

```python
def audit_dockerfile(text):
    return []
```

## Starter: challenge

```python
```

## Checks

```python
bad = """
FROM python:latest
ENV API_SECRET=hunter2
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "app.py"]
"""
expect(
    "flags all 5 issues on an unsafe Dockerfile",
    lambda: get("audit_dockerfile")(bad),
    ["baked-secret", "cache-bust", "no-healthcheck", "runs-as-root", "unpinned-base"],
)

good = """
FROM python:3.14-alpine
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
USER appuser
HEALTHCHECK CMD curl -f http://localhost:8080/healthz || exit 1
CMD ["python", "app.py"]
"""
expect("clean Dockerfile returns []", lambda: get("audit_dockerfile")(good), [])
```

## Hidden checks

```python
untagged = """
FROM python
USER 1000
HEALTHCHECK CMD true
"""
expect("FROM without tag flagged as unpinned-base", lambda: get("audit_dockerfile")(untagged), ["unpinned-base"])

root_again = """
FROM --platform=linux/386 alpine:3.24.4 AS build
USER app
USER root
HEALTHCHECK CMD true
"""
expect("switching back to USER root flagged; --platform handled", lambda: get("audit_dockerfile")(root_again), ["runs-as-root"])

scratch_ok = """
FROM scratch
USER 1001
HEALTHCHECK CMD ["/app", "--health"]
"""
expect("FROM scratch is allowed", lambda: get("audit_dockerfile")(scratch_ok), [])

arg_secret = """
FROM node:22-alpine
ARG DB_PASSWORD
USER node
HEALTHCHECK CMD true
"""
expect("ARG with PASSWORD flagged as baked-secret", lambda: get("audit_dockerfile")(arg_secret), ["baked-secret"])
```

## Solution

```python
def audit_dockerfile(text):
    issues = set()
    copied_all = False
    last_user = None
    has_healthcheck = False

    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        cmd = parts[0].upper()

        if cmd == "FROM":
            tokens = [t for t in parts[1:] if not t.startswith("--")]
            if tokens:
                image = tokens[0]
                if image != "scratch" and (":" not in image or image.endswith(":latest")):
                    issues.add("unpinned-base")
        elif cmd == "COPY":
            tokens = [t for t in parts[1:] if not t.startswith("--")]
            if len(tokens) >= 2 and "." in tokens[:-1]:
                copied_all = True
        elif cmd == "RUN":
            rest = line[3:].lower()
            if copied_all and ("pip install" in rest or "npm ci" in rest or "npm install" in rest):
                issues.add("cache-bust")
        elif cmd in ("ENV", "ARG"):
            rest = line[len(cmd):].strip()
            var_name = rest.split("=", 1)[0].split()[0].upper() if rest else ""
            if any(word in var_name for word in ("SECRET", "PASSWORD", "API_KEY")):
                issues.add("baked-secret")
        elif cmd == "USER" and len(parts) >= 2:
            last_user = parts[1].lower()
        elif cmd == "HEALTHCHECK":
            has_healthcheck = True

    if last_user in (None, "root", "0"):
        issues.add("runs-as-root")
    if not has_healthcheck:
        issues.add("no-healthcheck")
    return sorted(issues)
```

## Restored

The container bay rejects unpinned base images, root containers, cache-busting copies, and baked-in secrets before a build ever starts.
