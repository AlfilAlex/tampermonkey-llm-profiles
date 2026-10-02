# Design

## Identity Model

The draft has two distinct identities:

```text
internal noteId
    |
    | browser-only, generated once
    v
draft identity

manual note name
    |
    +--> Markdown title
    |
    +--> filesystem filename
```

`noteId` is never presented as a fallback to the user.

## Internal noteId

A draft receives a unique ID:

1. prefer `crypto.randomUUID()`;
2. fall back to timestamp plus random suffix only when UUID is unavailable.

Example internal state:

```js
{
  noteId: "4a405040-c2ae-4cb2-87c1-9134c6a94e77"
}
```

This value is persisted in IndexedDB with the draft.

It is not:

- rendered in the panel;
- written as the filename;
- used as Markdown title;
- copied into the note body.

## Manual Name

The existing `manualFilename` field becomes the single user-visible note-name source.

The UI label is conceptually:

```text
Título / nombre del archivo
```

The value remains empty when `manualFilename` is empty.

### Filename

`currentFilename()` continues to normalize the manual value and append `.md`.

### Markdown title

`currentNoteTitle()` is derived only from `currentFilename()`:

1. resolve normalized manual filename;
2. remove final `.md`;
3. return the remaining stem.

No DOM lookup occurs.

## Removed Title Detection

These behaviors are removed from note identity:

- sidebar active-chat title lookup;
- ChatGPT heading lookup;
- `document.title` lookup;
- automatic title adoption;
- title polling timer.

`getChatId()` and `getChatUrl()` remain because source metadata and per-conversation draft isolation still use them.

## Legacy State

Older drafts may contain:

```js
{
  noteTitle: "Text inferred from ChatGPT"
}
```

Normalization ignores this field. The normalized object does not use it as current title.

A legacy draft with a manual filename keeps that manual value.

A legacy draft without a manual filename loads with:

- empty visible note-name field;
- Save disabled;
- a generated internal `noteId`.

## Markdown Generation

Filesystem save is already guarded by the manual-name requirement.

Therefore `buildMarkdown()` can require a non-empty derived title. The successful save produces:

```yaml
title: "Manual note name"
```

and:

```markdown
# Manual note name
```

No inferred ChatGPT title is written.

## UI

The previous read-only conversation-title line is removed from the note header.

Only the required manual note-name input remains.

The ChatGPT conversation title stays visible in ChatGPT's own UI and is not duplicated inside Markdown Notes.

## Persistence

No database schema change is required because draft values are plain objects in the existing `drafts` object store.

`noteId` is added lazily during normalization.
