# Tasks

## Design
- [x] Keep `activeState.body` as the only canonical note body.
- [x] Define ephemeral Live/Markdown view state.
- [x] Define offset-aware block parsing.
- [x] Define per-block editing and canonical range replacement.
- [x] Define safe DOM rendering without raw HTML injection.
- [x] Define toolbar behavior for active/inactive Live blocks.
- [x] Define Cornell semantic rendering.
- [x] Define keyboard and responsive behavior.

## Implementation
- [ ] Add Live/Markdown view switch for Libre.
- [ ] Default Libre to Live Preview.
- [ ] Add offset-aware Markdown block parser.
- [ ] Keep fenced code as one block.
- [ ] Add safe inline Markdown renderer.
- [ ] Render headings, paragraphs, lists, tasks, quotes, horizontal rules, and fenced code.
- [ ] Add semantic rendering for Cornell Notes, Cue, and Summary headings.
- [ ] Add safe link scheme handling.
- [ ] Add rendered-block activation.
- [ ] Add per-block textarea editor.
- [ ] Replace canonical body range on each block input.
- [ ] Reparse/re-render after block blur.
- [ ] Add Escape-to-preview behavior.
- [ ] Add keyboard activation for rendered blocks.
- [ ] Add `.tmn-live-block-editor` to Markdown formatting targets.
- [ ] Disable formatting buttons when Live Preview has no active editor.
- [ ] Preserve full Markdown textarea behavior.
- [ ] Preserve Cornell assistant behavior in both Libre views.
- [ ] Add responsive Live Preview CSS.
- [ ] Bump userscript and README to v1.8.0.

## Validation
- [ ] Run `node --check markdown-notes/chatgpt-markdown-notes.user.js`.
- [ ] Parse the complete userscript successfully.
- [ ] Validate block offsets and exact range replacement.
- [ ] Validate headings and paragraphs render.
- [ ] Validate bold, italic, inline code, and links render safely.
- [ ] Validate unordered, ordered, and task lists render.
- [ ] Validate fenced code containing Markdown markers remains one block.
- [ ] Validate raw HTML is not executed.
- [ ] Validate unsafe URL schemes are not clickable.
- [ ] Validate Cornell semantic headings render distinctly.
- [ ] Validate toolbar targets an active Live block.
- [ ] Validate toolbar is disabled with no active Live block.
- [ ] Validate full source and Live Preview share exact body.
- [ ] Validate reload preserves Live Preview edits through existing draft persistence.
- [ ] Validate conversation switching keeps canonical bodies isolated.
- [ ] Validate Cornell conversion/Repaso still read the same body.
- [ ] Validate narrow panel and long code lines.
- [ ] Validate filesystem save remains unchanged.
