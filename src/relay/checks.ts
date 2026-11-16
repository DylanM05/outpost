// The Python side of a relay mission. LIBRARY_PY is installed into the
// machine's check agent once per session (it runs as root, out of the
// player's sight); the functions below build the requests that set up,
// check, save, and restore a mission. Checks use a small helper API (see
// docs/AUTHORING.md):
//   run, sh, read, exists, is_dir, is_file, listing, mode, owner, cwd,
//   history, commands, ran, calls, assigned, answer, git, check, expect
import type { RunResult } from "../python/harness";

export const LIBRARY_PY = String.raw`
import base64
import fcntl
import io
import json
import os
import pwd
import re
import shlex
import signal
import stat
import struct
import subprocess
import tarfile
import termios
import time

HOME = "/home/ranger"
_PLAYER = pwd.getpwnam("ranger")
_GROUPS = [g for g in os.getgrouplist("ranger", _PLAYER.pw_gid) if g != _PLAYER.pw_gid]
_ENV = {
    "HOME": HOME,
    "USER": "ranger",
    "LOGNAME": "ranger",
    "SHELL": "/bin/bash",
    "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    "LANG": "C.UTF-8",
    "TERM": "dumb",
}
# /dev/ttyS0, where the player's shell runs, as the kernel numbers it.
_PLAYER_TTY = (4 << 8) | 64
_SHELLS = {"bash", "sh", "ash"}
# The current check run. Requests run in a copy of this namespace, but these
# functions read their globals from the original, so per-run state lives in
# one shared dict that each run resets.
_RUN = {"checks": [], "events": [], "hidden": False, "answer": ""}


def _full(path):
    path = str(path)
    if path == "~" or path.startswith("~/"):
        path = HOME + path[1:]
    elif not path.startswith("/"):
        path = os.path.join(HOME, path)
    return os.path.normpath(path)


def _short(path):
    if path == HOME:
        return "~"
    if path.startswith(HOME + "/"):
        return "~" + path[len(HOME):]
    return path


class Result:
    def __init__(self, out, err, code):
        self.out = out
        self.err = err
        self.code = code

    def __repr__(self):
        return f"Result(out={self.out!r}, err={self.err!r}, code={self.code})"


def run(command, cwd="~", input=None, timeout=10, root=False):
    # Runs a command in bash as the player (or as root), from cwd.
    owner = {} if root else {"user": _PLAYER.pw_uid, "group": _PLAYER.pw_gid, "extra_groups": _GROUPS}
    try:
        done = subprocess.run(
            ["/bin/bash", "-c", command],
            cwd=_full(cwd),
            env=dict(_ENV),
            input=input,
            stdin=None if input is not None else subprocess.DEVNULL,
            capture_output=True,
            text=True,
            errors="replace",
            timeout=timeout,
            **owner,
        )
    except subprocess.TimeoutExpired:
        return Result("", f"Stopped after {timeout} seconds.", 124)
    return Result(done.stdout, done.stderr, done.returncode)


def sh(command, cwd="~", input=None):
    # What a command prints, without its final newline.
    return run(command, cwd, input).out.rstrip("\n")


def git(args, repo="~"):
    return sh("git " + args, repo)


def read(path):
    try:
        with open(_full(path), encoding="utf-8", errors="replace") as file:
            return file.read()
    except (FileNotFoundError, IsADirectoryError, NotADirectoryError):
        return None


def exists(path):
    return os.path.lexists(_full(path))


def is_dir(path):
    return os.path.isdir(_full(path)) and not os.path.islink(_full(path))


def is_file(path):
    return os.path.isfile(_full(path)) and not os.path.islink(_full(path))


def listing(path="~", hidden=False):
    try:
        names = os.listdir(_full(path))
    except (FileNotFoundError, NotADirectoryError):
        return None
    return sorted(n for n in names if hidden or not n.startswith("."))


def mode(path):
    # Permissions as ls -l shows them, without the file type: "rwxr-xr-x".
    return stat.filemode(os.lstat(_full(path)).st_mode)[1:]


def owner(path):
    return pwd.getpwuid(os.lstat(_full(path)).st_uid).pw_name


def _processes():
    for name in os.listdir("/proc"):
        if not name.isdigit():
            continue
        try:
            with open(f"/proc/{name}/stat") as file:
                text = file.read()
        except OSError:
            continue
        comm = text[text.index("(") + 1 : text.rindex(")")]
        fields = text[text.rindex(")") + 2 :].split()
        yield int(name), comm, int(fields[4])


def _player_shells():
    return sorted(pid for pid, comm, tty in _processes() if tty == _PLAYER_TTY and comm in _SHELLS)


def cwd():
    # The directory the player's terminal is in, written with ~, or None.
    shells = _player_shells()
    if not shells:
        return None
    try:
        return _short(os.readlink(f"/proc/{shells[-1]}/cwd"))
    except OSError:
        return None


def history():
    # Every command the player has run, oldest first. Bash saves each one as
    # the next prompt appears.
    text = read("~/.bash_history") or ""
    return [line for line in text.split("\n") if line.strip() and not re.match(r"#\d+$", line)]


def _tokens(line):
    try:
        lexer = shlex.shlex(line, posix=True, punctuation_chars=True)
        lexer.whitespace_split = True
        return list(lexer)
    except ValueError:
        return line.split()


def _parse(line):
    # The commands on a line, as [program, arguments] pairs, with quotes
    # removed: "ls -l | wc -l" gives [["ls", ["-l"]], ["wc", ["-l"]]].
    found, current = [], None
    for token in _tokens(line):
        if token in ("|", "||", "&&", ";", "&", "(", ")", "|&"):
            current = None
        elif current is None and re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", token):
            continue
        elif current is None or (current[1] == [] and current[0] in ("sudo", "time", "command", "exec", "nohup")):
            current = [token, []]
            found.append(current)
        else:
            current[1].append(token)
    return found


def commands():
    # The programs the player has run, in order, one entry per use:
    # "ls -l | wc -l" gives ["ls", "wc"].
    return [program for line in history() for program, _ in _parse(line)]


def ran(program):
    return program in commands()


def calls(program):
    # The arguments of each use of a program, joined with single spaces:
    # after echo "relay  online", calls("echo") gives ["relay  online"].
    return [" ".join(args) for line in history() for name, args in _parse(line) if name == program]


def assigned(name):
    # The values the player has given a shell variable, oldest first:
    # after mast="north ridge", assigned("mast") gives ["north ridge"].
    prefix = name + "="
    return [token[len(prefix):] for line in history() for token in _tokens(line) if token.startswith(prefix)]


def answer():
    return _RUN["answer"].strip()


def _value(got):
    return got() if callable(got) else got


def check(label, passed, hint=""):
    try:
        ok = bool(_value(passed))
        detail = "" if ok else hint
    except Exception as exc:
        ok, detail = False, f"The check couldn't run: {type(exc).__name__}: {exc}"
    _RUN["checks"].append({"label": label, "passed": ok, "detail": detail, "hidden": _RUN["hidden"]})
    return ok


def expect(label, got, expected, hint="", accept=None, reveal=True):
    # reveal=False keeps the expected value out of the failure message, for
    # answers the player is meant to find.
    try:
        value = _value(got)
        ok = bool(accept(value)) if accept else value == expected
        if ok:
            detail = ""
        elif reveal and accept is None:
            detail = f"Expected {expected!r}, found {value!r}."
        else:
            detail = f"Found {value!r}." if value not in (None, "") else ""
        if not ok and hint:
            detail = f"{detail} {hint}".strip()
    except Exception as exc:
        ok, detail = False, f"The check couldn't run: {type(exc).__name__}: {exc}"
    _RUN["checks"].append({"label": label, "passed": ok, "detail": detail, "hidden": _RUN["hidden"]})
    return ok


def _emit(kind, **data):
    data["hidden"] = _RUN["hidden"]
    _RUN["events"].append({"kind": kind, "data": data})


def _tree(path="~", limit=200):
    # The files under path, for the files scene: [name, children or None].
    seen = [0]

    def walk(full):
        entries = []
        try:
            names = sorted(os.listdir(full), key=lambda n: (n.startswith("."), n.lower()))
        except OSError:
            return entries
        for name in names:
            if name.startswith(".") or seen[0] >= limit:
                continue
            seen[0] += 1
            child = os.path.join(full, name)
            if os.path.isdir(child) and not os.path.islink(child):
                entries.append([name, walk(child)])
            else:
                entries.append([name, None])
        return entries

    return {"root": _short(_full(path)), "entries": walk(_full(path)), "cut": seen[0] >= limit}


def _start(epoch):
    # Called after every restore: the saved machine's clock stopped when it
    # was saved, so set it to now.
    time.clock_settime(time.CLOCK_REALTIME, epoch)


def _resize(columns, rows):
    # The agent reads this when it starts a new shell; see agent.py.
    with open("/run/outpost-terminal-size", "w") as file:
        file.write(f"{columns} {rows}")
    fd = os.open("/dev/ttyS0", os.O_RDWR | os.O_NOCTTY)
    try:
        fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, columns, 0, 0))
    finally:
        os.close(fd)


def _restart_shell():
    # Ends the player's login session. init starts a fresh one, which reads
    # the history and settings in the home directory.
    for pid, comm, tty in list(_processes()):
        if tty == _PLAYER_TTY and comm != "agetty":
            try:
                os.kill(pid, signal.SIGKILL)
            except ProcessLookupError:
                pass


def _setup(script, root=False):
    done = run("set -e\n" + script, timeout=60, root=root)
    if done.code != 0:
        raise RuntimeError(f"Setup failed with exit code {done.code}: {done.err.strip() or done.out.strip()}")


# A mission's workspace: the player's home folder, and /srv, where missions
# keep machine-wide files. Everything else comes back from the saved machine
# and the mission's root setup.
_WORKSPACE = (HOME, "/srv")


def _clear(folder):
    for name in os.listdir(folder):
        full = os.path.join(folder, name)
        if os.path.isdir(full) and not os.path.islink(full):
            subprocess.run(["rm", "-rf", full])
        else:
            os.remove(full)


def _save_workspace(limit):
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w:gz") as archive:
        for folder in _WORKSPACE:
            if os.path.isdir(folder):
                archive.add(folder, arcname=folder.lstrip("/"))
    data = buffer.getvalue()
    return base64.b64encode(data).decode() if len(data) <= limit else None


def _load_workspace(encoded):
    for folder in _WORKSPACE:
        if os.path.isdir(folder):
            _clear(folder)
    with tarfile.open(fileobj=io.BytesIO(base64.b64decode(encoded)), mode="r:gz") as archive:
        archive.extractall("/", filter="fully_trusted")
`;

