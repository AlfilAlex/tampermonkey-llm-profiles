# Tasks

## Proposal / design

- [x] Define Cornell mode goals and non-goals.
- [x] Define block-oriented cue/notes data model.
- [x] Define responsive wide/narrow layouts.
- [x] Define review/reveal behavior without recall scoring.
- [x] Define portable Markdown serialization.
- [x] Define compatibility with existing freeform drafts.
- [x] Document filesystem and filename compatibility.
- [ ] Resolve implementation review questions in `design.md` before coding.

## Implementation

- [ ] Extend draft normalization with `noteMode`, Cornell state, and saved Cornell snapshot.
- [ ] Add `Libre | Cornell | Repaso` mode control.
- [ ] Implement Cornell block editor with cue and Markdown notes fields.
- [ ] Implement add, move-up, move-down, and delete actions.
- [ ] Implement full-width Summary editor.
- [ ] Implement responsive two-column/stacked rendering.
- [ ] Implement review mode with hidden notes and explicit reveal.
- [ ] Implement Cornell Markdown serialization.
- [ ] Integrate Cornell dirty-state and successful-save snapshot handling.
- [ ] Preserve existing freeform save path.
- [ ] Preserve existing editable filename resolution and filesystem permission flow.
- [ ] Update README and userscript semantic version when implementation is accepted.

## Validation

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
