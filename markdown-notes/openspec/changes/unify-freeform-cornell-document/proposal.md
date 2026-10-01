# Proposal

## Why

Markdown Notes currently stores Libre content in `body` and Cornell content in a separate `cornell` structure. The two modes therefore behave like independent drafts even though the UI presents them as views of one note.

This creates a confusing failure mode:

- content written in Cornell is not visible in Libre;
- content written in Libre is not visible in Cornell;
- both modes target the same filesystem filename, so whichever mode is saved last can replace the file with a different representation.

The product should instead maintain one note per conversation and expose Libre, Cornell, and Repaso as different views over that same document.

## What Changes

- Make `body` the canonical editable Markdown document for the conversation.
- Treat Cornell structured state as a projection/cache of that canonical Markdown, not a second independent document.
- When Cornell changes, serialize its blocks and summary back into `body` immediately.
- When Libre changes and the user returns to Cornell/Repaso, parse the current `body` into Cornell blocks.
- Preserve the existing Cornell Markdown shape:
  - `## Cornell Notes`;
  - numbered `### N. ...` block headings;
  - `## Summary`.
- If a freeform Markdown note is opened in Cornell for the first time, preserve all of its content by importing it as one Cornell notes block with an empty cue.
- Migrate existing drafts that already contain both non-empty Libre and Cornell content without discarding either representation.
- Save the same canonical `body` regardless of whether the visible UI is Libre, Cornell, or Repaso.
- Keep filename, title detection, File System Access, and per-conversation persistence behavior unchanged.

## UX Result

The mode selector becomes a true view selector:

```text
Libre   <->   Cornell   <->   Repaso
             same note
```

Example:

1. Write two Cornell blocks.
2. Switch to Libre.
3. The textarea immediately shows the Markdown representation of those blocks.
4. Edit that Markdown.
5. Return to Cornell.
6. Cornell reflects the edited Markdown.

## Compatibility

Existing browser drafts are migrated lazily during normalization:

- only Libre content -> remains unchanged until Cornell is opened;
- only Cornell content -> serialize Cornell into canonical `body`;
- both Libre and Cornell content -> preserve both by importing the previous Libre body as an additional Cornell block before the previous Cornell blocks, unless the Libre body is already a valid Cornell document.

Legacy fields such as `savedNoteMode` and `savedCornellSnapshot` may continue to exist in persisted objects for compatibility, but they no longer define save identity.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `markdown-notes`: note mode semantics, Cornell persistence, Markdown serialization, dirty-state behavior, and compatibility migration.

## Impact

- Source: `markdown-notes/chatgpt-markdown-notes.user.js`.
- IndexedDB object stores and database version remain unchanged.
- No filesystem files are renamed or deleted automatically.
- The saved Markdown file and browser draft remain separate persistence layers.
- Markdown Notes version becomes v1.5.0.
