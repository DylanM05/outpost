// The Python side of a mission run. It is loaded once into the interpreter
// (in the browser worker, and in the Node content tests) and exposes
// run_mission(user_code, check_code, hidden_code) -> JSON string.
//
// Learner code runs in a fresh namespace under the filename "main.py", so
// tracebacks can be mapped back to lines in the editor. Mission checks run
// afterwards with a small helper API (see docs/AUTHORING.md):
//   output, lines, source, uses, namespace, get, check, expect,
//   expect_within, expect_sorted, expect_recursive, expect_comparisons,
//   expect_grid, tracked, tracked_grid, compared, safe, emit

export const HARNESS_PY = String.raw`
import io
import json
import math
import re
import sqlite3
import sys
import tokenize
import traceback

_OUTPUT_LIMIT = 20_000
_FRAME_LIMIT = 300
_CALL_LIMIT = 60
_ORDER_LIMIT = 5000


class _CappedOutput(io.TextIOBase):
    def __init__(self):
        self.parts = []
        self.size = 0
        self.truncated = False

    def writable(self):
        return True

    def write(self, text):
        room = _OUTPUT_LIMIT - self.size
        if room > 0:
            self.parts.append(text[:room])
            self.size += min(len(text), room)
        if len(text) > room:
            self.truncated = True
        return len(text)

    def getvalue(self):
        return "".join(self.parts)


class MissingName(Exception):
    pass


class Outcome:
    def __init__(self, value=None, error=None):
        self.value = value
        self.error = error


def _user_line(exc):
    line = None
    for frame in traceback.extract_tb(exc.__traceback__):
        if frame.filename == "main.py":
            line = frame.lineno
    return line


def _explain(exc):
    if isinstance(exc, MissingName):
        return str(exc)
    line = _user_line(exc)
    where = f" on line {line}" if line else ""
    if isinstance(exc, RecursionError):
        return f"RecursionError{where}: the function kept calling itself and never reached a base case that stops it."
    return f"{type(exc).__name__}{where}: {exc}"


def _plain(value, depth=0):
    if value is None or isinstance(value, (bool, int, str)):
        return value
    if isinstance(value, float):
        return value if math.isfinite(value) else repr(value)
    if depth > 4:
        return repr(value)
    if isinstance(value, (list, tuple)):
        return [_plain(item, depth + 1) for item in value[:50]]
    if isinstance(value, dict):
        return {str(key): _plain(item, depth + 1) for key, item in list(value.items())[:50]}
    return repr(value)


def _same(got, expected):
    # Strings handed out by tracked lists and grids are still strings.
    if isinstance(got, str) and type(got) is not str:
        got = str.__str__(got)
    if isinstance(got, bool) != isinstance(expected, bool):
        return False
    if isinstance(got, (int, float)) and isinstance(expected, (int, float)):
        return abs(got - expected) < 1e-9
    return type(got) == type(expected) and got == expected


def _short(value, limit=120):
    text = repr(value)
    return text if len(text) <= limit else text[: limit - 1] + "…"


class _TrackedText(str):
    """A string inside a tracked list. Going through its letters, as sorted(),
    set(), or a for loop does, counts one read per letter toward the list."""

    def __iter__(self):
        owner = self._owner
        for letter in str.__iter__(self):
            owner.looks += 1
            yield letter


class TrackedList(list):
    """A list that counts how many items code reads from it, for work budgets.

    Reads by index count one, slices count every item copied, and anything that
    iterates (for loops, in, sum, sorted, index) counts each item it visits.
    Strings in it also count each letter that's iterated over.

    With record=True it also keeps a frame of the whole list after each write
    that leaves it holding the same items as before, in some order. That skips
    the halfway states of a swap or a shift, so a replay shows one move per
    frame. Keep recorded lists small.
    """

    def __init__(self, items=(), record=False):
        super().__init__(self._track(item) for item in items)
        self.looks = 0
        self.frames = None
        if record:
            self._items = sorted(map(repr, list.copy(self)))
            self.frames = [list.copy(self)]

    def _track(self, item):
        if type(item) is not str:
            return item
        text = _TrackedText(item)
        text._owner = self
        return text

    def __setitem__(self, index, value):
        list.__setitem__(self, index, value)
        if self.frames is None or len(self.frames) >= _FRAME_LIMIT:
            return
        now = list.copy(self)
        if now != self.frames[-1] and sorted(map(repr, now)) == self._items:
            self.frames.append(now)

    def __getitem__(self, index):
        result = list.__getitem__(self, index)
        self.looks += len(result) if isinstance(index, slice) else 1
        return result

    def __iter__(self):
        for i in range(list.__len__(self)):
            self.looks += 1
            yield list.__getitem__(self, i)

    def __reversed__(self):
        for i in range(list.__len__(self) - 1, -1, -1):
            self.looks += 1
            yield list.__getitem__(self, i)

    def __contains__(self, value):
        return any(item == value for item in self)

    def index(self, value, start=0, stop=None):
        stop = list.__len__(self) if stop is None else stop
        for i in range(start, stop):
            if self[i] == value:
                return i
        raise ValueError(f"{value!r} is not in list")

    def count(self, value):
        return sum(1 for item in self if item == value)

    def copy(self):
        return list(iter(self))


class _GridRow(str):
    """One row of a tracked grid. Reading a cell, by index or by looping over
    the row, counts one read toward the grid and records the cell the first
    time it's read."""

    def __getitem__(self, index):
        result = str.__getitem__(self, index)
        if isinstance(index, slice):
            self._grid.looks += len(result)
        else:
            self._grid.looks += 1
            self._grid._saw(self._row, index % len(self))
        return result

    def __iter__(self):
        for column in range(len(self)):
            self._grid.looks += 1
            self._grid._saw(self._row, column)
            yield str.__getitem__(self, column)


class TrackedGrid(list):
    """A grid stored as a list of strings, one per row, that counts cell reads
    and remembers the order cells were first read in. Reading a whole row
    (grid[r]) is free; reading the cells in it isn't."""

    def __init__(self, rows):
        super().__init__()
        for number, row in enumerate(rows):
            cells = _GridRow(row)
            cells._grid = self
            cells._row = number
            list.append(self, cells)
        self.reset()

    def reset(self):
        self.looks = 0
        self.order = []
        self._seen = set()

    def _saw(self, row, column):
        if (row, column) not in self._seen and len(self.order) < _ORDER_LIMIT:
            self._seen.add((row, column))
            self.order.append((row, column))


def tracked_grid(rows):
    return TrackedGrid(rows)


_COMPARISONS = [0]


class _Compared(int):
    """A whole number that counts every ordering comparison it takes part in
    (<, <=, >, >=), however it's copied, sliced, or moved between lists. Sorting
    work is measured this way, since sorts make copies that reads can't follow."""

    def __lt__(self, other):
        _COMPARISONS[0] += 1
        return int.__lt__(self, other)

    def __le__(self, other):
        _COMPARISONS[0] += 1
        return int.__le__(self, other)

    def __gt__(self, other):
        _COMPARISONS[0] += 1
        return int.__gt__(self, other)

    def __ge__(self, other):
        _COMPARISONS[0] += 1
        return int.__ge__(self, other)

    __hash__ = int.__hash__


def compared(values):
    return [_Compared(value) for value in values]


def _record_calls(fn, name):
    """Returns a stand-in for a learner's function, so calls it makes to itself
    are recorded too (each call's depth, arguments, and result), and the log.

    It's a plain function, not a class with __call__: Python runs calls between
    plain functions without growing the browser's stack, so deep recursion still
    ends in a RecursionError instead of crashing the interpreter."""
    log = {"count": 0, "depth": 0, "calls": []}

    def recorder(*args):
        log["count"] += 1
        entry = None
        if len(log["calls"]) < _CALL_LIMIT:
            shown = ", ".join(_short(arg, 60) for arg in args)
            entry = {"depth": log["depth"], "call": f"{name}({shown})", "result": None, "error": False}
            log["calls"].append(entry)
        log["depth"] += 1
        try:
            result = fn(*args)
        except BaseException:
            if entry is not None:
                entry["error"] = True
            raise
        finally:
            log["depth"] -= 1
        if entry is not None:
            entry["result"] = _short(result, 60)
        return result

    return recorder, log


def _run_checks(user_code, check_code, hidden_code, namespace, program_output, result, extra_scope=None):
    checks = result["checks"]
    events = result["events"]
    state = {"hidden": False}

    def record(label, passed, detail):
        checks.append({"label": label, "passed": passed, "detail": detail, "hidden": state["hidden"]})
        return passed

    def get(name):
        if name not in namespace:
            raise MissingName(f"main.py doesn't define {name} yet.")
        return namespace[name]

    def safe(fn):
        try:
            return Outcome(value=fn())
        except Exception as exc:
            return Outcome(error=_explain(exc))

    def uses(*names):
        # Whether the learner's code mentions any of these names, ignoring
        # comments and strings: uses("sorted", "sort") catches sorted() and .sort().
        try:
            tokens = list(tokenize.generate_tokens(io.StringIO(user_code).readline))
        except (tokenize.TokenError, SyntaxError):
            return False
        return any(token.type == tokenize.NAME and token.string in names for token in tokens)

    def emit(kind, **data):
        data["hidden"] = state["hidden"]
        events.append({"kind": kind, "data": _plain(data)})

    def check(label, test, hint=""):
        outcome = safe(test)
        if outcome.error is not None:
            return record(label, False, outcome.error)
        passed = bool(outcome.value)
        return record(label, passed, "" if passed else hint)

    def _right(got, expected, accept):
        # With accept, any value it approves is right, and expected is a short
        # description of a right answer for the failure message.
        if accept is None:
            return _same(got, expected), _mismatch(got, expected)
        return bool(accept(got)), f"Got {_short(got)}, which isn't {expected}."

    def expect(label, fn, expected, hint="", accept=None, **extra):
        outcome = safe(fn)
        if outcome.error is not None:
            passed, detail = False, outcome.error
        else:
            passed, detail = _right(outcome.value, expected, accept)
            if passed:
                detail = ""
            elif hint:
                detail += f" {hint}"
        emit("reading", label=label, got=outcome.value, expected=expected, passed=passed, error=outcome.error, **extra)
        return record(label, passed, detail)

    def _mismatch(got, expected):
        detail = f"Expected {_short(expected)}, got {_short(got)}."
        if got is None and expected is not None:
            detail += " Nothing came back. Check that the function uses return, not print."
        return detail

    def expect_within(label, fn, expected, data, budget, hint="", accept=None):
        # Like expect, but the answer must also come from reading at most
        # budget items of data, a TrackedList.
        data.looks = 0
        outcome = safe(fn)
        looks = data.looks
        size = list.__len__(data)
        right, mismatch = (False, "") if outcome.error is not None else _right(outcome.value, expected, accept)
        if outcome.error is not None:
            passed, detail = False, outcome.error
        elif not right:
            passed, detail = False, mismatch
        elif looks > budget:
            passed = False
            detail = f"Right answer, but it read {looks:,} items. The budget for {size:,} items is {budget:,}."
            if hint:
                detail += f" {hint}"
        else:
            passed, detail = True, ""
        emit("work", label=label, size=size, looks=looks, budget=budget, passed=passed, error=outcome.error)
        return record(label, passed, detail)

    def expect_grid(label, fn, expected, grid, budget=None, hint="", accept=None):
        # Like expect, for functions that explore grid, a tracked_grid(...).
        # Fails a right answer that reads more than budget cells, if given,
        # and sends the grid, the order cells were read in, and the result to
        # the grid scene.
        grid.reset()
        outcome = safe(fn)
        looks = grid.looks
        cells = sum(len(row) for row in list.__iter__(grid))
        if outcome.error is not None:
            passed, detail = False, outcome.error
        else:
            passed, detail = _right(outcome.value, expected, accept)
            if not passed:
                if hint:
                    detail += f" {hint}"
            elif budget is not None and looks > budget:
                passed = False
                detail = f"Right answer, but it read {looks:,} cells. The budget for {cells:,} cells is {budget:,}."
                if hint:
                    detail += f" {hint}"
            else:
                detail = ""
        rows = [str.__str__(row) for row in list.__iter__(grid)]
        events.append({
            "kind": "grid",
            "data": {
                "label": label,
                "rows": rows if cells <= 2500 else None,
                "order": [list(cell) for cell in grid.order] if cells <= 2500 else None,
                "result": _plain(outcome.value),
                "looks": looks,
                "budget": budget,
                "passed": passed,
                "error": outcome.error,
                "hidden": state["hidden"],
            },
        })
        if budget is not None:
            emit("work", label=label, size=cells, looks=looks, budget=budget, unit="cell reads", passed=passed, error=outcome.error)
        return record(label, passed, detail)

    def expect_comparisons(label, fn, expected, size, budget, hint=""):
        # Like expect_within, but counts comparisons between compared(...)
        # numbers instead of reads: at most budget for size items.
        _COMPARISONS[0] = 0
        outcome = safe(fn)
        made = _COMPARISONS[0]
        if outcome.error is not None:
            passed, detail = False, outcome.error
        elif not _same(outcome.value, expected):
            passed, detail = False, _mismatch(outcome.value, expected)
        elif made > budget:
            passed = False
            detail = f"Right answer, but it made {made:,} comparisons. The budget for {size:,} items is {budget:,}."
            if hint:
                detail += f" {hint}"
        else:
            passed, detail = True, ""
        emit("work", label=label, size=size, looks=made, budget=budget, unit="comparisons", passed=passed, error=outcome.error)
        return record(label, passed, detail)

    def expect_recursive(label, name, args, expected, hint="", recurse=True):
        # Calls the learner's function name(*args) and compares the result,
        # recording every call it makes to itself for the call tree. With
        # recurse=True, a right answer that never calls itself fails.
        found = safe(lambda: get(name))
        if found.error is not None:
            return record(label, False, found.error)
        recorder, log = _record_calls(found.value, name)
        namespace[name] = recorder
        try:
            outcome = safe(lambda: recorder(*args))
        finally:
            namespace[name] = found.value
        if outcome.error is not None:
            passed, detail = False, outcome.error
        elif not _same(outcome.value, expected):
            passed, detail = False, _mismatch(outcome.value, expected)
            if hint:
                detail += f" {hint}"
        elif recurse and log["count"] < 2:
            passed = False
            detail = f"Right answer, but {name} never called itself. Solve it by calling {name} on a smaller part of the problem."
        else:
            passed, detail = True, ""
        events.append({
            "kind": "calls",
            "data": {
                "label": label,
                "calls": log["calls"],
                "total": log["count"],
                "passed": passed,
                "error": outcome.error,
                "hidden": state["hidden"],
            },
        })
        return record(label, passed, detail)

    def expect_sorted(label, fn, data, expected, budget=None, hint=""):
        # For functions that sort data, a TrackedList, in place. Passes if data
        # ends up equal to expected, within budget reads when one is given.
        data.looks = 0
        if data.frames is not None:
            data.frames = [list.copy(data)]
        outcome = safe(fn)
        looks = data.looks
        after = list.copy(data)
        if outcome.error is not None:
            passed, detail = False, outcome.error
        elif not _same(after, expected):
            passed = False
            detail = f"Afterwards the list was {_short(after)}. Expected {_short(expected)}."
            if outcome.value is not None:
                detail += " The function returned something, but this sort has to change the list it was given."
            if hint:
                detail += f" {hint}"
        elif budget is not None and looks > budget:
            passed = False
            detail = f"Sorted correctly, but it read {looks:,} items. The budget for {len(after):,} items is {budget:,}."
            if hint:
                detail += f" {hint}"
        else:
            passed, detail = True, ""
        frames = None
        if data.frames is not None:
            frames = [[_plain(item) for item in frame] for frame in data.frames]
        events.append({
            "kind": "sort",
            "data": {
                "label": label,
                "size": len(after),
                "looks": looks,
                "budget": budget,
                "passed": passed,
                "error": outcome.error,
                "frames": frames,
                "hidden": state["hidden"],
            },
        })
        return record(label, passed, detail)

    scope = {
        "output": program_output,
        "lines": [line.rstrip() for line in program_output.splitlines()],
        "source": user_code,
        "uses": uses,
        "namespace": namespace,
        "get": get,
        "check": check,
        "expect": expect,
        "expect_within": expect_within,
        "expect_sorted": expect_sorted,
        "expect_recursive": expect_recursive,
        "expect_comparisons": expect_comparisons,
        "expect_grid": expect_grid,
        "tracked_grid": tracked_grid,
        "compared": compared,
        "tracked": TrackedList,
        "safe": safe,
        "emit": emit,
    }
    if extra_scope:
        scope.update(extra_scope)
    for code, hidden, filename in ((check_code, False, "checks.py"), (hidden_code, True, "hidden_checks.py")):
        if not code.strip():
            continue
        state["hidden"] = hidden
        try:
            exec(compile(code, filename, "exec"), scope)
        except Exception as exc:
            record("Finish the mission checks", False, _explain(exc))


def run_mission(user_code, check_code, hidden_code=""):
    program_out = _CappedOutput()
    result = {"stdout": "", "stdoutTruncated": False, "error": None, "checks": [], "events": []}
    namespace = {"__name__": "__main__"}
    real_stdout = sys.stdout
    sys.stdout = program_out
    try:
        try:
            compiled = compile(user_code, "main.py", "exec")
        except SyntaxError as exc:
            result["error"] = {"phase": "syntax", "type": type(exc).__name__, "message": exc.msg, "line": exc.lineno}
        else:
            try:
                exec(compiled, namespace)
            except SystemExit:
                result["error"] = {"phase": "runtime", "type": "SystemExit", "message": "the program called exit() before the checks could run", "line": None}
            except Exception as exc:
                result["error"] = {"phase": "runtime", "type": type(exc).__name__, "message": str(exc), "line": _user_line(exc)}

        result["stdout"] = program_out.getvalue()
        result["stdoutTruncated"] = program_out.truncated
        if result["error"] is None:
            # Anything printed while the checks call learner functions is discarded.
            sys.stdout = _CappedOutput()
            _run_checks(user_code, check_code, hidden_code, namespace, result["stdout"], result)
    finally:
        sys.stdout = real_stdout
    return json.dumps(result)


def _sql_strip_comments_and_strings(sql_text, keep_strings=False):
    out = []
    i = 0
    n = len(sql_text)
    while i < n:
        ch = sql_text[i]
        nxt = sql_text[i + 1] if i + 1 < n else ""
        if ch == "-" and nxt == "-":
            i += 2
            while i < n and sql_text[i] != "\n":
                i += 1
            out.append(" ")
            continue
        if ch == "/" and nxt == "*":
            i += 2
            while i < n and not (sql_text[i] == "*" and (i + 1 < n and sql_text[i + 1] == "/")):
                i += 1
            i += 2
            out.append(" ")
            continue
        if ch in ("'", '"'):
            quote = ch
            start = i
            i += 1
            while i < n:
                if sql_text[i] == quote:
                    if i + 1 < n and sql_text[i + 1] == quote:
                        i += 2
                        continue
                    i += 1
                    break
                i += 1
            out.append(sql_text[start:i] if keep_strings else " ")
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def _split_sql_statements(sql_text):
    statements = []
    buf = []
    i = 0
    n = len(sql_text)
    line = 1
    stmt_start_line = None
    in_trigger = False
    block_depth = 0
    case_depth = 0
    word_tokens = []

    while i < n:
        ch = sql_text[i]
        nxt = sql_text[i + 1] if i + 1 < n else ""
        if ch == "-" and nxt == "-":
            start = i
            i += 2
            while i < n and sql_text[i] != "\n":
                i += 1
            if stmt_start_line is not None:
                buf.append(sql_text[start:i])
            continue
        if ch == "/" and nxt == "*":
            start = i
            i += 2
            while i < n and not (sql_text[i] == "*" and (i + 1 < n and sql_text[i + 1] == "/")):
                if sql_text[i] == "\n":
                    line += 1
                i += 1
            i = min(n, i + 2)
            if stmt_start_line is not None:
                buf.append(sql_text[start:i])
            continue
        if ch in ("'", '"', chr(96)):
            if stmt_start_line is None:
                stmt_start_line = line
            quote = ch
            start = i
            i += 1
            while i < n:
                if sql_text[i] == "\n":
                    line += 1
                if sql_text[i] == quote:
                    if i + 1 < n and sql_text[i + 1] == quote:
                        i += 2
                        continue
                    i += 1
                    break
                i += 1
            buf.append(sql_text[start:i])
            continue
        if ch.isalpha() or ch == "_":
            if stmt_start_line is None:
                stmt_start_line = line
            start = i
            while i < n and (sql_text[i].isalnum() or sql_text[i] == "_"):
                i += 1
            word = sql_text[start:i]
            upper = word.upper()
            buf.append(word)
            word_tokens.append(upper)
            if not in_trigger and len(word_tokens) <= 3 and word_tokens[0] == "CREATE" and upper == "TRIGGER":
                in_trigger = True
            elif in_trigger:
                if upper == "BEGIN":
                    block_depth += 1
                elif upper == "CASE":
                    case_depth += 1
                elif upper == "END":
                    if case_depth > 0:
                        case_depth -= 1
                    elif block_depth > 0:
                        block_depth -= 1
            continue
        if ch == ";" and block_depth == 0:
            buf.append(ch)
            stmt = "".join(buf).strip()
            if _sql_strip_comments_and_strings(stmt, keep_strings=True).strip("; \t\r\n"):
                statements.append((stmt, stmt_start_line or line))
            buf = []
            stmt_start_line = None
            in_trigger = False
            case_depth = 0
            word_tokens = []
            i += 1
            continue
        if stmt_start_line is None and not ch.isspace():
            stmt_start_line = line
        if ch == "\n":
            line += 1
        if stmt_start_line is not None:
            buf.append(ch)
        i += 1

    tail = "".join(buf).strip()
    if _sql_strip_comments_and_strings(tail, keep_strings=True).strip("; \t\r\n"):
        statements.append((tail, stmt_start_line or line))
    return statements


def _sql_error_line(raw_stmt, start_line, message):
    # SQLite errors inside multi-line statements often report: near "<token>": ...
    # Map start_line down to the token line when possible, else the statement start.
    m = re.search(r'near "([^"]+)"', str(message))
    if m and m.group(1):
        token = m.group(1)
        is_quoted = token[0] in ("'", '"')
        cleaned = _sql_strip_comments_and_strings(raw_stmt, keep_strings=is_quoted)
        pos = -1
        if re.fullmatch(r"\w+", token):
            hit = re.search(r"\b" + re.escape(token) + r"\b", cleaned)
            if hit:
                pos = hit.start()
        else:
            pos = cleaned.find(token)
        if pos != -1:
            return start_line + cleaned[:pos].count("\n")
    return start_line


def _format_sql_table(columns, rows):
    if not columns:
        return ""
    lines = [" | ".join(str(c) for c in columns)]
    for row in rows:
        lines.append(" | ".join("NULL" if v is None else str(v) for v in row))
    return "\n".join(lines) + "\n"


class _SqlExecError(Exception):
    def __init__(self, orig, stmt, start_line):
        super().__init__(str(orig))
        self.orig = orig
        self.stmt = stmt
        self.start_line = start_line


def _exec_sql_script(conn, sql_text):
    last_columns = []
    last_rows = []
    tables = []
    outputs = []
    for stmt, start_line in _split_sql_statements(sql_text):
        try:
            cur = conn.execute(stmt)
        except sqlite3.Error as exc:
            raise _SqlExecError(exc, stmt, start_line) from exc
        if cur.description is not None:
            last_columns = [col[0] for col in cur.description]
            last_rows = [list(row) for row in cur.fetchall()]
            tables.append((last_columns, last_rows))
            outputs.append(_format_sql_table(last_columns, last_rows))
    return last_columns, last_rows, tables, "\n".join(o.rstrip("\n") for o in outputs if o) + ("\n" if outputs else "")


def run_sql_mission(user_sql, setup_sql, check_code, hidden_code=""):
    result = {"stdout": "", "stdoutTruncated": False, "error": None, "checks": [], "events": []}
    conn = sqlite3.connect(":memory:", isolation_level=None)
    conn.execute("PRAGMA foreign_keys = ON")
    real_stdout = sys.stdout
    try:
        if setup_sql and setup_sql.strip():
            conn.executescript(setup_sql)
        last_columns = []
        last_rows = []
        tables = []
        output_text = ""
        try:
            last_columns, last_rows, tables, output_text = _exec_sql_script(conn, user_sql)
        except _SqlExecError as err:
            result["error"] = {
                "phase": "runtime",
                "type": type(err.orig).__name__,
                "message": str(err.orig),
                "line": _sql_error_line(err.stmt, err.start_line, str(err.orig)),
            }

        if len(output_text) > _OUTPUT_LIMIT:
            result["stdout"] = output_text[:_OUTPUT_LIMIT]
            result["stdoutTruncated"] = True
        else:
            result["stdout"] = output_text

        if result["error"] is None:
            for cols, table_rows in tables:
                result["events"].append({
                    "kind": "sql_table",
                    "data": {
                        "columns": cols,
                        "rows": [_plain(r) for r in table_rows[:200]],
                        "totalRows": len(table_rows),
                        "truncated": len(table_rows) > 200,
                        "hidden": False,
                    },
                })
            sys.stdout = _CappedOutput()
            stripped_upper = _sql_strip_comments_and_strings(user_sql).upper()

            def query(sql, params=()):
                cur = conn.execute(sql, params)
                return [list(r) for r in cur.fetchall()]

            def query_dicts(sql, params=()):
                cur = conn.execute(sql, params)
                cols = [c[0] for c in (cur.description or [])]
                return [dict(zip(cols, r)) for r in cur.fetchall()]

            def run_user_sql():
                try:
                    _, new_rows, _, _ = _exec_sql_script(conn, user_sql)
                    return new_rows
                except _SqlExecError as err:
                    raise err.orig from None

            def sql_uses(*keywords):
                for kw in keywords:
                    token = str(kw).upper()
                    if re.search(r"\b" + re.escape(token) + r"\b", stripped_upper):
                        return True
                return False

            extra_scope = {
                "conn": conn,
                "columns": last_columns,
                "rows": last_rows,
                "dicts": [dict(zip(last_columns, r)) for r in last_rows],
                "row_count": len(last_rows),
                "query": query,
                "query_dicts": query_dicts,
                "run_user_sql": run_user_sql,
                "sql_uses": sql_uses,
                "sqlite3": sqlite3,
            }
            _run_checks(user_sql, check_code, hidden_code, {}, result["stdout"], result, extra_scope=extra_scope)
    finally:
        sys.stdout = real_stdout
        conn.close()
    return json.dumps(result)
`;

export interface CheckResult {
  label: string;
  passed: boolean;
  detail: string;
  hidden: boolean;
}

export interface RunError {
  phase: "syntax" | "runtime";
  type: string;
  message: string;
  line: number | null;
}

export interface TelemetryEvent {
  kind: string;
  data: Record<string, unknown> & { hidden: boolean };
}

export interface RunResult {
  stdout: string;
  stdoutTruncated: boolean;
  error: RunError | null;
  checks: CheckResult[];
  events: TelemetryEvent[];
}

export function passedAll(result: RunResult): boolean {
  return result.error === null && result.checks.length > 0 && result.checks.every((c) => c.passed);
}
