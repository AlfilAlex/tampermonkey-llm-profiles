# Design

## Context

The existing implementation stores:

- `noteTitle`: authoritative detected conversation title;
- `filename`: filename from the last successful filesystem write.

Using `filename` as both "desired filename" and "last written filename" would make editing ambiguous. It would also make it difficult to tell whether a later automatic title should replace the current value.

## Decision

Add a separate optional draft field:

- `manualFilename`: explicit user override, or `null`.

Keep:

- `filename`: last successfully written filesystem filename.

The effective target filename is computed as:

```text
manualFilename
    |
    | absent
    v
adopted/detected conversation title
    |
    | absent
    v
ChatGPT conversation ID
    |
    | absent
    v
local timestamp YYYY-MM-DD_HH-mm-ss
```

The timestamp source is captured in `filenameFallbackAt` in the in-memory/persisted draft state so the fallback does not change on every render.

## UI

Replace the read-only filename label with a text input.

Behavior:

- the automatic target is shown when no manual override exists;
- typing creates/updates `manualFilename`;
- clearing the field removes the override;
- blur and save normalize the value;
- rendering does not overwrite the field while it has focus.

## Filename normalization

Manual filenames are constrained to one safe filesystem entry:

- trim surrounding whitespace;
- remove control characters;
- replace path separators and common cross-platform invalid filename characters with `-`;
- remove trailing periods/spaces;
- append `.md` if missing;
- guard common Windows reserved stems;
- cap the stem length.

This is normalization, not path support. A user cannot use the field to select subdirectories.

## Persistence

No IndexedDB object-store migration is required. The draft object gains optional fields:

```js
{
  manualFilename: string | null,
  filenameFallbackAt: string
}
```

Older drafts normalize these fields to safe defaults.

## Save semantics

`currentFilename()` returns the desired target filename.

After a successful File System Access API write:

```js
activeState.filename = targetFilename;
```

Changing a manual filename after a save therefore creates/overwrites the new target on the next save. The prior file is intentionally not deleted because automatic deletion would be a separate destructive capability.

## Interaction with title detection

Conversation title adoption continues even when a manual filename exists because the title is still used for Markdown metadata. The manual filename only overrides filesystem identity.
