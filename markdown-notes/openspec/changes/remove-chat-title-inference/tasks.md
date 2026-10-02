# Tasks

## Design

- [x] Separate internal draft identity from visible note identity.
- [x] Define one manual note-name source for title and filename.
- [x] Define legacy inferred-title migration.
- [x] Define noteId generation and persistence.
- [x] Define removal of ChatGPT DOM title detection.

## Implementation

- [ ] Add persisted internal `noteId`.
- [ ] Generate `noteId` for new and legacy drafts.
- [ ] Remove automatic title-detection helpers.
- [ ] Remove automatic title-adoption behavior.
- [ ] Remove title polling timer.
- [ ] Remove read-only inferred title from panel header.
- [ ] Keep manual note-name input empty when unset.
- [ ] Derive Markdown title from normalized manual filename stem.
- [ ] Keep Save blocked until manual note name exists.
- [ ] Ignore legacy `noteTitle` values during normalization.
- [ ] Update README and userscript to v1.6.2.

## Validation

- [ ] Run `node --check markdown-notes/chatgpt-markdown-notes.user.js`.
- [ ] Parse the complete userscript successfully.
- [ ] Verify no ChatGPT-title detection functions remain.
- [ ] Verify note-name input is empty with no manual name.
- [ ] Verify Save remains disabled with only a legacy inferred title.
- [ ] Verify manual name produces matching title and filename.
- [ ] Verify internal noteId is not rendered or used as filename.
- [ ] Verify legacy body/Cornell content remains unchanged.
