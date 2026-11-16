# The game's side channel into the relay terminal. It runs as root on the
# second serial port, out of the player's sight, and keeps the player's login
# shell running on the first. Each request is one JSON line, {"id", "code",
# "persist"}, and each reply is one JSON line, {"id", "ok", "value" or
# "error", "printed"}.
#
# "code" is Python. With "persist" it runs in the namespace the agent keeps,
# which is how the game installs its check library once per session; without
# it, it runs in a fresh copy, so one mission's checks can't leak into the
# next. Whatever the code leaves in the name "result" is sent back.
import contextlib
import fcntl
import io
import json
import os
import pwd
import struct
import termios
import threading
import time
import traceback
import tty
import warnings

# Forking from a threaded process is fine here: the child only sets up the
# terminal and runs bash.
warnings.filterwarnings("ignore", category=DeprecationWarning)

AGENT_PORT = "/dev/ttyS1"
PLAYER_PORT = "/dev/ttyS0"
PLAYER = pwd.getpwnam("ranger")
# The terminal's size, "columns rows", written by the game whenever it
# changes. A serial port forgets its size when its last session ends, so
# every new shell gets it set again.
SIZE_FILE = "/run/outpost-terminal-size"


def start_shell():
    # A login shell for the player on the first serial port: the same thing
    # getty and login would set up, minus the login prompt.
    pid = os.fork()
    if pid:
        return pid
    try:
        os.setsid()
        fd = os.open(PLAYER_PORT, os.O_RDWR)
        fcntl.ioctl(fd, termios.TIOCSCTTY, 1)
        try:
            with open(SIZE_FILE) as file:
                columns, rows = (int(n) for n in file.read().split())
            fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, columns, 0, 0))
        except (OSError, ValueError):
            pass
        for target in (0, 1, 2):
            os.dup2(fd, target)
        os.closerange(3, 1024)
        os.initgroups(PLAYER.pw_name, PLAYER.pw_gid)
        os.setgid(PLAYER.pw_gid)
        os.setuid(PLAYER.pw_uid)
        os.chdir(PLAYER.pw_dir)
        environment = {
            "HOME": PLAYER.pw_dir,
            "USER": PLAYER.pw_name,
            "LOGNAME": PLAYER.pw_name,
            "SHELL": PLAYER.pw_shell,
            "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            "TERM": "xterm-256color",
            "LANG": "C.UTF-8",
        }
        # stty sane undoes whatever a crashed program left the terminal in.
        os.execve("/bin/bash", ["bash", "-c", "stty sane 2>/dev/null; exec -a -bash /bin/bash"], environment)
    finally:
        os._exit(1)


def keep_shell():
    # Starts a new shell whenever the last one ends: after exit, or when the
    # game restarts it.
    while True:
        pid = start_shell()
        os.waitpid(pid, 0)
        time.sleep(0.05)


def main():
    fd = os.open(AGENT_PORT, os.O_RDWR | os.O_NOCTTY)
    tty.setraw(fd)
    reader = io.open(fd, "rb", buffering=65536, closefd=False)

    def send(message):
        data = (json.dumps(message) + "\n").encode()
        while data:
            data = data[os.write(fd, data):]

    threading.Thread(target=keep_shell, daemon=True).start()
    library = {"__name__": "outpost"}
    send({"ready": True})
    while True:
        line = reader.readline()
        if not line:
            return
        try:
            request = json.loads(line)
        except ValueError:
            # Stray bytes, for example after the machine is restored mid-line.
            continue
        reply = {"id": request.get("id")}
        printed = io.StringIO()
        try:
            namespace = library if request.get("persist") else dict(library)
            with contextlib.redirect_stdout(printed), contextlib.redirect_stderr(printed):
                exec(compile(request["code"], "<outpost>", "exec"), namespace)
            reply["ok"] = True
            reply["value"] = namespace.get("result")
        except BaseException:
            reply["ok"] = False
            reply["error"] = traceback.format_exc()
        reply["printed"] = printed.getvalue()[-20000:]
        try:
            send(reply)
        except (TypeError, ValueError):
            send({"id": reply["id"], "ok": False, "error": "The result couldn't be sent back as JSON.", "printed": ""})


main()
