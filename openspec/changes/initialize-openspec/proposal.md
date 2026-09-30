# Proposal

## Why

The repository contains two independent ChatGPT userscripts that are evolving separately, but there is no version-controlled specification layer that defines their observable behavior, compatibility constraints, or persistence guarantees before implementation changes are made.

Introduce OpenSpec so future work starts from explicit capability contracts for each userscript while keeping both components independent inside the same repository.

## What Changes

- Add a repository-level `openspec/config.yaml` using the built-in `spec-driven` workflow.
- Define shared project context and artifact rules for Tampermonkey, browser storage, ChatGPT DOM integration, filesystem permissions, compatibility, and validation.
- Introduce two independent OpenSpec capabilities:
  - `prompt-profiles`
  - `markdown-notes`
- Establish that each capability receives its own spec and change deltas.
- Allow a future change to affect both capabilities only when cross-component behavior is explicitly required.
- Preserve the current JavaScript implementations unchanged as part of this initialization.
- No runtime dependency, browser storage migration, or user-visible behavior change is introduced by this proposal.

## Capabilities

### New Capabilities

- `prompt-profiles`: behavioral contract for outgoing prompt injection, per-conversation profile state, profile management, rendered-message cleanup, and compatibility with normal ChatGPT submission behavior.
- `markdown-notes`: behavioral contract for conversation-associated Markdown drafts, local persistence, local filesystem saves, note identity, and browser capability fallbacks.

### Modified Capabilities

None. This repository does not currently have OpenSpec capability specs.

## Impact

- Affected repository areas:
  - new `openspec/config.yaml`
  - new `openspec/changes/initialize-openspec/` planning artifacts
  - future `openspec/specs/prompt-profiles/spec.md`
  - future `openspec/specs/markdown-notes/spec.md`
- Existing userscripts are not modified by this proposal.
- Existing Tampermonkey installations are unaffected.
- Existing GM storage, localStorage, IndexedDB, and File System Access handles are unaffected.
- No external dependency is added to the runtime userscripts.
- OpenSpec becomes a development/planning dependency for contributors who want to create, review, apply, or archive specification-driven changes.
