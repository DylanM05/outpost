---
id: maintenance-checksum-manifest
title: Verify a backup checksum manifest
system: Backup vault
symbol: equipment
scene: tests
skills: reliability
reviewSkill: reliability
prerequisite: retention-policy
---

## Briefing

An untested backup isn't a backup. Before trusting a nightly snapshot, verify every file in the manifest against its recorded SHA-256 digest and report any missing or corrupted files.

## Objective

Write `verify_manifest(files, expected_hashes)`:

- `files` is a dict `{filename: bytes_or_str}` (encode `str` as UTF-8).
- `expected_hashes` is a dict `{filename: sha256_hex_digest}`.
- Return a **sorted** list of filenames from `expected_hashes` that are either missing from `files` or whose SHA-256 hex digest does not match (case-insensitively). Return `[]` if every expected file is intact.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. For each `name, want` in `expected_hashes.items()`, check `if name not in files` first.
2. Otherwise compute `hashlib.sha256(raw).hexdigest()` and compare with `want.lower()`.

## Starter

```python
```

## Checks

```python
import hashlib
h_a = hashlib.sha256(b"alpha").hexdigest()
h_b = hashlib.sha256(b"beta").hexdigest()
h_c = hashlib.sha256(b"gamma").hexdigest()

expect(
    "all intact returns []",
    lambda: get("verify_manifest")({"a.db": b"alpha", "b.db": "beta"}, {"a.db": h_a, "b.db": h_b}),
    [],
)
expect(
    "reports missing and corrupted files sorted",
    lambda: get("verify_manifest")({"a.db": b"alpha", "b.db": b"CORRUPT"}, {"a.db": h_a, "b.db": h_b, "c.db": h_c}),
    ["b.db", "c.db"],
)
```

## Hidden checks

```python
import hashlib
h_a = hashlib.sha256(b"ok").hexdigest().upper()
expect("uppercase hex digest in manifest still matches", lambda: get("verify_manifest")({"a.db": b"ok", "extra.tmp": b"ignored"}, {"a.db": h_a}), [])
```

## Solution

```python
import hashlib


def verify_manifest(files, expected_hashes):
    bad = []
    for name, want in expected_hashes.items():
        if name not in files:
            bad.append(name)
            continue
        data = files[name]
        raw = data.encode("utf-8") if isinstance(data, str) else data
        if hashlib.sha256(raw).hexdigest() != want.lower():
            bad.append(name)
    return sorted(bad)
```

## Restored

Corrupted or truncated backup archives are flagged before anyone tries to restore from them.
