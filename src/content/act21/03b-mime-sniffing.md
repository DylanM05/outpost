---
id: mime-sniffing
title: Sniff safe MIME types from file magic bytes
system: Range deck
symbol: instrument
scene: tests
skills: http-streaming
---

## Briefing

Trusting a user-supplied filename extension or `Content-Type` header lets an attacker upload an HTML script named `avatar.png`! Media servers inspect the leading **magic bytes** of uploaded payloads and reject anything outside an explicit allowlist.

## Concept

Recognize these exact binary signatures (magic bytes):
- **PNG (`"image/png"`):** starts with `b"\x89PNG\r\n\x1a\n"`
- **JPEG (`"image/jpeg"`):** starts with `b"\xff\xd8\xff"`
- **GIF (`"image/gif"`):** starts with `b"GIF87a"` or `b"GIF89a"`
- **WebP (`"image/webp"`):** length `>= 12`, bytes `[0:4] == b"RIFF"` and `[8:12] == b"WEBP"`
- **PDF (`"application/pdf"`):** starts with `b"%PDF-"`
- **MP4 (`"video/mp4"`):** length `>= 8` and bytes `[4:8] == b"ftyp"`
- Anything else -> `"application/octet-stream"`.

And `validate_upload(data, allowed_types)`:
- Sniff the real MIME type from `data` (ignoring any claimed extension!).
- If the detected MIME type is in `allowed_types`, return `detected_mime`; otherwise raise `ValueError("disallowed media type")`.

## Objective

Implement `sniff_mime(data)` and `validate_upload(data, allowed_types)`.

## Hints

1. Check WebP (`len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"`) and MP4 (`len(data) >= 8 and data[4:8] == b"ftyp"`) carefully using byte slicing so short payloads never raise `IndexError`.

## Starter: guided

```python
def sniff_mime(data):
    if not isinstance(data, bytes):
        raise TypeError("data must be bytes")
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    # Check JPEG, GIF, WebP, PDF, MP4, or fallback to application/octet-stream.
    pass


def validate_upload(data, allowed_types):
    pass
```

## Starter: standard

```python
def sniff_mime(data):
    pass


def validate_upload(data, allowed_types):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("detects PNG", lambda: get("sniff_mime")(b"\x89PNG\r\n\x1a\n\x00\x00"), "image/png")
expect("detects MP4 ftyp box", lambda: get("sniff_mime")(b"\x00\x00\x00\x18ftypisom"), "video/mp4")
expect("detects WebP container", lambda: get("sniff_mime")(b"RIFF\x24\x00\x00\x00WEBPVP8 "), "image/webp")
expect("unknown HTML disguised as image falls back to octet-stream", lambda: get("sniff_mime")(b"<html><script>alert(1)</script></html>"), "application/octet-stream")
expect("validate_upload accepts allowed magic bytes", lambda: get("validate_upload")(b"\xff\xd8\xff\xe0rest", {"image/png", "image/jpeg"}), "image/jpeg")
```

## Hidden checks

```python
expect("detects GIF89a", lambda: get("sniff_mime")(b"GIF89a\x01\x00"), "image/gif")
expect("detects PDF", lambda: get("sniff_mime")(b"%PDF-1.7\n"), "application/pdf")
def _reject_html():
    try:
        get("validate_upload")(b"<html>evil</html>", {"image/png", "image/jpeg"})
        return False
    except ValueError:
        return True
expect("validate_upload rejects disguised HTML", _reject_html, True)
```

## Solution

```python
def sniff_mime(data):
    if not isinstance(data, bytes):
        raise TypeError("data must be bytes")
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data.startswith(b"%PDF-"):
        return "application/pdf"
    if len(data) >= 8 and data[4:8] == b"ftyp":
        return "video/mp4"
    return "application/octet-stream"


def validate_upload(data, allowed_types):
    mime = sniff_mime(data)
    if mime not in allowed_types:
        raise ValueError(f"disallowed media type: {mime}")
    return mime
```

## Restored

The range deck now verifies real file signatures before accepting or serving uploaded media.
