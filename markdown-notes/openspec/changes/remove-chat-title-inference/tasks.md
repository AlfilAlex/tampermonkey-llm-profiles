# Tasks

## Design

- [x] Separate internal draft identity from visible note identity.
- [x] Define one manual note-name source for title and filename.
- [x] Define legacy inferred-title migration.
- [x] Define noteId generation and persistence.
- [x] Define removal of ChatGPT DOM title detection.

## Implementation

- [x] Add persisted internal `noteId`.
- [x] Generate `noteId` for new and legacy drafts.
- [x] Remove automatic title-detection helpers.
- [x] Remove automatic title-adoption behavior.
- [x] Remove title polling timer.
- [x] Remove read-only inferred title from panel header.
- [x] Keep manual note-name input empty when unset in the render path.
- [x] Derive Markdown title from normalized manual filename stem.
- [x] Keep Save blocked until manual note name exists.
- [x] Ignore legacy `noteTitle` values during normalization.
- [x] Update README and userscript to v1.6.2.

## Validation

- [ ] Run `node --check markdown-notes/chatgpt-markdown-notes.user.js`.
- [x] Parse the complete userscript successfully with the V8 JavaScript parser.
- [x] Verify no ChatGPT-title detection functions remain by static search.
- [ ] Verify note-name input is empty with no manual name.
- [ ] Verify Save remains disabled with only a legacy inferred title.
- [ ] Verify manual name produces matching title and filename.
- [x] Verify internal noteId is not rendered or used as filename by static search.
- [ ] Verify legacy body/Cornell content remains unchanged.
