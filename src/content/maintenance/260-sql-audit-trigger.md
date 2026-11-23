---
id: maintenance-sql-audit-trigger
language: sql
title: Record deleted hardware rows in a recycle log with an AFTER DELETE trigger
system: Schema forge
symbol: equipment
scene: tests
skills: sql-schema-dml
reviewSkill: sql-schema-dml
prerequisite: sql-correlated-update-delete
---

## Briefing

Whenever a device is removed from `devices`, the schema forge must preserve its `device_id` and `sector` in `deleted_devices_log` automatically using an `AFTER DELETE` trigger.

## Objective

Create a trigger named `trg_log_deleted_device` (`AFTER DELETE ON devices`) that inserts `(OLD.device_id, OLD.sector)` into `deleted_devices_log (device_id, sector)`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `CREATE TRIGGER trg_log_deleted_device AFTER DELETE ON devices BEGIN INSERT INTO deleted_devices_log (device_id, sector) VALUES (OLD.device_id, OLD.sector); END;`.

## Setup

```sql
CREATE TABLE devices (
  device_id TEXT PRIMARY KEY,
  sector TEXT NOT NULL
);

CREATE TABLE deleted_devices_log (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  sector TEXT NOT NULL
);

INSERT INTO devices (device_id, sector) VALUES
  ('D-1', 'north'),
  ('D-2', 'east'),
  ('D-3', 'south');
```

## Starter

```sql
-- Create AFTER DELETE trigger trg_log_deleted_device on devices
```

## Checks

```python
def _test_delete_trigger():
    conn.execute("DELETE FROM devices WHERE device_id = 'D-2'")
    return query("SELECT device_id, sector FROM deleted_devices_log ORDER BY log_id ASC")

expect(
    "trg_log_deleted_device records deleted row D-2 in deleted_devices_log",
    _test_delete_trigger,
    [["D-2", "east"]],
)
```

## Hidden checks

```python
def _test_multi_delete():
    conn.execute("DELETE FROM devices")
    return query("SELECT device_id, sector FROM deleted_devices_log ORDER BY device_id ASC")

expect(
    "records all remaining deleted devices on bulk DELETE",
    _test_multi_delete,
    [
        ["D-1", "north"],
        ["D-2", "east"],
        ["D-3", "south"],
    ],
)
```

## Solution

```sql
CREATE TRIGGER trg_log_deleted_device
AFTER DELETE ON devices
BEGIN
  INSERT INTO deleted_devices_log (device_id, sector)
  VALUES (OLD.device_id, OLD.sector);
END;
```

## Restored

Schema forge deletion audit trigger online — every deleted device record is captured in `deleted_devices_log`.
