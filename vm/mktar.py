# Archives the guest's root filesystem for the 9p image tools. Paths are
# stored without a leading "./", which is what they expect, and ownership and
# modes are kept, so the player's home directory stays theirs. The kernel
# fills /proc, /sys and /dev at boot, so only the empty directories go in.
import os
import tarfile

EMPTY = {"proc", "sys", "dev", "tmp", "run"}

with tarfile.open("/rootfs.tar", "w", format=tarfile.GNU_FORMAT) as tar:
    for name in sorted(os.listdir("/")):
        if name in ("rootfs.tar", ".dockerenv", "mktar.py"):
            continue
        tar.add("/" + name, arcname=name, recursive=name not in EMPTY)
