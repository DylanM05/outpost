---
id: permission-sandbox
title: Enforce role allowlists and path jails on tools
system: Safety gate
symbol: controller
scene: tests
skills: agent-loops
---

## Briefing

Never trust a prompt to enforce security boundaries! If a read-only diagnostic assistant gets tricked into calling `shutdown_reactor` or reading `/etc/shadow` via `/srv/outpost/../../etc/shadow`, the **tool execution boundary** must refuse the call before the handler ever runs.

## Concept

Two mandatory layers of defense at tool dispatch time:
1. **Role allowlist:** Every `role` (e.g. `"viewer"`, `"operator"`) has an explicit set of permitted tool names. Anything not listed is rejected with `{"ok": False, "error": "permission denied"}`.
2. **Path jail:** If `args` includes a `"path"` string, normalize it with `posixpath.normpath(path)`. It must be an absolute path equal to `root` or strictly inside `root + "/"` — blocking both `..` traversal AND sibling-prefix tricks like `/srv/outpost_private/key`!

## Objective

Implement `GuardedRegistry(handlers, role_allowlists, allowed_root="/srv/outpost")`:
- `handlers`: dict mapping `tool_name -> callable(args)`
- `role_allowlists`: dict mapping `role -> iterable of allowed tool names`
- `allowed_root`: normalized root directory (default `"/srv/outpost"`)
- `call(self, role, tool_name, args)`:
  1. If `tool_name` is not permitted for `role` -> return `{"ok": False, "error": "permission denied"}`.
  2. If `tool_name` is not in `handlers` -> return `{"ok": False, "error": f"unknown tool: {tool_name}"}`.
  3. If `"path"` is in `args`: verify it is a `str`, starts with `"/"`, and after `posixpath.normpath(args["path"])` is either `root` or starts with `root + "/"` (where `root = posixpath.normpath(self.allowed_root)`). Otherwise return `{"ok": False, "error": "path outside sandbox"}`.
  4. Invoke `handlers[tool_name](args)` and return `{"ok": True, "result": res}`.

## Hints

1. Normalize `root = posixpath.normpath(allowed_root)` once in `__init__`, and compute `prefix = "/" if root == "/" else root + "/"`.
2. For a candidate `path`, reject non-strings or relative paths (`not path.startswith("/")`), then check `norm = posixpath.normpath(path)` satisfies `norm == root or norm.startswith(prefix)`.

## Starter: guided

```python
import posixpath


class GuardedRegistry:
    def __init__(self, handlers, role_allowlists, allowed_root="/srv/outpost"):
        self.handlers = dict(handlers)
        self.allowlists = {role: set(names) for role, names in role_allowlists.items()}
        self.root = posixpath.normpath(allowed_root)

    def _path_allowed(self, path):
        if not isinstance(path, str) or not path.startswith("/"):
            return False
        norm = posixpath.normpath(path)
        prefix = "/" if self.root == "/" else self.root + "/"
        return norm == self.root or norm.startswith(prefix)

    def call(self, role, tool_name, args):
        # 1. Check role allowlist
        # 2. Check handler exists
        # 3. If "path" in args, check _path_allowed
        # 4. Call handler and return {"ok": True, "result": ...}
        return {"ok": False, "error": "not implemented"}
```

## Starter: standard

```python
import posixpath


class GuardedRegistry:
    def __init__(self, handlers, role_allowlists, allowed_root="/srv/outpost"):
        pass

    def call(self, role, tool_name, args):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _checks():
    reg = get("GuardedRegistry")(
        {"read_log": lambda a: f"read:{a['path']}", "reboot": lambda a: "rebooted"},
        {"viewer": ["read_log"], "operator": ["read_log", "reboot"]},
        allowed_root="/srv/outpost",
    )
    ok_read = reg.call("viewer", "read_log", {"path": "/srv/outpost/logs/day1.txt"})
    denied_reboot = reg.call("viewer", "reboot", {})
    travers = reg.call("viewer", "read_log", {"path": "/srv/outpost/../etc/passwd"})
    sibling = reg.call("viewer", "read_log", {"path": "/srv/outpost_backup/secret"})
    return (ok_read, denied_reboot["ok"], travers["ok"], sibling["ok"])
expect("enforces allowlists and blocks traversal & sibling prefixes", _checks, ({"ok": True, "result": "read:/srv/outpost/logs/day1.txt"}, False, False, False))
```

## Hidden checks

```python
def _operator_and_relative():
    reg = get("GuardedRegistry")(
        {"read_log": lambda a: a["path"], "reboot": lambda a: "ok"},
        {"operator": ["read_log", "reboot"]},
    )
    op = reg.call("operator", "reboot", {})
    rel = reg.call("operator", "read_log", {"path": "logs/day1.txt"})
    return (op, rel["ok"])
expect("allows operator tools and rejects relative paths", _operator_and_relative, ({"ok": True, "result": "ok"}, False))
```

## Solution

```python
import posixpath


class GuardedRegistry:
    def __init__(self, handlers, role_allowlists, allowed_root="/srv/outpost"):
        self.handlers = dict(handlers)
        self.allowlists = {role: set(names) for role, names in role_allowlists.items()}
        self.root = posixpath.normpath(allowed_root)

    def _path_allowed(self, path):
        if not isinstance(path, str) or not path.startswith("/"):
            return False
        norm = posixpath.normpath(path)
        prefix = "/" if self.root == "/" else self.root + "/"
        return norm == self.root or norm.startswith(prefix)

    def call(self, role, tool_name, args):
        if tool_name not in self.allowlists.get(role, set()):
            return {"ok": False, "error": "permission denied"}
        if tool_name not in self.handlers:
            return {"ok": False, "error": f"unknown tool: {tool_name}"}
        if "path" in args and not self._path_allowed(args["path"]):
            return {"ok": False, "error": "path outside sandbox"}
        return {"ok": True, "result": self.handlers[tool_name](args)}
```

## Restored

Tool calls are now locked behind per-role allowlists and normalized directory jails regardless of what the prompt asks.
