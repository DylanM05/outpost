---
id: react-agent-loop
title: Run a multi-turn tool-calling agent loop
system: Tool bus
symbol: equipment
scene: tests
skills: agent-loops
---

## Briefing

An AI agent isn't magic — at its core it is a **while loop** that sends the message transcript to a model, executes any requested tool call, appends the tool's result back into the transcript, and repeats until the model emits a final answer or hits `max_steps`.

## Concept

Each iteration of the agent loop (`step = 1 .. max_steps`):
1. Call `reply = model_fn(list(messages))` with the conversation so far.
2. If `reply["type"] == "final"`:
   - Append `{"role": "assistant", "content": reply["text"]}` to `messages`.
   - Return `{"status": "completed", "answer": reply["text"], "steps": step, "messages": messages}`.
3. If `reply["type"] == "tool_call"`:
   - Append `{"role": "assistant", "tool_call": {"name": reply["name"], "args": reply["args"]}}` to `messages`.
   - Execute `tool_out = tool_runner(reply["name"], reply["args"])`.
   - Append `{"role": "tool", "name": reply["name"], "result": tool_out}` to `messages`.
4. If the loop finishes `max_steps` iterations without a `"final"` reply:
   - Return `{"status": "max_steps", "answer": None, "steps": max_steps, "messages": messages}`.

Notice that even if `tool_runner` returns an error envelope like `{"ok": False, "error": "..."}`, feeding it back as a `"tool"` message lets the model self-correct on the very next turn!

## Objective

Write `run_agent(model_fn, tool_runner, user_prompt, max_steps=6)` implementing the loop above, starting with `messages = [{"role": "user", "content": user_prompt}]`. Validate `max_steps >= 1` (else `ValueError`).

## Hints

1. Loop `for step in range(1, max_steps + 1):` and pass a copy `list(messages)` to `model_fn` so test harnesses can inspect each turn's exact snapshot.
2. Handle unknown `reply["type"]` by raising `ValueError`.

## Starter: guided

```python
def run_agent(model_fn, tool_runner, user_prompt, max_steps=6):
    if max_steps < 1:
        raise ValueError("max_steps must be >= 1")
    messages = [{"role": "user", "content": user_prompt}]
    for step in range(1, max_steps + 1):
        reply = model_fn(list(messages))
        kind = reply.get("type")
        if kind == "final":
            # Append assistant content and return completed dict
            pass
        elif kind == "tool_call":
            # Append assistant tool_call, run tool_runner, append tool result
            pass
        else:
            raise ValueError(f"unknown reply type: {kind}")
    return {"status": "max_steps", "answer": None, "steps": max_steps, "messages": messages}
```

## Starter: standard

```python
def run_agent(model_fn, tool_runner, user_prompt, max_steps=6):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _two_step():
    def model(msgs):
        if len(msgs) == 1:
            return {"type": "tool_call", "name": "battery", "args": {"unit": "B1"}}
        last_tool = msgs[-1]["result"]
        return {"type": "final", "text": f"Battery is {last_tool['pct']}%"}
    out = get("run_agent")(model, lambda n, a: {"pct": 84}, "Check B1", max_steps=4)
    return (out["status"], out["answer"], out["steps"], len(out["messages"]))
expect("runs tool call then returns final answer", _two_step, ("completed", "Battery is 84%", 2, 4))

def _capped():
    out = get("run_agent")(lambda msgs: {"type": "tool_call", "name": "ping", "args": {}}, lambda n, a: "ok", "loop", max_steps=3)
    return (out["status"], out["answer"], out["steps"])
expect("stops cleanly at max_steps", _capped, ("max_steps", None, 3))
```

## Hidden checks

```python
def _self_correct():
    def model(msgs):
        if len(msgs) == 1:
            return {"type": "tool_call", "name": "read", "args": {"id": "bad"}}
        if not msgs[-1]["result"]["ok"]:
            return {"type": "tool_call", "name": "read", "args": {"id": "good"}}
        return {"type": "final", "text": msgs[-1]["result"]["val"]}
    def runner(name, args):
        return {"ok": True, "val": "online"} if args["id"] == "good" else {"ok": False, "error": "not found"}
    out = get("run_agent")(model, runner, "status", max_steps=5)
    return (out["status"], out["answer"], out["steps"])
expect("feeds tool errors back so model can recover", _self_correct, ("completed", "online", 3))
```

## Solution

```python
def run_agent(model_fn, tool_runner, user_prompt, max_steps=6):
    if max_steps < 1:
        raise ValueError("max_steps must be >= 1")
    messages = [{"role": "user", "content": user_prompt}]
    for step in range(1, max_steps + 1):
        reply = model_fn(list(messages))
        kind = reply.get("type")
        if kind == "final":
            text = reply["text"]
            messages.append({"role": "assistant", "content": text})
            return {"status": "completed", "answer": text, "steps": step, "messages": messages}
        if kind == "tool_call":
            name = reply["name"]
            args = reply["args"]
            messages.append({"role": "assistant", "tool_call": {"name": name, "args": args}})
            result = tool_runner(name, args)
            messages.append({"role": "tool", "name": name, "result": result})
        else:
            raise ValueError(f"unknown reply type: {kind}")
    return {"status": "max_steps", "answer": None, "steps": max_steps, "messages": messages}
```

## Restored

The tool bus runs bounded multi-turn ReAct loops and routes tool errors straight back into the transcript for self-correction.
