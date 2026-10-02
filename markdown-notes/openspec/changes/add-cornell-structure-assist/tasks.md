# Tasks

## Research and design

- [x] Compare heading/outline UX in Markdown editors.
- [x] Compare semantic Cornell markers used by note-taking tools.
- [x] Define semantic controls that hide internal H2/H3 requirements.
- [x] Define non-destructive preparation for arbitrary Markdown.
- [x] Define explicit transition behavior from Libre to Cornell.
- [x] Define responsive/help behavior.

## Implementation

- [ ] Add Cornell compatibility analysis helper.
- [ ] Add non-destructive `prepareCornellBody()`.
- [ ] Add semantic cue insertion.
- [ ] Add Summary navigation.
- [ ] Add Libre-only Cornell structure assistant UI.
- [ ] Add compatibility status and block count.
- [ ] Add compact semantic help using native details/summary.
- [ ] Prevent silent Libre -> Cornell conversion for non-empty unstructured bodies.
- [ ] Rename visible H2/H3 controls to generic Sección/Subsec. labels.
- [ ] Keep ARIA/title descriptions explicit about H2/H3.
- [ ] Integrate assistant refresh into Libre input/render flow.
- [ ] Preserve existing draft persistence and filesystem save behavior.
- [ ] Update README and userscript version to v1.7.0.

## Validation

- [ ] Run `node --check markdown-notes/chatgpt-markdown-notes.user.js`.
- [ ] Parse the complete userscript successfully.
- [ ] Validate empty note preparation.
- [ ] Validate arbitrary Markdown preparation preserves exact content.
- [ ] Validate fenced code/Mermaid/headings survive preparation.
- [ ] Validate cue insertion produces parseable Cornell Markdown.
- [ ] Validate Summary navigation caret placement.
- [ ] Validate non-canonical Libre cannot silently switch to Cornell.
- [ ] Validate canonical Cornell switches normally.
- [ ] Validate assistant hidden in Cornell and Repaso.
- [ ] Validate narrow-panel wrapping without horizontal scrolling.
- [ ] Validate reload restores the prepared body.
- [ ] Validate conversation switching keeps assistant state derived from each body.
- [ ] Validate save behavior and filesystem permission flow remain unchanged.
