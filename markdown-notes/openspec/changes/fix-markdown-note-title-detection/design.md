# Design

## Context

ChatGPT is a SPA. Conversation URL, sidebar entry, page title and rendered DOM do not become available atomically. Markdown Notes previously recalculated the title from live DOM during each render and also persisted a provisional filename. That allowed the UI to oscillate when title detection temporarily succeeded and later failed.

## Decision

Introduce a one-way state transition for conversation identity:

```text
unresolved title
    |
    | detect non-generic ChatGPT title
    v
adopted title
```

Once a title is adopted it is stored in `activeState.noteTitle` and persisted through the existing IndexedDB draft store. Later DOM failures no longer invalidate it.

A provisional filename remains valid only while `noteTitle` is unresolved. Once a real title exists, automatic naming derives the target filename from the adopted title. The later `editable-markdown-note-filename` change adds an explicit manual override with higher priority than this automatic rule.

The actual `activeState.filename` is updated only after a successful filesystem write, so persisted metadata reflects a file that was really written.

## Persistence

No IndexedDB version change is required.

Existing fields remain:

- `noteTitle`: authoritative adopted conversation title or `null`.
- `filename`: last successfully written filename.
- `lastSavedAt`: last successful filesystem save timestamp.

Legacy `noteTitle === "Nota de ChatGPT"` is normalized to `null`.

## DOM assumptions

Title discovery remains best-effort and checks:

1. the anchor matching the current conversation path in the sidebar;
2. likely title descendants/attributes in that anchor;
3. known heading selectors;
4. `document.title`.

Selectors are treated as unstable external dependencies. Failure to detect a title degrades to unresolved state rather than manufacturing an authoritative title.

## Trade-off

If a note was physically written under a provisional filename before the real title existed, a later save after title adoption writes the title-derived filename. This change does not automatically delete the older provisional file.
