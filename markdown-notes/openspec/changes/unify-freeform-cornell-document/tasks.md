# Tasks

## Design

- [x] Select `body` as the single canonical note document.
- [x] Define deterministic Cornell Markdown grammar.
- [x] Define Cornell -> body synchronization.
- [x] Define body -> Cornell parsing and non-destructive fallback.
- [x] Define preservation-first migration for legacy dual-content drafts.
- [x] Define unified dirty-state and save semantics.

## Implementation

- [x] Add Cornell body serializer.
- [x] Add Cornell body parser.
- [x] Add migration logic for existing dual-content draft state.
- [x] Synchronize body after every Cornell content mutation.
- [x] Parse/synchronize body before entering Cornell or Repaso.
- [x] Make Libre render the same canonical body.
- [x] Simplify dirty state to canonical body plus filename.
- [x] Make filesystem save independent of selected view.
- [x] Mark Cornell frontmatter from canonical body structure.
- [x] Preserve Repaso as a read-only view of the same Cornell projection.
- [x] Bump userscript and README to v1.5.0.

## Validation

- [ ] Run `node --check markdown-notes/chatgpt-markdown-notes.user.js`.
- [x] Parse the complete userscript successfully with the V8 JavaScript parser.
- [ ] Validate Cornell -> Libre shows the same content immediately.
- [ ] Validate Libre edit -> Cornell rebuilds the expected blocks.
- [x] Validate arbitrary freeform Markdown enters Cornell without losing text using a parser/serializer round-trip check.
- [ ] Validate a legacy body-only draft remains unchanged.
- [ ] Validate a legacy Cornell-only draft migrates into body.
- [ ] Validate a legacy draft containing both contents preserves both.
- [ ] Validate reload restores the same canonical body and selected view.
- [ ] Validate conversation switching keeps documents isolated.
- [ ] Validate save from Libre and Cornell produces the same canonical document.
- [ ] Validate filesystem write failure preserves browser draft state.
