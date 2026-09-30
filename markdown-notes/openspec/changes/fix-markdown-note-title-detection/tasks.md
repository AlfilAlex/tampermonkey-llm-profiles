# Tasks

- [x] Separate the visual fallback from authoritative title detection.
- [x] Improve active-sidebar title extraction.
- [x] Normalize legacy `Nota de ChatGPT` titles as unresolved.
- [x] Add chat-specific provisional filenames.
- [x] Persist an adopted real title as soon as it is detected.
- [x] Prevent later DOM detection failures from reverting the UI to a provisional filename.
- [x] Record the actual target filename only after a successful filesystem write.
- [x] Bump the userscript version to 1.2.1.
- [x] Parse the modified userscript successfully with the V8 JavaScript parser.
- [ ] Run `node --check markdown-notes/chatgpt-markdown-notes.user.js`.
- [ ] Manual browser validation: reload an existing conversation and confirm the title does not revert after first detection.
- [ ] Manual browser validation: switch between conversations and confirm each draft/title remains isolated.
- [ ] Manual browser validation: save before title availability, then save after title adoption and confirm the target filename changes from provisional to title-derived.
- [ ] Manual browser validation: reload and confirm IndexedDB draft persistence.
- [ ] Manual browser validation: confirm filesystem overwrite behavior for an already title-derived filename.
