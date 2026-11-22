---
id: build-outpost-agent
title: Build the end-to-end Outpost AI assistant
system: Tower audit
symbol: controller
scene: tests
assessment: true
skills: tokenization-context, vector-rag, agent-loops
---

## Briefing

Time to bring the entire signal tower online on your own. Wire together retrieval, permission-guarded tools, repeat-loop breaking, step budgets, and post-answer citation auditing into one production-grade `OutpostAssistant`.

## Concept

Put every piece of Act XV into a single cohesive class:
1. **Vector retrieval:** Pre-normalize each document's embedding (`embed_fn(text)`), filter by metadata when requested, and rank by `(-cosine_similarity, doc_id)`.
2. **Permission-guarded tool execution:** Enforce `role_allowlists` and normalized `/srv/outpost` path jails on any `"path"` argument before invoking tool handlers.
3. **Repeat-safe, step-capped agent loop:** Track canonical JSON call signatures (`json.dumps({"name": name, "args": args}, sort_keys=True, separators=(",", ":"))`); abort with `status="loop_aborted"` if the model tries to execute an identical call more than `max_repeats` times, or `status="max_steps"` if it exhausts `max_steps` without finishing.
4. **Citation audit:** When the model emits `{"type": "final", "text": ...}`, audit all `[doc_id]` citations against the IDs of documents retrieved for this prompt (`retrieved_ids`).

## Objective

Implement `OutpostAssistant(docs, embed_fn, tool_handlers, role_allowlists, allowed_root="/srv/outpost", max_steps=5, max_repeats=2)`:
- `docs`: list of `(doc_id, text, metadata)` tuples indexed on initialization using `embed_fn(text)`.
- `retrieve(self, query, k=3, filters=None)` -> returns top `k` matching documents as `[(doc_id, score, text), ...]` sorted by `(-score, doc_id)`.
- `ask(self, role, prompt, model_fn, k=3, filters=None)`:
  1. Retrieve top `k` snippets with `self.retrieve(prompt, k=k, filters=filters)`.
  2. Start `messages = [{"role": "context", "docs": [{"id": d, "text": t} for d, _, t in hits]}, {"role": "user", "content": prompt}]`.
  3. Loop `step = 1 .. max_steps`, calling `reply = model_fn(list(messages))`:
     - If `reply["type"] == "final"`: audit bracketed `[id]` citations in `reply["text"]` against `[d for d, _, _ in hits]` (`{"cited": [...], "hallucinated": [...], "grounded": bool}` — grounded iff at least one valid citation and zero hallucinated ones). Return:
       `{"status": "completed", "answer": reply["text"], "steps": step, "tools_called": tools_called, "citation_audit": audit}`
     - If `reply["type"] == "tool_call"`:
       - Compute canonical key; if this exact `(name, args)` was already called `>= max_repeats` times in this `ask()` run, immediately return:
         `{"status": "loop_aborted", "answer": None, "steps": step, "tools_called": tools_called, "citation_audit": None}`
       - Otherwise record the call, enforce role allowlist + path jail (if `"path"` in `args`), run the handler (or return `{"ok": False, "error": ...}`), append assistant `tool_call` + `tool` result messages, and continue!
  4. If `max_steps` is exhausted without a `"final"` answer, return:
     `{"status": "max_steps", "answer": None, "steps": max_steps, "tools_called": tools_called, "citation_audit": None}`.

## Hints

