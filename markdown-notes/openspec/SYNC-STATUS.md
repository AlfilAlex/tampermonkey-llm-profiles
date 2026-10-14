# OpenSpec synchronization status

**Branch:** `feat/markdown-notes-panel-layouts`  
**Base:** `master` (2026-10-14)  
**Operation:** spec sync only — no archive, userscript merge, or browser validation.

## Canonical capabilities

| Canonical spec | Requirements | Scenarios |
| --- | ---: | ---: |
| `specs/markdown-notes/spec.md` | 49 | 143 |
| `specs/udemy-lecture-notes/spec.md` | 8 | 13 |
| **Total** | **57** | **156** |

## Synchronized sources

- `changes/add-cornell-structure-assist/`: assistant requirements and compatible mode/freeform scenarios.
- `changes/add-markdown-formatting-toolbar/`: toolbar formatting and keyboard-shortcut requirements.
- `changes/remove-chat-title-inference/`: the current manual note naming policy and unique internal draft IDs.
- `changes/require-manual-filename-before-save/`: pre-save filename validation and persistence.
- `changes/editable-markdown-note-filename/`: compatible filename editing and reload scenarios.
- `changes/unify-freeform-cornell-document/`: compatible single-body, Cornell projection, migration, and save-baseline scenarios.
- `changes/fix-revert-version-monotonicity/`: version and update-source requirements.
- `changes/support-udemy-lectures/`: new dedicated canonical Udemy lecture capability.
- `changes/panel-layout-modes/`: the pending side, bottom and floating panel requirements from PR #24.

## Superseded historical deltas

The following historical requirements were **not blindly applied**, because
the current implementation and later OpenSpec deltas supersede them:

- `changes/fix-markdown-note-title-detection/` and
  `changes/fix-accessibility-title-false-positive/` — previous automatic
  conversation-title identification is no longer used as note identity.
- `changes/generate-unique-fallback-filename/` — generated filename
  fallbacks are replaced by explicit manual naming.
- The former canonical `Automatic filename resolution` requirement was
  removed because it contradicted `require-manual-filename-before-save`.
- The older automatic Cornell entry/numbered headings in
  `unify-freeform-cornell-document/` were not copied over the later explicit
  `Preparar Cornell` and semantic `### Cue:` behavior.

Related compatible scenarios were merged, not duplicated. This document
records the reconciliation so that a future archive operation is auditable.

## Not synced

- `initialize-openspec` changes in both projects have proposals but no
  delta specs to synchronize.
- Prompt Profiles has no new delta specification requiring sync.

## Pending validation

- PR #24 is still a **draft**. Its layout implementation and tests require
  real Chrome/Tampermonkey visual verification and Node test execution.
- Earlier changes contain unchecked manual-test tasks; spec sync does not
  imply those tests ran.
- No automated `openspec validate` CLI invocation was performed in this
  environment.

**Archive remains separate:** keep all change folders and their original
tasks; do not mark incomplete tasks done merely because the canonical
specification has been synchronized.
