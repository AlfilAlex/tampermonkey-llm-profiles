# Proposal

## Why

Markdown Notes is an independent Tampermonkey product with its own browser persistence, filesystem permissions, UI, and release lifecycle. Its specifications should not share an OpenSpec root with Prompt Profiles merely because both scripts are stored in the same Git repository.

## What Changes

- Move Markdown Notes into the dedicated `markdown-notes/` project directory.
- Rename the userscript file to `chatgpt-markdown-notes.user.js`; semantic versioning remains in the Tampermonkey `@version` metadata and Git history.
- Use the current Markdown Notes v1.2.0 implementation, including the docked and resizable side panel.
- Initialize `markdown-notes/openspec/` with its own `config.yaml`.
- Establish `markdown-notes` as the only capability governed by this OpenSpec project.
- Do not introduce any dependency on Prompt Profiles.

## Capabilities

### New Capabilities

- `markdown-notes`: defines the observable contract for conversation-associated drafts, docked/resizable notes UI, local persistence, chat title/file identity, filesystem permissions, and save-overwrite behavior.

### Modified Capabilities

None. This is the first OpenSpec definition for Markdown Notes.

## Impact

- Source moves to `markdown-notes/chatgpt-markdown-notes.user.js`.
- OpenSpec state lives only under `markdown-notes/openspec/`.
- The userscript is version 1.2.0.
- Existing IndexedDB/localStorage draft state and saved-file semantics are not intentionally migrated by this repository reorganization.
- Existing installations may need their local Tampermonkey source updated manually if they were copied from the old repository path.
