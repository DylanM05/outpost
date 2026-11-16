---
id: local-readings
kind: predict
title: Local readings
system: Battery bank
symbol: equipment
scene: console
skills: functions, reading-code
---

## Briefing

A drain test on the batteries reports several different charge levels, and the crew can't agree which one is real. The answer depends on where each variable lives.

## Objective

Predict exactly what this program prints.

## Concept

Variables created inside a function, including its parameters, are **local**. They exist only while the function is running, and they're separate from variables outside it, even ones with the same name.

```python
level = 10

def drain(level):
    level = level - 3
    return level
```

Inside `drain`, `level` is the parameter. Changing it doesn't touch the `level` outside. The only way a result gets out of a function is through `return`, and a returned value is lost unless something stores it.

This is called **scope**. It's what lets you use short, obvious names inside functions without clashing with the rest of the program.

## Hints

1. Keep separate notes for the `level` outside the function and the `level` inside each call.
2. Defining `drain` prints nothing. The `print` inside it runs each time it's called, before the lines that come after the call.
3. On the second-to-last line, `drain(result)` returns 4, but nothing stores it, so `result` is still 7.

## Program

```python
level = 10

def drain(level):
    level = level - 3
    print(f"inside: {level}")
    return level

result = drain(level)
print(f"outside: {level}")
print(f"result: {result}")
drain(result)
print(f"result: {result}")
```

## Output

```text
inside: 7
outside: 10
result: 7
inside: 4
result: 7
```

## Restored

The drain test agrees with itself once you know where to look. The batteries never lost charge: the real level stayed at 10 the whole time.
