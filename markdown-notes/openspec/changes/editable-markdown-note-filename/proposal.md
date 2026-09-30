# Proposal

## Why

Markdown Notes currently decides the target Markdown filename automatically. That is useful as a default, but the filesystem identity of a note is a user-facing choice and should remain editable.

Automatic naming also needs a deterministic fallback chain when ChatGPT has not exposed a conversation title yet.

## What Changes

- Make the Markdown filename editable directly in the notes panel.
- Persist a user-entered filename per conversation.
- Give an explicit manual filename higher priority than every automatic naming source.
- Resolve automatic filenames in this order:
  1. detected/adopted ChatGPT conversation title;
  2. full ChatGPT conversation ID;
  3. local date and time including seconds.
- Use the local timestamp format `YYYY-MM-DD_HH-mm-ss.md` when neither title nor chat ID is available.
- Normalize manual filenames to a safe single filesystem entry and append `.md` when omitted.
- Allow clearing the manual filename to return to automatic naming.
- Keep Markdown document title metadata independent from the filesystem filename.
- Bump Markdown Notes to v1.3.0.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `markdown-notes`: file identity becomes user-editable and gains an explicit automatic fallback priority.

## Impact

- Source: `markdown-notes/chatgpt-markdown-notes.user.js`.
- README version and behavior description change to v1.3.0.
- IndexedDB schema version remains unchanged; new optional draft fields are normalized without an object-store migration.
- Existing drafts remain compatible.
- Existing saved files are not renamed or deleted automatically.
- If the user changes the filename after a successful save, the next save writes to the new filename and leaves the previous file untouched.
- File System Access permission behavior is unchanged.
