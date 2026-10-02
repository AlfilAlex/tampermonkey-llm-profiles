# Tasks

## Research and design

- [x] Compare heading/outline UX in Markdown editors.
- [x] Compare semantic Cornell markers used by note-taking tools.
- [x] Define semantic controls that hide internal H2/H3 requirements.
- [x] Define non-destructive preparation for arbitrary Markdown.
- [x] Define explicit transition behavior from Libre to Cornell.
- [x] Define responsive/help behavior.

## Implementation

- [x] Add Cornell compatibility analysis helper.
- [x] Serialize new Cornell blocks with semantic `### Cue:` headings.
- [x] Keep parser compatibility with legacy numbered cue headings.
- [x] Prefer the final top-level Summary delimiter so imported content can contain earlier Summary headings.
- [x] Add non-destructive `prepareCornellBody()`.
- [x] Add semantic cue insertion.
- [x] Add Summary navigation.
- [x] Add Libre-only Cornell structure assistant UI.
- [x] Add compatibility status and block count.
- [x] Add compact semantic help using native details/summary.
- [x] Prevent silent Libre -> Cornell conversion for non-empty unstructured bodies.
- [x] Rename visible H2/H3 controls to generic Sección/Subsec. labels.
- [x] Keep ARIA/title descriptions explicit about H2/H3.
- [x] Integrate assistant refresh into Libre input/render flow.
- [x] Preserve existing draft persistence and filesystem save behavior.
- [x] Update README and userscript version to v1.7.0.

- [ ] Add compact block-local add action beside move/delete controls.
- [ ] Insert new block immediately after the selected block.
- [ ] Focus the inserted block's Cue field.
- [ ] Replace one-click delete/native confirm with inline two-step confirmation.
- [ ] Apply delete confirmation consistently to empty and populated blocks.
- [ ] Add accessible labels/titles for local add and armed delete states.
- [ ] Preserve the existing append-at-end block button.

## Validation

- [ ] Run `node --check markdown-notes/chatgpt-markdown-notes.user.js`.
- [x] Parse the complete userscript successfully with the V8 JavaScript parser.
- [x] Validate empty note preparation with an isolated structure check.
- [x] Validate arbitrary Markdown preparation preserves note content using an isolated parser/serializer check.
- [x] Validate fenced code and heading-like Cornell markers survive preparation in isolated parser/serializer checks.
- [x] Validate semantic Cornell serialization and parsing round-trip, including legacy numbered compatibility.
- [x] Validate Summary navigation caret placement with an isolated string-position check.
- [x] Validate non-canonical Libre gating logic with an isolated compatibility-state check.
- [x] Validate canonical Cornell compatibility-state path with an isolated check.
- [ ] Validate assistant hidden in Cornell and Repaso.
- [ ] Validate narrow-panel wrapping without horizontal scrolling.
- [ ] Validate reload restores the prepared body.
- [ ] Validate conversation switching keeps assistant state derived from each body.
- [ ] Validate save behavior and filesystem permission flow remain unchanged.
