# Tasks

## Proposal / design

- [x] Define Cornell mode goals and non-goals.
- [x] Define block-oriented cue/notes data model.
- [x] Define responsive wide/narrow layouts.
- [x] Define review/reveal behavior without recall scoring.
- [x] Define portable Markdown serialization.
- [x] Define compatibility with existing freeform drafts.
- [x] Document filesystem and filename compatibility.
- [x] Resolve implementation review questions in `design.md` before coding.

## Implementation

- [x] Extend draft normalization with `noteMode`, Cornell state, and saved Cornell snapshot.
- [x] Add `Libre | Cornell | Repaso` mode control.
- [x] Implement Cornell block editor with cue and Markdown notes fields.
- [x] Implement add, move-up, move-down, and delete actions.
- [x] Implement full-width Summary editor.
- [x] Implement responsive two-column/stacked rendering.
- [x] Implement review mode with hidden notes and explicit reveal.
- [x] Implement Cornell Markdown serialization.
- [x] Integrate Cornell dirty-state and successful-save snapshot handling.
- [x] Preserve existing freeform save path.
- [x] Preserve existing editable filename resolution and filesystem permission flow.
- [x] Update README and userscript semantic version to v1.4.0.

## Validation

- [x] Parse the modified userscript successfully with the V8 JavaScript parser.
- [ ] Run `node --check markdown-notes/chatgpt-markdown-notes.user.js`.
- [ ] Validate existing freeform drafts load unchanged.
- [ ] Validate Cornell draft persistence across reload.
- [ ] Validate conversation switching with different note modes.
- [ ] Validate new-chat temporary-key migration after ChatGPT assigns a conversation ID.
- [ ] Validate block add/reorder/delete persistence.
- [ ] Validate wide panel cue/notes layout.
- [ ] Validate narrow panel and mobile stacked layout.
- [ ] Validate keyboard navigation and accessible labels.
- [ ] Validate review reveal/hide without modifying note data.
- [ ] Validate Cornell Markdown with paragraphs, lists, fenced code, and Mermaid.
- [ ] Validate filename editing and existing fallback priority in Cornell mode.
- [ ] Validate saved-directory permission re-request/error behavior.
- [ ] Validate filesystem save does not destroy browser draft when writing fails.
