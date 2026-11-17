// The Python side of a relay mission. LIBRARY_PY is installed into the
// machine's check agent once per session (it runs as root, out of the
// player's sight); the functions below build the requests that set up,
// check, save, and restore a mission. Checks use a small helper API (see
// docs/AUTHORING.md):
//   run, sh, read, exists, is_dir, is_file, listing, mode, owner, cwd,
//   history, commands, ran, calls, assigned, answer, check, expect,
// and for Git repositories:
//   git, is_repo, rev, commits, latest, branch, branches, tracked, show, status,
//   staged, changed, untracked, config, git_calls
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
    if not os.path.isdir(_full(cwd)):
        return Result("", f"No such folder: {_short(_full(cwd))}", 1)
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


# Git repositories, read as the player (Git won't read a repository that
# belongs to someone else). Each takes the repository's folder, and gives
# None or an empty list when there's no repository there.


def _git(args, repo):
    return run("git " + args, repo) if is_dir(repo) else None


def _ok(done):
    return done is not None and done.code == 0


def is_repo(path):
    # Whether path is the top folder of a repository, not just inside one.
    done = _git("rev-parse --show-toplevel", path)
    return _ok(done) and done.out.strip() == _full(path)


def rev(repo, ref="HEAD"):
    # The full hash of the commit ref names.
    done = _git("rev-parse --verify --quiet " + shlex.quote(ref + "^{commit}"), repo)
    return done.out.strip() if _ok(done) else None


def commits(repo, ref="HEAD"):
    # The commits reachable from ref, newest first, as dicts: hash, parents (a
    # list of hashes), author, committer, and message (its first line).
    if rev(repo, ref) is None:
        return []
    done = _git("log --format=%H%x1f%P%x1f%an%x1f%cn%x1f%s " + shlex.quote(ref) + " --", repo)
    found = []
    for line in done.out.splitlines():
        hash, parents, author, committer, message = line.split("\x1f")
        found.append({"hash": hash, "parents": parents.split(), "author": author, "committer": committer, "message": message})
    return found


def latest(repo, ref="HEAD"):
    # The newest commit, as commits() gives it, or one with empty fields when
    # there isn't one, so checks can read latest(repo)["message"] safely.
    found = commits(repo, ref)
    return found[0] if found else {"hash": None, "parents": [], "author": None, "committer": None, "message": None}


def branch(repo):
    # The branch the repository is on, or None when HEAD names a commit.
    done = _git("symbolic-ref --quiet --short HEAD", repo)
    return done.out.strip() if _ok(done) else None


def branches(repo, remote=False):
    # Local branch names, or with remote=True remote-tracking ones ("origin/main").
    prefix = "refs/remotes/" if remote else "refs/heads/"
    done = _git("for-each-ref --format='%(refname)' " + prefix, repo)
    names = done.out.split() if _ok(done) else []
    return sorted(name[len(prefix):] for name in names if not name.endswith("/HEAD"))


def tracked(repo, ref="HEAD"):
    # The files in a commit, as paths from the repository's top folder.
    done = _git("ls-tree -r --name-only " + shlex.quote(ref), repo)
    return sorted(done.out.splitlines()) if _ok(done) else []


def show(repo, ref, path):
    # A file as a commit has it, or as it's staged when ref is "".
    done = _git("show " + shlex.quote(ref + ":" + path), repo)
    return done.out if _ok(done) else None


def status(repo):
    # git status --short, one line per file: "?? notes.txt" is untracked,
    # "M  beacon.py" staged, " M beacon.py" changed but not staged.
    done = _git("--no-optional-locks status --porcelain=v1 --untracked-files=all", repo)
    return done.out.splitlines() if _ok(done) else []


def staged(repo):
    return sorted(line[3:] for line in status(repo) if line[0] not in " ?")


def changed(repo):
    # Files changed since they were staged or committed, and not staged since.
    return sorted(line[3:] for line in status(repo) if line[1] not in " ?")


def untracked(repo):
    return sorted(line[3:] for line in status(repo) if line.startswith("??"))


def config(key, repo="~", scope=None, all=False):
    # A setting as Git sees it from repo: the value, or every value with
    # all=True. scope ("global", "local", or "system") reads only that file.
    flags = (f" --{scope}" if scope else "") + (" --all" if all else "")
    done = _git(f"config get{flags} " + shlex.quote(key), repo)
    values = done.out.splitlines() if _ok(done) else []
    return values if all else (values[-1] if values else None)


