# Proposal

## Why

Automatic filename inference has proven unreliable in ChatGPT's changing DOM and can produce unexpected filenames. The filename field should represent an explicit user decision instead of a generated or inferred value.

A note may continue to exist as a browser draft without a filename, but filesystem save must require the user to choose a name first.

## What Changes

- Remove automatic filename resolution from the filesystem save path.
- Do not infer filenames from:
  - conversation title;
  - chat ID;
  - UUID/timestamp fallback.
- Treat `manualFilename` as the only valid save target.
- Show an empty filename input when no manual filename has been chosen.
- Disable `Guardar nota / Guardar cambios` while the filename is missing.
- Show a clear status indicating that a filename is required.
- Guard `saveFile()` as well, so keyboard shortcuts or programmatic calls cannot save without a manual filename.
- Focus the filename input when a save is attempted without a name.
- Continue appending `.md` automatically when the user omits the extension.
- Preserve existing browser drafts regardless of filename state.

## Compatibility

- No IndexedDB schema migration.
- Existing `manualFilename` values remain valid.
- Legacy `filename`, `filenameFallbackId`, and `filenameFallbackAt` values may remain stored for compatibility/history but no longer authorize a new filesystem save.
- A previously auto-saved file is not deleted or renamed automatically.
- If an existing draft has no manual filename, the user must explicitly enter one before its next filesystem save.
- File System Access permissions and configured directory handles are unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `markdown-notes`: file identity and filesystem save eligibility.

## Version

Markdown Notes becomes v1.6.1 on top of the Markdown-toolbar change.
