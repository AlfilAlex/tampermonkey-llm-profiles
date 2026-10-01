# Design

## Goal

When no manual filename and no real conversation title are available, expose a unique generated filename that is stable for the draft and contains enough temporal context to be recognizable.

## Resolution Order

```text
manualFilename
    |
    | absent
    v
real conversation title
    |
    | absent
    v
short UUID + local date/time
```

The ChatGPT conversation ID is intentionally removed from filename resolution.

## Generated Format

```text
<short-id>_<YYYY-MM-DD_HH-mm-ss>.md
```

Example:

```text
a1b2c3d4_2026-09-30_18-13-42.md
```

The short identifier uses 8 hexadecimal characters.

## Why the Fallback Must Be Stable

Generating a new random identifier during every render would make the filename field change unexpectedly and could cause consecutive saves to target different files.

Therefore the generated identity becomes draft state:

```js
{
  filenameFallbackId: "a1b2c3d4",
  filenameFallbackAt: "2026-09-30T18:13:42.000Z"
}
```

Both fields are created together the first time the generated fallback is required and then persisted through the existing IndexedDB draft flow.

## ID Generation

Preferred order:

1. `crypto.randomUUID()`, remove hyphens, take the first 8 hexadecimal characters;
2. `crypto.getRandomValues()` for 4 random bytes;
3. `Math.random()` only as a final compatibility fallback.

The identifier is not a security credential. Its purpose is local filename uniqueness and disambiguation.

## Timestamp

The displayed timestamp uses local browser time:

```text
YYYY-MM-DD_HH-mm-ss
```

The persisted value remains an ISO timestamp so it can be formatted consistently after reload.

## Migration

Existing drafts may contain `filenameFallbackAt` but no `filenameFallbackId`.

The implementation MUST NOT treat the legacy timestamp alone as the new generated identity. When a generated fallback is next required:

- create a new short ID;
- set a new fallback timestamp at the same time;
- persist both fields.

This creates one stable generated filename under the new rule.

## Interaction with Title Detection

A generated fallback is not an authoritative title.

If ChatGPT later exposes a real title and the user has not provided a manual filename, automatic resolution returns the title-derived filename instead.

A manual filename always wins.

## Filesystem Semantics

The generated filename is a desired target, while `filename` continues to represent the last successfully written file.

If an earlier file was saved under a different fallback and the target changes, the next save writes the new target. The script does not delete the previous file.