const py = (value: unknown) => JSON.stringify(value);

export const startCode = (epoch: number) => `_start(${epoch})`;
export const resizeCode = (columns: number, rows: number) => `_resize(${columns}, ${rows})`;
export const restartShellCode = () => "_restart_shell()";
export const setupCode = (script: string, root = false) => `_setup(${py(script)}, root=${root ? "True" : "False"})`;
export const viewCode = () => "result = dict(cwd=cwd(), **_tree())";
export const saveWorkspaceCode = (limit: number) => `result = _save_workspace(${limit})`;
export const loadWorkspaceCode = (encoded: string) => `_load_workspace(${py(encoded)})`;

// A check run. Visible checks always run; hidden ones only on submit. The
// files scene gets a listing of the player's home directory either way.
export function checkCode(visible: string, hidden: string, answer: string, scene: string): string {
  return `
_RUN.update(checks=[], events=[], hidden=False, answer=${py(answer)})
_error = None
try:
    exec(compile(${py(visible)}, "checks", "exec"))
    _RUN["hidden"] = True
    exec(compile(${py(hidden)}, "hidden checks", "exec"))
except Exception as exc:
    _error = f"{type(exc).__name__}: {exc}"
_RUN["hidden"] = False
if ${py(scene)} == "files":
    _emit("files", cwd=cwd(), **_tree())
result = {"checks": _RUN["checks"], "events": _RUN["events"], "error": _error}
`;
}

export interface CheckReply {
  checks: RunResult["checks"];
  events: RunResult["events"];
  error: string | null;
}

export function toRunResult(reply: CheckReply): RunResult {
  return {
    stdout: "",
    stdoutTruncated: false,
    error: reply.error ? { phase: "runtime", type: "CheckError", message: reply.error, line: null } : null,
    checks: reply.checks,
    events: reply.events,
  };
}