def git_calls(subcommand):
    # The arguments of each git subcommand the player ran, skipping git's own
    # options: after git --no-pager log --oneline, git_calls("log") gives
    # ["--oneline"].
    found = []
    for line in history():
        for program, args in _parse(line):
            if program != "git":
                continue
            rest = list(args)
            while rest and rest[0].startswith("-"):
                if rest.pop(0) in ("-C", "-c") and rest:
                    rest.pop(0)
            if rest and rest[0] == subcommand:
                found.append(" ".join(rest[1:]))
    return found


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
    # None when there's nothing there.
    return stat.filemode(os.lstat(_full(path)).st_mode)[1:] if exists(path) else None


def owner(path):
    return pwd.getpwuid(os.lstat(_full(path)).st_uid).pw_name if exists(path) else None


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
    # The report box, trimmed, without quotes or backticks around it.
    # (chr(96) is a backtick, which can't appear in this TypeScript string.)
    return _RUN["answer"].strip().strip(chr(96) + "'\"").strip()


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


def _repo_view(declared, limit=40, files=12):
    # The repo scene: the repository the terminal is in, or else the
    # mission's own. One shell run gathers everything, in sections.
    here = cwd()
    top = None
    for place in [p for p in (here, declared) if p]:
        done = _git("rev-parse --show-toplevel", place)
        if _ok(done):
            top = done.out.strip()
            break
    if top is None:
        return {"cwd": here, "repo": None}
    script = rf"""
git log --all --topo-order -n {limit + 1} --format=%H%x1f%P%x1f%s 2>/dev/null
printf '\036\n'
git for-each-ref --format='%(refname)%1f%(objectname)' refs/heads refs/remotes refs/tags
printf '\036\n'
git symbolic-ref --quiet --short HEAD
printf '\036\n'
git rev-parse --verify --quiet HEAD
printf '\036\n'
git --no-optional-locks status --porcelain=v1 --untracked-files=all
"""
    log, refs, branch, head, changes = (run(script, top).out.split("\x1e\n") + [""] * 5)[:5]
    found = []
    for line in log.splitlines():
        hash, parents, subject = line.split("\x1f", 2)
        found.append({"hash": hash, "parents": parents.split(), "subject": subject})
    names = []
    for line in refs.splitlines():
        name, hash = line.split("\x1f")
        if not name.endswith("/HEAD"):
            kind = name.split("/")[1]
            names.append({"name": name.split("/", 2)[2], "kind": {"heads": "branch", "remotes": "remote"}.get(kind, "tag"), "hash": hash})
    lines = changes.splitlines()
    pick = lambda keep: [line[3:] for line in lines if keep(line)][:files]
    return {
        "cwd": here,
        "repo": _short(top),
        "branch": branch.strip() or None,
        "head": head.strip() or None,
        "commits": found[:limit],
        "cut": len(found) > limit,
        "refs": names,
        "staged": pick(lambda line: line[0] not in " ?"),
        "changed": pick(lambda line: line[1] not in " ?"),
        "untracked": pick(lambda line: line.startswith("??")),
    }


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


# Shell functions every setup script can use; see docs/AUTHORING.md.
_PRELUDE = r"""
# The Git settings the player makes in "Sign your work", and pull.rebase,
# which "When a push is refused" explains: without it, a pull between
# branches that have both moved on stops with an error. Player setup only:
# as root, this would write a .gitconfig that root owns.
player_git() {
	git config set --global user.name Ranger
	git config set --global user.email ranger@kestrel.ridge
	git config set --global init.defaultBranch main
	git config set --global pull.rebase false
}

# Someone's email: "Mara Okafor" is mara@valley.archive.
crew_email() {
	if [ "$1" = Ranger ]; then
		echo ranger@kestrel.ridge
	else
		echo "$(echo "$1" | cut -d' ' -f1 | tr A-Z a-z)@valley.archive"
	fi
}

# Runs a Git command as a crew member at a fixed time (UTC), so the commits
# it makes have the same hashes for every player. Set COMMITTER to record
# someone else as the committer.
#   as_crew "Mara Okafor" "2026-11-03 09:12" git merge -q --no-edit retune
as_crew() {
	local author=$1 when="$2 +0000"
	shift 2
	local committer=$COMMITTER
	[ -n "$committer" ] || committer=$author
	GIT_AUTHOR_NAME=$author GIT_AUTHOR_EMAIL=$(crew_email "$author") GIT_AUTHOR_DATE=$when \
		GIT_COMMITTER_NAME=$committer GIT_COMMITTER_EMAIL=$(crew_email "$committer") GIT_COMMITTER_DATE=$when "$@"
}

# Commits what's staged: commit_as "Mara Okafor" "2026-11-03 09:12" "Lower the beacon power"
commit_as() {
	as_crew "$1" "$2" git commit -q -m "$3"
}
"""


def _setup(script, root=False):
    done = run(_PRELUDE + "set -e\n" + script, timeout=60, root=root)
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
export const repoViewCode = (repo: string) => `result = _repo_view(${py(repo)})`;
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
