---
id: maintenance-parse-cents
title: Parse dollar strings into exact integer cents
system: Mint bench
symbol: instrument
scene: tests
skills: financial-ledgers
reviewSkill: financial-ledgers
prerequisite: reconcile-statements
---

## Briefing

Converting `"19.99"` with `int(float("19.99") * 100)` can yield `1998` due to binary float inaccuracy! Parse dollar strings directly into integer cents using string splitting and integer math.

## Objective

Write `parse_cents(text)` accepting strings like `"19.99"`, `"$19.99"`, `"-5.05"`, `"-$5.05"`, `"42"`, or `"0.5"` (optional leading `"-"` and optional `"$"`, optional decimal part with 1 or 2 digits; raise `ValueError` for more than 2 decimal digits, non-digits, or empty string).

Return the exact signed integer number of cents.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Strip whitespace, check for a leading `"-"` sign and optional `"$"` (handle both `"-$5.00"` and `"$-5.00"` cleanly if desired, or strip `"-"` then `"$"`).
2. Split on `"."`: whole part must be ASCII digits, fractional part (if present) must be 1 or 2 ASCII digits (right-pad 1 digit with `"0"`). Compute `sign * (int(whole) * 100 + int(frac))`.

## Starter

```python
```

## Checks

```python
expect("parses exact cents without float drift", lambda: [get("parse_cents")(s) for s in ("19.99", "$1.05", "42", "0.5", "-$5.05")], [1999, 105, 4200, 50, -505])
def _bad():
    for bad in ("", "12.345", "abc", "$", "1.2.3"):
        try:
            get("parse_cents")(bad)
            return False
        except ValueError:
            pass
    return True
expect("rejects >2 decimal places and malformed strings", _bad, True)
```

## Hidden checks

```python
expect("parses zero cleanly", lambda: (get("parse_cents")("0"), get("parse_cents")("$0.00")), (0, 0))
```

## Solution

```python
def parse_cents(text):
    if not isinstance(text, str):
        raise ValueError("input must be a string")
    s = text.strip()
    sign = 1
    if s.startswith("-"):
        sign = -1
        s = s[1:]
    if s.startswith("$"):
        s = s[1:]
    if not s or s.count(".") > 1:
        raise ValueError(f"invalid dollar string: {text!r}")
    if "." in s:
        whole, frac = s.split(".")
        if not whole.isascii() or not whole.isdigit():
            raise ValueError("invalid whole dollars")
        if not frac.isascii() or not frac.isdigit() or len(frac) not in (1, 2):
            raise ValueError("expected 1 or 2 decimal digits")
        frac_cents = int(frac) * 10 if len(frac) == 1 else int(frac)
    else:
        if not s.isascii() or not s.isdigit():
            raise ValueError("invalid whole dollars")
        whole = s
        frac_cents = 0
    return sign * (int(whole) * 100 + frac_cents)
```

## Restored

Dollar inputs convert straight into exact integer cents with zero IEEE 754 drift.
