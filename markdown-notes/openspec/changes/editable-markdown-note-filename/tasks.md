# Tasks

- [x] Add `manualFilename` to normalized per-conversation draft state.
- [x] Add a stable timestamp seed for the no-title/no-chat-ID fallback.
- [x] Implement filename normalization and automatic fallback priority.
- [x] Replace the read-only filename label with an editable input.
- [x] Persist manual filename edits with the existing draft persistence flow.
- [x] Allow clearing the input to return to automatic naming.
- [x] Preserve conversation title metadata independently from filename edits.
- [x] Make a manual filename override take precedence over later title detection.
- [x] Keep `filename` as the last successfully written filesystem target.
- [x] Make Cmd/Ctrl+S work while focus is in either the Markdown editor or filename input.
- [x] Bump Markdown Notes to v1.3.0.
- [x] Parse the modified userscript successfully with the V8 JavaScript parser.
- [ ] Run `node --check markdown-notes/chatgpt-markdown-notes.user.js`.
- [ ] Manual browser validation: edit filename, reload, and confirm the override persists.
- [ ] Manual browser validation: clear filename and confirm automatic naming resumes.
- [ ] Manual browser validation: verify automatic title -> chat ID -> timestamp priority.
- [ ] Manual browser validation: save under one filename, change it, save again, and confirm the old file is not deleted.
- [ ] Manual browser validation: verify invalid/path characters are normalized and cannot create subdirectories.
