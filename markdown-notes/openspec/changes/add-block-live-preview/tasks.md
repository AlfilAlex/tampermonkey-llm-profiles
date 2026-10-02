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
- [x] Add Live/Markdown view switch for Libre.
- [x] Default Libre to Live Preview.
- [x] Add offset-aware Markdown block parser.
- [x] Keep fenced code as one block.
- [x] Add safe inline Markdown renderer.
- [x] Render headings, paragraphs, lists, tasks, quotes, horizontal rules, and fenced code.
- [x] Add semantic rendering for Cornell Notes, Cue, and Summary headings.
- [x] Add safe link scheme handling.
- [x] Add rendered-block activation.
- [x] Add per-block textarea editor.
- [x] Replace canonical body range on each block input.
- [x] Reparse/re-render after block blur.
- [x] Add Escape-to-preview behavior.
- [x] Add keyboard activation for rendered blocks.
- [x] Add `.tmn-live-block-editor` to Markdown formatting targets.
- [x] Disable formatting buttons when Live Preview has no active editor.
- [x] Preserve full Markdown textarea behavior.
- [x] Preserve Cornell assistant behavior in both Libre views.
- [x] Add responsive Live Preview CSS.
- [x] Bump userscript and README to v1.8.0.

## Validation
- [ ] Run `node --check markdown-notes/chatgpt-markdown-notes.user.js`.
- [x] Parse the complete userscript successfully with the V8 JavaScript parser.
- [x] Validate block offsets and exact range replacement with an isolated parser/range test.
- [ ] Validate headings and paragraphs render.
- [ ] Validate bold, italic, inline code, and links render safely.
- [ ] Validate unordered, ordered, and task lists render.
- [x] Validate fenced code containing Markdown markers remains one block with an isolated parser test.
- [x] Validate the Live renderer does not use `innerHTML`/HTML injection by static inspection.
- [x] Validate link activation is restricted to HTTP, HTTPS, and mailto by static inspection.
- [ ] Validate Cornell semantic headings render distinctly.
- [x] Validate toolbar target resolution includes the active `.tmn-live-block-editor`.
- [x] Validate toolbar buttons disable when Live Preview has no active editor.
- [x] Validate both views read/write the same `activeState.body` with no secondary body state.
- [ ] Validate reload preserves Live Preview edits through existing draft persistence.
- [ ] Validate conversation switching keeps canonical bodies isolated.
- [ ] Validate Cornell conversion/Repaso still read the same body.
- [ ] Validate narrow panel and long code lines.
- [ ] Validate filesystem save remains unchanged.
