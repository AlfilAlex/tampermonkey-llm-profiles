# Proposal

## Why

Markdown Notes currently requires users to type Markdown syntax manually. That is efficient for experienced users but creates unnecessary friction for common formatting operations, especially inside the narrow side panel and when editing Cornell notes.

The editor should provide lightweight formatting controls without replacing Markdown as the underlying document format.

## What Changes

- Add a compact Markdown formatting toolbar to the notes panel.
- Keep Markdown textareas as the editing surface; do not introduce a rich-text editor or HTML document model.
- Support:
  - bold;
  - italic;
  - H2;
  - H3;
  - unordered list;
  - ordered list;
  - task list;
  - blockquote;
  - inline code;
  - fenced code block;
  - link.
- Apply formatting to the currently selected text or insert an editable placeholder when no text is selected.
- Apply line-based formatting to every selected line for headings, lists, task lists, and blockquotes.
- Use the toolbar in:
  - Libre;
  - Cornell Notes fields;
  - Cornell Summary.
- Do not apply Markdown formatting to Cornell Cue / Question fields.
- Hide the formatting toolbar in Repaso mode.
- Preserve existing canonical-body synchronization: formatting Cornell Notes/Summary must immediately update the same canonical body seen by Libre.
- Preserve keyboard editing and existing save shortcuts.

## UX

The toolbar is compact and wraps when the panel is narrow. Buttons use short visible labels plus descriptive title and aria-label attributes.

The toolbar acts on the last active Markdown textarea so clicking a toolbar button does not lose the user's text selection.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- markdown-notes: Markdown editing interaction in Libre and Cornell modes.

## Compatibility

- No IndexedDB schema changes.
- No filesystem behavior changes.
- No new runtime dependency.
- Existing drafts and saved Markdown remain unchanged.
- Toolbar operations write ordinary Markdown syntax into the canonical document.
- Markdown Notes version becomes v1.6.0.
