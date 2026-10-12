# Proposal: Choose an active document per chat

## Why
Current Library links documents for read-only viewing, while each chat edits an unrelated draft. The intended workflow is to let a new chat **create a new note or continue editing a previously saved note**.

## What Changes
- Add clear **Crear nuevo** and **Elegir existente** actions.
- Selecting an existing file makes it the active editable note for that chat, preserving the filename and original chat metadata.
- Continue saving to the same file across multiple chats (one file, multiple associations).
- Retain independent chat draft state for unsaved edits and a snapshot of the loaded file.
- Reject silent overwrites when another editor changed the shared file.
- Distinguish read-only preview from explicit activation, with confirmation before replacing an unsaved draft.
- Keep selections made before ChatGPT allocates a permanent chat ID through the existing temporary-state migration.

## Capabilities
### Modified Capabilities
- markdown-notes: active note choice and shared file editing across chats.

## Impact
- Only Markdown Notes is modified; Prompt Profiles remains independent.
- The existing IndexedDB draft model gets optional fields; old drafts remain readable.
- The chosen directory and file metadata formats are reused.
- No remote syncing or automatic ChatGPT message attachments are introduced.
