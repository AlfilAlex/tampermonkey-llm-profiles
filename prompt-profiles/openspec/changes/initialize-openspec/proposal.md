# Proposal

## Why

Prompt Profiles is an independent Tampermonkey product and should have its own OpenSpec project, lifecycle, configuration, and change history instead of sharing specification state with an unrelated userscript that only happens to live in the same Git repository.

## What Changes

- Move Prompt Profiles into the dedicated `prompt-profiles/` project directory.
- Rename the userscript file to `chatgpt-prompt-profiles.user.js`; semantic versioning remains in the Tampermonkey `@version` metadata and Git history.
- Initialize `prompt-profiles/openspec/` with its own `config.yaml`.
- Establish `prompt-profiles` as the only capability governed by this OpenSpec project.
- Keep the current v1.3.0 runtime behavior unchanged.
- Do not introduce any dependency on Markdown Notes.

## Capabilities

### New Capabilities

- `prompt-profiles`: defines the observable contract for message injection, profile selection and management, per-conversation state, local rendered-message cleanup, and compatibility with ChatGPT submission behavior.

### Modified Capabilities

None. This is the first OpenSpec definition for Prompt Profiles.

## Impact

- Source moves from the repository root to `prompt-profiles/chatgpt-prompt-profiles.user.js`.
- OpenSpec state lives only under `prompt-profiles/openspec/`.
- The userscript remains version 1.3.0.
- Existing Tampermonkey runtime behavior is unchanged.
- No GM storage schema or persisted per-conversation state is changed.
- Existing installations may need their local Tampermonkey source updated manually if they were copied from the old repository path.
