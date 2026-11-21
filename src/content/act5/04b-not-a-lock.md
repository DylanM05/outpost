---
id: not-a-lock
kind: predict
title: Not a lock
system: Battery locker
symbol: controller
scene: console
skills: encapsulation, reading-code
---

## Briefing

The workshop keeps its tool locker's code in a class, and the last engineer thought two underscores made it secret. The night shift thinks they've changed the code. Find out what really happens.

## Objective

Predict exactly what this program prints.

## Concept

An attribute whose name starts with **two** underscores gets special treatment. Inside the class, `self.__code` works as usual. Outside it, Python hides the name by renaming it: it's stored as `_Locker__code`, with the class's name in front.

So outside the class, `locker.__code` doesn't find the attribute. Reading it fails, and assigning to it just makes a *new*, unrelated attribute that happens to be called `__code`. The real one is untouched.

None of this is security. Anyone who knows the rule can reach `locker._Locker__code` directly, and anyone who can read your program can read every attribute in it. Private names, with one underscore or two, are a message to other programmers about how to use a class, not a lock on it. Real secrets don't belong in source code at all.

One underscore is the usual way to mark something private. Two are for the rarer case where a name must not clash with one in a child class, which comes later in the workshop.

## Hints

1. `code_matches` looks at `self.__code`, the one the constructor set, which is stored as `_Locker__code`.
2. `locker.__code = "0-0-0"`, outside the class, makes a separate attribute. The real code is still `4-1-9`.
3. `locker._Locker__code` is the real code, under its stored name.

## Program

```python
class Locker:
    def __init__(self, code):
        self.__code = code

    def code_matches(self, guess):
        return guess == self.__code


locker = Locker("4-1-9")
print(locker.code_matches("4-1-9"))

locker.__code = "0-0-0"
print(locker.code_matches("0-0-0"))
print(locker.code_matches("4-1-9"))
print(locker._Locker__code)
```

## Output

```text
True
False
True
4-1-9
```

## Restored

The night shift's "new code" was a sticky note on the locker door. The real code was where it always was, and anyone patient enough could have read it. The workshop stops keeping its codes in its programs.
