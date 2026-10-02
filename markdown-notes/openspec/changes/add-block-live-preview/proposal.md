# Proposal

## Why

Libre currently exposes the canonical note only as raw Markdown. The formatting toolbar reduces syntax entry, but reading a note still requires mentally parsing Markdown markers.

A Live Preview should make Libre comfortable to read while preserving direct Markdown editing and without replacing the existing canonical `activeState.body` model.

## What Changes

- Add two Libre editing views: `Vista viva` (default) and `Markdown` (existing full-source textarea).
- Implement Live Preview as a block projection over `activeState.body`; no secondary document body is introduced.
- Parse the body into offset-aware visual blocks.
- Render headings, paragraphs, emphasis, inline code, links, lists, task lists, blockquotes, fenced code, horizontal rules, and Cornell semantic headings.
- Clicking or keyboard-activating a rendered block turns only that block into a Markdown textarea.
- Leaving the active block returns it to rendered preview.
- Editing an active preview block writes directly into the corresponding range of `activeState.body` on every input.
- Keep the full Markdown textarea as an escape hatch for document-wide edits.
- Keep the formatting toolbar usable against the currently active Live Preview block.
- Disable formatting actions in Live Preview when no block is actively being edited.
- Preserve Cornell, Repaso, persistence, manual filename, and filesystem behavior.
- Do not execute raw HTML embedded in Markdown.
- Do not add a runtime dependency or external Markdown renderer.

## Cornell Integration

- `## Cornell Notes` renders as a Cornell section heading.
- `### Cue: ...` renders with Cue / Question semantics.
- `## Summary` renders as a Summary section heading.
- Editing any of those blocks exposes the original Markdown syntax.

## Compatibility

- No IndexedDB schema or DB-version change.
- Existing `body` remains authoritative and existing drafts load unchanged.
- Existing full-source Markdown editing remains available.
- Existing Cornell parsing remains unchanged.
- No filesystem/permission behavior changes.
- No external network calls or runtime dependencies.

## Security

Markdown preview MUST NOT inject arbitrary note content through `innerHTML`. Rendered content uses DOM/text nodes and only safe link schemes become clickable.

## Capabilities

### Modified Capabilities

- `markdown-notes`: Libre rendering and editing interaction.

## Version

Markdown Notes becomes v1.8.0.
