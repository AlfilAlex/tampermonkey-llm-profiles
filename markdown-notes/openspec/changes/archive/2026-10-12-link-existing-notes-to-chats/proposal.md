# Proposal: Link existing Markdown notes to conversations

## Why

Markdown Notes already writes `chat_id` and `chat_url` to each new file. However, those fields currently follow the active chat on subsequent saves; the application cannot browse saved notes, and its single editable draft per chat cannot expose existing documents in several conversations.

## What Changes

- Preserve the original chat's `chat_id` and `chat_url` on subsequent file saves.
- Add a file browser to the existing Markdown Notes side panel, scoped to the directory explicitly authorized by the user.
- Display saved Markdown files and allow a safe, read-only preview with the filename and origin-chat link when present.
- Allow users to associate an existing file with the current chat without copying the file, replacing the current editable draft, or sending its contents to ChatGPT.
- Persist those associations in local IndexedDB and in portable Markdown metadata (`linked_chat_urls`).
- Restore associated file references on return/reload, and support removing associations explicitly.
- Handle older Markdown files, missing origin metadata, revoked permissions, missing files, and external file changes without overwriting note content silently.

## Capabilities

### Modified Capabilities
- `markdown-notes`: origin provenance, local folder browser, read-only viewer, and association of existing Markdown files with multiple conversations.

## Impact

- Only `markdown-notes/` changes. No runtime dependency on Prompt Profiles.
- New optional fields in draft state and the Markdown front matter; existing drafts and files remain readable.
- New IndexedDB object store for associations (database schema version bump).
- The existing File System Access API permission boundaries continue to apply.
- File content and chat messages are never uploaded; opening a file is a local browser action.
- Linking and unlinking may update metadata in an authorized local file, only after an explicit user action.