1. Keep `tools_called` as a list of tool name strings attempted (or permitted? Record every non-aborted tool call's name in `tools_called` so callers can audit what the agent tried!).
2. Remember to check `posixpath.normpath` and trailing `"/"` on `allowed_root` so `/srv/outpost_other` cannot slip past `/srv/outpost`.
3. Use `re.findall(r"\[([A-Za-z0-9_-]+)\]", answer)` with `dict.fromkeys` for citation auditing.

## Starter: guided

```python
import json
import math
import posixpath
import re


class OutpostAssistant:
    def __init__(self, docs, embed_fn, tool_handlers, role_allowlists, allowed_root="/srv/outpost", max_steps=5, max_repeats=2):
        self.embed_fn = embed_fn
        self.handlers = dict(tool_handlers)
        self.allowlists = {r: set(ts) for r, ts in role_allowlists.items()}
        self.root = posixpath.normpath(allowed_root)
        self.max_steps = max_steps
        self.max_repeats = max_repeats
        self.index = []
        # Index normalized embeddings for each (doc_id, text, metadata)

    def retrieve(self, query, k=3, filters=None):
        return []

    def ask(self, role, prompt, model_fn, k=3, filters=None):
        return {"status": "max_steps", "answer": None, "steps": 0, "tools_called": [], "citation_audit": None}
```

## Starter: standard

```python
import json
import math
import posixpath
import re


class OutpostAssistant:
    def __init__(self, docs, embed_fn, tool_handlers, role_allowlists, allowed_root="/srv/outpost", max_steps=5, max_repeats=2):
        pass

    def retrieve(self, query, k=3, filters=None):
        pass

    def ask(self, role, prompt, model_fn, k=3, filters=None):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _embed(text):
    t = text.lower()
    return [float("battery" in t or "power" in t), float("radio" in t or "signal" in t), float("water" in t)]

def _e2e():
    docs = [
        ("man-pow", "Reset battery breaker B2 for power recovery.", {"sector": "power"}),
        ("man-rad", "Align radio antenna dish north for signal.", {"sector": "comms"}),
    ]
    handlers = {
        "read_file": lambda a: f"contents:{a['path']}",
        "reboot": lambda a: "rebooted",
    }
    allow = {"viewer": ["read_file"], "operator": ["read_file", "reboot"]}
    bot = get("OutpostAssistant")(docs, _embed, handlers, allow, max_steps=5, max_repeats=2)

    def model(msgs):
        if len(msgs) == 2:
            return {"type": "tool_call", "name": "read_file", "args": {"path": "/srv/outpost/status.txt"}}
        top_id = msgs[0]["docs"][0]["id"]
        return {"type": "final", "text": f"Checked {msgs[-1]['result']['result']}; follow [{top_id}]."}

    res = bot.ask("viewer", "How do I recover battery power?", model, k=1)
    return (res["status"], res["steps"], res["tools_called"], res["citation_audit"])
expect("retrieves docs, runs allowed tool, and audits grounded citation", _e2e, (
    "completed",
    2,
    ["read_file"],
    {"cited": ["man-pow"], "hallucinated": [], "grounded": True},
))

def _guard_and_hallucination():
    docs = [("man-1", "Power manual", {})]
    bot = get("OutpostAssistant")(docs, _embed, {"reboot": lambda a: "boom"}, {"viewer": []})
    def model(msgs):
        if len(msgs) == 2:
            return {"type": "tool_call", "name": "reboot", "args": {}}
        err = msgs[-1]["result"]["error"]
        return {"type": "final", "text": f"Blocked ({err}) per [man-999]."}
    res = bot.ask("viewer", "battery", model, k=1)
    return (res["status"], "permission denied" in res["answer"], res["citation_audit"]["grounded"], res["citation_audit"]["hallucinated"])
expect("blocks unauthorized tool and flags hallucinated citation", _guard_and_hallucination, ("completed", True, False, ["man-999"]))
```

## Hidden checks

```python
def _loop_and_jail():
    docs = [("d1", "radio tower", {})]
    bot = get("OutpostAssistant")(
        docs,
        lambda t: [1.0, 0.0],
        {"read": lambda a: "secret"},
        {"viewer": ["read"]},
        allowed_root="/srv/outpost",
        max_steps=6,
        max_repeats=2,
    )
    # 1. Path traversal must be blocked and fed back
    seen_errors = []
    def bad_path_model(msgs):
        if len(msgs) == 2:
            return {"type": "tool_call", "name": "read", "args": {"path": "/srv/outpost/../etc/passwd"}}
        seen_errors.append(msgs[-1]["result"])
        return {"type": "final", "text": "Refused [d1]."}
    r1 = bot.ask("viewer", "radio", bad_path_model, k=1)

    # 2. Identical loop must abort on 3rd attempt (after 2 allowed repeats)
    r2 = bot.ask(
        "viewer",
        "radio",
        lambda msgs: {"type": "tool_call", "name": "read", "args": {"path": "/srv/outpost/a.txt"}},
        k=1,
    )
    return (seen_errors[0]["ok"], r1["citation_audit"]["grounded"], r2["status"], r2["steps"])
expect("enforces path jail and aborts runaway repeat loops", _loop_and_jail, (False, True, "loop_aborted", 3))
```

## Solution

```python
import json
import math
import posixpath
import re


def _normalize(vec):
    mag = math.sqrt(sum(x * x for x in vec))
    return [0.0 for _ in vec] if mag == 0.0 else [x / mag for x in vec]


class OutpostAssistant:
    def __init__(self, docs, embed_fn, tool_handlers, role_allowlists, allowed_root="/srv/outpost", max_steps=5, max_repeats=2):
        self.embed_fn = embed_fn
        self.handlers = dict(tool_handlers)
        self.allowlists = {r: set(ts) for r, ts in role_allowlists.items()}
        self.root = posixpath.normpath(allowed_root)
        self.max_steps = max_steps
        self.max_repeats = max_repeats
        self.index = [
            (doc_id, text, dict(meta or {}), _normalize(embed_fn(text)))
            for doc_id, text, meta in docs
        ]

    def retrieve(self, query, k=3, filters=None):
        if k <= 0 or not self.index:
            return []
        q = _normalize(self.embed_fn(query))
        scored = []
        for doc_id, text, meta, vec in self.index:
            if filters and any(meta.get(fk) != fv for fk, fv in filters.items()):
                continue
            score = sum(a * b for a, b in zip(q, vec))
            scored.append((doc_id, score, text))
        scored.sort(key=lambda item: (-item[1], item[0]))
        return scored[:k]

    def _path_allowed(self, path):
        if not isinstance(path, str) or not path.startswith("/"):
            return False
        norm = posixpath.normpath(path)
        prefix = "/" if self.root == "/" else self.root + "/"
        return norm == self.root or norm.startswith(prefix)

    def _dispatch(self, role, name, args):
        if name not in self.allowlists.get(role, set()):
            return {"ok": False, "error": "permission denied"}
        if name not in self.handlers:
            return {"ok": False, "error": f"unknown tool: {name}"}
        if isinstance(args, dict) and "path" in args and not self._path_allowed(args["path"]):
            return {"ok": False, "error": "path outside sandbox"}
        try:
            return {"ok": True, "result": self.handlers[name](args)}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}

    def ask(self, role, prompt, model_fn, k=3, filters=None):
        hits = self.retrieve(prompt, k=k, filters=filters)
        valid_ids = {doc_id for doc_id, _, _ in hits}
        messages = [
            {"role": "context", "docs": [{"id": d, "text": t} for d, _, t in hits]},
            {"role": "user", "content": prompt},
        ]
        tools_called = []
        call_counts = {}

        for step in range(1, self.max_steps + 1):
            reply = model_fn(list(messages))
            kind = reply.get("type")
            if kind == "final":
                text = reply["text"]
                cited = list(dict.fromkeys(re.findall(r"\[([A-Za-z0-9_-]+)\]", text)))
                hallucinated = [c for c in cited if c not in valid_ids]
                audit = {
                    "cited": cited,
                    "hallucinated": hallucinated,
                    "grounded": len(cited) > 0 and len(hallucinated) == 0,
                }
                return {
                    "status": "completed",
                    "answer": text,
                    "steps": step,
                    "tools_called": tools_called,
                    "citation_audit": audit,
                }
            if kind == "tool_call":
                name = reply["name"]
                args = reply["args"]
                sig = json.dumps({"name": name, "args": args}, sort_keys=True, separators=(",", ":"))
                if call_counts.get(sig, 0) >= self.max_repeats:
                    return {
                        "status": "loop_aborted",
                        "answer": None,
                        "steps": step,
                        "tools_called": tools_called,
                        "citation_audit": None,
                    }
                call_counts[sig] = call_counts.get(sig, 0) + 1
                tools_called.append(name)
                messages.append({"role": "assistant", "tool_call": {"name": name, "args": args}})
                result = self._dispatch(role, name, args)
                messages.append({"role": "tool", "name": name, "result": result})
            else:
                raise ValueError(f"unknown reply type: {kind}")

        return {
            "status": "max_steps",
            "answer": None,
            "steps": self.max_steps,
            "tools_called": tools_called,
            "citation_audit": None,
        }
```

## Restored

The signal tower's assistant is online — grounded in verified vector retrieval, protected by role and path sandboxes, guarded against runaway loops, and auditing every citation before replying.
