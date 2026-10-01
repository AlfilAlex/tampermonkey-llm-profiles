# Design

## Editing Model

The toolbar does not own document state. It only transforms text inside existing Markdown-capable textarea elements.

Supported targets:

- .tmn-editor in Libre;
- .tmn-block-notes in Cornell;
- .tmn-summary-editor in Cornell.

Excluded target:

- .tmn-cue-editor.

After each toolbar transformation, the textarea dispatches the same bubbling input event used by keyboard editing. Existing listeners remain responsible for activeState.body, Cornell synchronization, dirty state, and local draft persistence.

## Selection Preservation

The implementation stores the most recently active Markdown textarea plus selectionStart and selectionEnd.

Pointer-down on toolbar buttons prevents unnecessary focus movement. Keyboard activation can still use the stored selection.

If the stored target is stale, the implementation resolves a default target for the active mode.

## Command Types

### Inline wrappers

Bold wraps the selection in two asterisks on each side. Italic uses one asterisk. Inline code uses backticks. With no selection, an editable placeholder is inserted and selected.

A multiline selection sent to inline-code formatting is converted to a fenced code block.

### Line prefixes

Commands operate on complete selected lines, or the current line if selection is empty.

- Heading 2: prefix each target line with `## `.
- Heading 3: prefix each target line with `### `.
- Bullet: prefix each target line with `- `.
- Ordered: prefix lines with incrementing `1. `, `2. `, etc.
- Task: prefix each target line with `- [ ] `.
- Quote: prefix each target line with `> `.

The first implementation performs predictable insertion and does not attempt AST-aware toggle detection.

## Fenced Code

Selected text is wrapped in a standard three-backtick Markdown fence. With no selection, an empty fenced block is inserted and the caret is placed inside. The toolbar does not guess a programming language.

## Link

With selected text, Link produces Markdown link syntax and selects the URL placeholder.

With no selection, it inserts `[texto](https://)` and selects the visible-text placeholder first.

No modal dialog is required.

## Toolbar Visibility

- Libre: visible.
- Cornell: visible.
- Repaso: hidden.

In Cornell mode, Cue is never a formatting target.

## Responsive Layout

The toolbar uses flex layout with wrapping and compact controls so it does not force horizontal scrolling.

## Accessibility

- Toolbar uses role="toolbar".
- Every command has an aria-label and title.
- Buttons are keyboard reachable.
- Applying a command returns focus to the transformed textarea.

## Keyboard Shortcuts

- Cmd/Ctrl+B: bold.
- Cmd/Ctrl+I: italic.
- Cmd/Ctrl+K: link.
- Existing Cmd/Ctrl+S: save.

Shortcuts only apply when a supported Markdown textarea in the notes panel is active.

## Non-goals

- WYSIWYG rendering.
- Markdown preview.
- Undo/redo UI.
- Tables.
- Image upload.
- Emoji picker.
- color/font controls.
- AST-aware Markdown refactoring.
