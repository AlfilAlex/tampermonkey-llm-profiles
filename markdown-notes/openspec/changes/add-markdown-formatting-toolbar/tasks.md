# Tasks

## Design

- [x] Define supported Markdown commands.
- [x] Define supported and excluded textarea targets.
- [x] Define selection/caret preservation.
- [x] Define inline, line-prefix, code, and link transformations.
- [x] Define toolbar visibility and responsive behavior.
- [x] Define keyboard shortcuts and save-shortcut compatibility.

## Implementation

- [ ] Add compact responsive Markdown toolbar UI.
- [ ] Track the last active Markdown textarea and selection.
- [ ] Implement inline wrapper transformation.
- [ ] Implement line-prefix transformation.
- [ ] Implement ordered-list numbering.
- [ ] Implement fenced code transformation.
- [ ] Implement Markdown link transformation.
- [ ] Dispatch normal input flow after toolbar transformations.
- [ ] Hide toolbar in Repaso mode.
- [ ] Exclude Cue / Question textarea from Markdown formatting.
- [ ] Add Cmd/Ctrl+B, Cmd/Ctrl+I, and Cmd/Ctrl+K.
- [ ] Preserve existing Cmd/Ctrl+S behavior.
- [ ] Bump userscript and README to v1.6.0.

## Validation

- [ ] Run `node --check markdown-notes/chatgpt-markdown-notes.user.js`.
- [ ] Parse the complete userscript successfully.
- [ ] Validate formatting with a selection.
- [ ] Validate formatting with no selection.
- [ ] Validate multiline bullets, ordered lists, tasks, and quote formatting.
- [ ] Validate link cursor/selection behavior.
- [ ] Validate fenced code insertion.
- [ ] Validate toolbar in Libre.
- [ ] Validate toolbar in Cornell Notes and Summary.
- [ ] Validate Cue fields remain unformatted.
- [ ] Validate toolbar hidden in Repaso.
- [ ] Validate Markdown toolbar changes persist after reload.
- [ ] Validate Cornell formatting remains synchronized with Libre.
- [ ] Validate Cmd/Ctrl+S still saves.
