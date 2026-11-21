---
id: inode-fs
title: Separate filenames from reference-counted inodes
system: Inode rack
symbol: equipment
scene: tests
skills: os-filesystems
---

## Briefing

In Unix filesystems, a filename is **not** the file — it is just a directory entry pointing to an **inode number** (`ino`). Multiple filenames (**hard links**) can point to the exact same inode, and `unlink()` deletes the underlying file data ONLY when the inode's link count (`nlink`) drops to `0`!

## Concept

Maintain two tables:
- `dir_entries`: dict `name -> ino`
- `inodes`: dict `ino -> {"data": str, "nlink": int}`

Operations:
- `create(name, data="")`: raise `FileExistsError` if `name` already exists; allocate a fresh `ino` (`1, 2, 3, ...`), set `inodes[ino] = {"data": data, "nlink": 1}`, `dir_entries[name] = ino`, return `ino`.
- `link(existing_name, new_name)`: raise `FileNotFoundError` if `existing_name` missing, `FileExistsError` if `new_name` already exists; point `dir_entries[new_name] = ino` and increment `inodes[ino]["nlink"] += 1`!
- `read(name)` / `write(name, data)`: raise `FileNotFoundError` if missing; read or overwrite `inodes[ino]["data"]` (visible through ALL hard links to that inode!).
- `unlink(name)`: raise `FileNotFoundError` if missing; pop `ino = dir_entries.pop(name)`, decrement `inodes[ino]["nlink"] -= 1`, and delete `inodes[ino]` ONLY when `nlink == 0`!
- `stat(name)`: raise `FileNotFoundError` if missing; return `{"ino": ino, "nlink": inode["nlink"], "size": len(inode["data"])}`.

## Objective

Implement `InodeFS` with `create`, `link`, `read`, `write`, `unlink`, and `stat`.

## Hints

1. Notice that writing through one hard link updates `inodes[ino]["data"]`, so reading through the other hard link sees the new content immediately!
2. Track `len(fs.inodes)` after unlinking one of two hard links — the inode stays alive (`nlink == 1`) until the final link is unlinked!

## Starter: guided

```python
class InodeFS:
    def __init__(self):
        self.next_ino = 1
        self.dir_entries = {}
        self.inodes = {}

    def create(self, name, data=""):
        if name in self.dir_entries:
            raise FileExistsError(name)
        ino = self.next_ino
        self.next_ino += 1
        self.inodes[ino] = {"data": data, "nlink": 1}
        self.dir_entries[name] = ino
        return ino

    def link(self, existing_name, new_name):
        pass

    def read(self, name):
        pass

    def write(self, name, data):
        pass

    def unlink(self, name):
        pass

    def stat(self, name):
        pass
```

## Starter: standard

```python
class InodeFS:
    def __init__(self):
        pass

    def create(self, name, data=""):
        pass

    def link(self, existing_name, new_name):
        pass

    def read(self, name):
        pass

    def write(self, name, data):
        pass

    def unlink(self, name):
        pass

    def stat(self, name):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _hardlinks():
    fs = get("InodeFS")()
    ino = fs.create("log.txt", "hello")
    fs.link("log.txt", "backup.txt")
    fs.write("backup.txt", "updated!")
    st_both = fs.stat("log.txt")
    fs.unlink("log.txt")
    still_there = fs.read("backup.txt")
    st_one = fs.stat("backup.txt")
    fs.unlink("backup.txt")
    return (ino, st_both, still_there, st_one, len(fs.inodes))
expect("hard links share one inode and data survives until nlink hits 0", _hardlinks, (
    1,
    {"ino": 1, "nlink": 2, "size": 8},
    "updated!",
    {"ino": 1, "nlink": 1, "size": 8},
    0,
))
```

## Hidden checks

```python
def _errors():
    fs = get("InodeFS")()
    fs.create("a", "1")
    errs = []
    for fn in [
        lambda: fs.create("a"),
        lambda: fs.link("missing", "b"),
        lambda: fs.link("a", "a"),
        lambda: fs.read("missing"),
        lambda: fs.unlink("missing"),
    ]:
        try:
            fn()
            errs.append("ok")
        except FileExistsError:
            errs.append("exists")
        except FileNotFoundError:
            errs.append("missing")
    return errs
expect("raises accurate FileExistsError and FileNotFoundError", _errors, ["exists", "missing", "exists", "missing", "missing"])
```

## Solution

```python
class InodeFS:
    def __init__(self):
        self.next_ino = 1
        self.dir_entries = {}
        self.inodes = {}

    def create(self, name, data=""):
        if name in self.dir_entries:
            raise FileExistsError(name)
        ino = self.next_ino
        self.next_ino += 1
        self.inodes[ino] = {"data": data, "nlink": 1}
        self.dir_entries[name] = ino
        return ino

    def link(self, existing_name, new_name):
        if existing_name not in self.dir_entries:
            raise FileNotFoundError(existing_name)
        if new_name in self.dir_entries:
            raise FileExistsError(new_name)
        ino = self.dir_entries[existing_name]
        self.dir_entries[new_name] = ino
        self.inodes[ino]["nlink"] += 1

    def read(self, name):
        if name not in self.dir_entries:
            raise FileNotFoundError(name)
        return self.inodes[self.dir_entries[name]]["data"]

    def write(self, name, data):
        if name not in self.dir_entries:
            raise FileNotFoundError(name)
        self.inodes[self.dir_entries[name]]["data"] = data

    def unlink(self, name):
        if name not in self.dir_entries:
            raise FileNotFoundError(name)
        ino = self.dir_entries.pop(name)
        self.inodes[ino]["nlink"] -= 1
        if self.inodes[ino]["nlink"] == 0:
            del self.inodes[ino]

    def stat(self, name):
        if name not in self.dir_entries:
            raise FileNotFoundError(name)
        ino = self.dir_entries[name]
        inode = self.inodes[ino]
        return {"ino": ino, "nlink": inode["nlink"], "size": len(inode["data"])}
```

## Restored

Directory names now point cleanly to reference-counted inodes with exact Unix hard-link and unlink semantics.
