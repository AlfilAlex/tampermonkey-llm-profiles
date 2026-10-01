# Tasks

## Design

- [x] Define supported Markdown commands.
- [x] Define supported and excluded textarea targets.
- [x] Define selection/caret preservation.
- [x] Define inline, line-prefix, code, and link transformations.
- [x] Define toolbar visibility and responsive behavior.
- [x] Define keyboard shortcuts and save-shortcut compatibility.

## Implementation

- [x] Add compact responsive Markdown toolbar UI.
- [x] Track the last active Markdown textarea and selection.
- [x] Implement inline wrapper transformation.
- [x] Implement line-prefix transformation.
- [x] Implement ordered-list numbering.
- [x] Implement fenced code transformation.
- [x] Implement Markdown link transformation.
- [x] Dispatch normal input flow after toolbar transformations.
- [x] Hide toolbar in Repaso mode.
- [x] Exclude Cue / Question textarea from Markdown formatting.
- [x] Add Cmd/Ctrl+B, Cmd/Ctrl+I, and Cmd/Ctrl+K.
- [x] Preserve existing Cmd/Ctrl+S behavior.
- [x] Bump userscript and README to v1.6.0.

## Validation

- [ ] Run `node --check markdown-notes/chatgpt-markdown-notes.user.js`.
- [x] Parse the complete userscript successfully with the V8 JavaScript parser.
- [x] Validate formatting with a selection using isolated transformation checks.
- [x] Validate formatting with no selection using isolated transformation checks.
- [x] Validate H2/H3, multiline bullets, ordered lists, tasks, and quote formatting with isolated transformation checks.
- [x] Validate link cursor/selection behavior with isolated transformation checks.
- [x] Validate fenced code insertion with isolated transformation checks.
- [ ] Validate toolbar in Libre.
- [ ] Validate toolbar in Cornell Notes and Summary.
- [ ] Validate Cue fields remain unformatted.
- [ ] Validate toolbar hidden in Repaso.
- [ ] Validate Markdown toolbar changes persist after reload.
- [ ] Validate Cornell formatting remains synchronized with Libre.
- [ ] Validate Cmd/Ctrl+S still saves.
