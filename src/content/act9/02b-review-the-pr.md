---
id: review-the-pr
title: Review the pr
system: Review bench
symbol: controller
scene: tests
skills: debugging, security, sql
---

## Briefing

A rushed contributor pasted four AI-generated functions into a pull request for the outpost's order service. Every function looks clean at a glance — and every single one hides a serious bug:

1. `find_orders(conn, username)`: builds SQL with an f-string (**SQL injection**!).
2. `build_adders(offsets)`: captures the loop variable by late binding instead of freezing each offset.
3. `record_alert(msg, log=[])`: shares a mutable default list across callers.
4. `sum_readings(lines)`: uses a bare `except: pass` that swallows bad inputs silently instead of raising `ValueError` on invalid numbers (while ignoring blank lines).

Review the PR carefully and fix all four defects.

## Objective

Fix all four functions in the starter code:

1. `find_orders(conn, username)`: return sorted list of `sku` strings for `username` from `orders(username TEXT, sku TEXT)` using a parameterized `?` query.
2. `build_adders(offsets)`: return a list of functions where the `i`-th function adds `offsets[i]` to its argument `x`.
3. `record_alert(msg, log=None)`: if `log is None`, create a fresh list; append `msg` and return the list (never sharing state across independent calls!).
4. `sum_readings(lines)`: sum the integers in `lines` (skipping empty/whitespace-only strings), and **raise `ValueError`** if any non-empty line is not a valid integer (never silently swallow errors!).

## Concept

Using AI tools responsibly means treating generated code as an untrusted draft:

- **Security:** inspect every SQL query, auth check, and file path for injection or bypasses.
- **Python semantics:** check default arguments (`=None`) and closures inside loops (`offset=offset`).
- **Error handling:** reject silent `except: pass` blocks — hidden failures corrupt totals quietly in production!

## Hints

1. In `find_orders`: `"SELECT sku FROM orders WHERE username = ? ORDER BY sku ASC"` with `(username,)`.
2. In `build_adders`: `[lambda x, step=step: x + step for step in offsets]`.
3. In `record_alert`: `if log is None: log = []`.
4. In `sum_readings`: skip `if not line.strip(): continue`, then call `int(line.strip())` without swallowing `ValueError`.

## Starter

```python
# AI-generated draft PR — review and fix all four subtle defects!


def find_orders(conn, username):
    rows = conn.execute(
        f"SELECT sku FROM orders WHERE username = '{username}' ORDER BY sku ASC"
    ).fetchall()
    return [r[0] for r in rows]


def build_adders(offsets):
    return [lambda x: x + step for step in offsets]


def record_alert(msg, log=[]):
    log.append(msg)
    return log


def sum_readings(lines):
    total = 0
    for line in lines:
        try:
            total += int(line.strip())
        except Exception:
            pass
    return total
```

## Checks

```python
import sqlite3 as _sq

conn = _sq.connect(":memory:")
conn.execute("CREATE TABLE orders (username TEXT, sku TEXT)")
conn.executemany("INSERT INTO orders VALUES (?, ?)", [("mara", "FUEL"), ("ines", "SECRET")])

expect("find_orders returns mara's orders", lambda: get("find_orders")(conn, "mara"), ["FUEL"])
expect("find_orders resists SQL injection", lambda: get("find_orders")(conn, "' OR '1'='1"), [], "Use a parameterized ? query instead of an f-string.")

fns = get("build_adders")([1, 5, 10])
expect("build_adders captures each offset independently", lambda: [fn(100) for fn in fns], [101, 105, 110])

a = get("record_alert")("wind")
b = get("record_alert")("frost")
expect("record_alert does not leak state across calls", lambda: (a, b), (["wind"], ["frost"]))

expect("sum_readings skips blank lines and sums valid ints", lambda: get("sum_readings")(["10", "  ", "25", "\n"]), 35)

def _raises_on_bad():
    try:
        get("sum_readings")(["10", "corrupt", "5"])
        return False
    except ValueError:
        return True

check("sum_readings raises ValueError on corrupt non-empty line", _raises_on_bad, "Remove the silent except block so invalid numbers raise ValueError.")
```

## Hidden checks

```python
existing = ["init"]
expect("record_alert appends to explicit list when provided", lambda: get("record_alert")("next", existing), ["init", "next"])
expect("build_adders([]) returns []", lambda: get("build_adders")([]), [])
expect("sum_readings handles negative numbers", lambda: get("sum_readings")(["-4", "10", ""]), 6)
```

## Solution

```python
def find_orders(conn, username):
    rows = conn.execute(
        "SELECT sku FROM orders WHERE username = ? ORDER BY sku ASC",
        (username,),
    ).fetchall()
    return [r[0] for r in rows]


def build_adders(offsets):
    return [lambda x, step=step: x + step for step in offsets]


def record_alert(msg, log=None):
    if log is None:
        log = []
    log.append(msg)
    return log


def sum_readings(lines):
    total = 0
    for line in lines:
        cleaned = line.strip()
        if not cleaned:
            continue
        total += int(cleaned)
    return total
```

## Restored

Every subtle defect in the draft PR is caught and fixed before merge — no SQL injection, no late-binding surprise, no shared defaults, and no silent error swallowing.
