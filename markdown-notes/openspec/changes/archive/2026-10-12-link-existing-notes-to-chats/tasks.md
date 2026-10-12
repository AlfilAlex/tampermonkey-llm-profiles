# Tasks

## 1. Provenance
- [x] 1.1 Store origin chat ID and URL in authored draft state without invalidating old drafts.
- [x] 1.2 Preserve the origin values on subsequent filesystem saves and expose them in the library viewer.

## 2. Library and viewer
- [x] 2.1 Enumerate `.md` documents from the selected directory with explicit read-permission handling.
- [x] 2.2 Add safe, read-only library viewer that never replaces the editable conversation draft.

## 3. Association persistence
- [x] 3.1 Create a per-chat linked-file index in IndexedDB with backward-compatible migration.
- [x] 3.2 Link/unlink files explicitly; preserve their bodies and original metadata, and record `linked_chat_urls`.
- [x] 3.3 Restore linked files on conversation navigation/reload, including missing-file feedback.

## 4. Verification
- [x] 4.1 Validate JavaScript syntax and metadata parser/serializer behavior.
- [x] 4.2 Document manual browser scenarios for permissions, legacy files, Cornell, reload, and overwrite safety.
- [ ] 4.3 Execute those scenarios in Chrome/Edge with Tampermonkey and verify actual filesystem permission behavior.
