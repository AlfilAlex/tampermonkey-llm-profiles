# Proposal: Preserve Markdown whitespace and page scroll when adding a Cornell Cue

## Why

Clicking **+ Cue / Pregunta** in Libre mode currently calls `prepareCornellBody()`, then parses and reserializes the **entire** document with `serializeCornellBody()`. The parser and serializer trim whitespace from notes and summaries and rebuild blank-line boundaries. The action subsequently uses `editor.focus()`, which can scroll the ChatGPT page unexpectedly.

Adding one Cue should not rewrite unrelated text or move the page.

## What Changes

- Insert exactly one new `### Cue: Pregunta o concepto` heading into the existing text before the canonical `## Summary`, preserving all existing characters, whitespace, line breaks, and line endings.
- If the document has no Cornell structure, create a minimal Cornell wrapper around its original verbatim Markdown instead of normalizing the original content.
- Keep the caret selecting the newly inserted placeholder without scrolling the page or chat viewport when focus changes.
- Keep the existing Cornell parser, Libre/Cornell/Repaso workflow, and asynchronous local-draft persistence.
- Add executable regression tests for repeated insertion, existing blank lines, CRLF, and selection/focus.

## Capabilities

### Modified
- `markdown-notes`: behavior of the Libre-mode **+ Cue / Pregunta** command.

## Impact

- Only `markdown-notes/chatgpt-markdown-notes.user.js` changes at runtime.
- No IndexedDB migration, new permission, filesystem format change, cross-userscript dependency, or network call.
- Existing persisted notes remain readable and unchanged until the user edits them.
