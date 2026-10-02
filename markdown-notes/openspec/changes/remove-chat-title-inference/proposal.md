# Proposal

## Why

Markdown Notes still infers `noteTitle` from ChatGPT even though filesystem saving already requires a manual filename. ChatGPT can derive its conversation title from the first user message or from unstable DOM text, so the note header and exported Markdown can still show an unexpected automatic title.

The note identity should be completely user-controlled.

## What Changes

- Remove ChatGPT conversation-title detection from note identity.
- Stop reading sidebar, page heading, or `document.title` for the note title.
- Stop rendering an inferred title in the notes panel.
- Use one manual note-name field as the source for both:
  - Markdown document title;
  - filesystem filename.
- Keep the field empty until the user types a name.
- Keep Save disabled until the manual note name is valid.
- Derive the Markdown title from the normalized filename stem.
- Add an internal unique `noteId` to every browser draft.
- Never display `noteId` and never use it as the visible title or filesystem filename.
- Ignore and clear legacy persisted `noteTitle` values during normalization.

## Example

User types:

```text
Routing Linux
```

The note resolves to:

```text
title: Routing Linux
filename: Routing Linux.md
```

Before the user types that value:

```text
visible title: empty
filename input: empty
save: disabled
```

## Compatibility

- Existing `manualFilename` values remain the manual note name and continue to work.
- Existing inferred `noteTitle` values no longer affect UI or exported Markdown.
- Existing browser drafts receive a generated internal `noteId` when normalized if they do not already have one.
- No IndexedDB object-store migration or database-version bump is required.
- Chat ID and chat URL may remain in exported metadata because they identify the source conversation; they do not control note title or filename.
- Existing saved files are not renamed automatically.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `markdown-notes`: note identity, header UI, Markdown title generation, and compatibility normalization.

## Version

Markdown Notes becomes v1.6.2.
