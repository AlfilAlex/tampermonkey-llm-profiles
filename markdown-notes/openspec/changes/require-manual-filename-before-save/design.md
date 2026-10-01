# Design

## Rule

Filesystem persistence uses one rule:

```text
valid manualFilename
        |
        v
save enabled
```

If no valid manual filename exists, the browser draft remains editable and persistent but filesystem save is unavailable.

## Filename Input

The input displays only the user's manual filename.

When no manual name exists:

- input value is empty;
- placeholder is `Nombre del archivo (obligatorio)`;
- the Save button is disabled.

The conversation title remains visible separately and continues to be used for Markdown metadata, but it does not populate the filename input.

## Save Guard

UI disabling is not sufficient because Cmd/Ctrl+S can call `saveFile()` directly.

Therefore `saveFile()` begins by resolving the normalized manual filename.

If it is empty:

1. do not set `saving = true`;
2. do not request a directory;
3. do not request filesystem permission;
4. show an error/status message;
5. focus the filename input;
6. return.

This guarantees that no filesystem side effect occurs before filename validation.

## Existing Saved Drafts

`filename` remains the last successfully written filesystem filename.

It is not treated as user confirmation of a filename because older versions could populate it automatically.

Consequently a legacy draft may have:

```js
{
  manualFilename: null,
  filename: "a1b2c3d4_2026-09-30_18-13-42.md"
}
```

That draft loads with an empty filename input and Save disabled.

After the user enters a new manual name and saves successfully, `filename` is updated to that actual written target.

## Dirty State

The canonical note body remains the content dirty-state source.

A filename difference contributes to dirty state only when a valid manual filename exists. Missing filename is represented by the explicit save-required status instead of being treated as a generated target change.

## Legacy Generated Fields

`filenameFallbackId` and `filenameFallbackAt` may remain in normalized state so old IndexedDB objects remain compatible.

No new fallback values are generated.

The automatic filename helper functions should be removed or left unreachable; the save and UI paths must not call them.

## Accessibility

The disabled Save button receives a title explaining why it is disabled.

The filename input keeps its explicit aria-label and receives focus when an attempted keyboard save lacks a name.
