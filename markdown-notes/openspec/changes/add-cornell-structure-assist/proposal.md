# Proposal

## Why

Libre and Cornell now share one canonical Markdown body, but the relationship is still too implicit.

The current Cornell parser recognizes a specific generated structure:

- `## Cornell Notes`
- semantic `### Cue: ...` headings (while continuing to read legacy numbered cue headings)
- `## Summary`

A user editing in Libre sees generic Markdown controls such as H2/H3 and has no clear indication of:

- whether the current note is already Cornell-compatible;
- whether H1/H2/H3 have special Cornell meaning;
- what will happen when switching to Cornell;
- how to create another cue block without manually reproducing internal Markdown structure.

This makes Libre feel like a separate expert-only representation even though it is supposed to be an equivalent view of the same note.

## What Changes

- Add a semantic Cornell structure assistant visible only in Libre.
- Show a compatibility state:
  - empty note;
  - free Markdown not yet structured as Cornell;
  - Cornell-ready with detected block count.
- Add `Preparar Cornell`:
  - empty note -> creates an empty Cornell document skeleton;
  - arbitrary non-empty free Markdown -> preserves all content as one neutral Cornell block;
  - already compatible note -> no destructive change.
- Add `+ Cue / Pregunta`:
  - ensures Cornell structure exists;
  - inserts a new cue block before Summary;
  - selects the cue placeholder so the user can type immediately.
- Add `Ir a resumen`:
  - ensures Cornell structure exists;
  - moves the caret to the Summary body.
- Add a compact help disclosure explaining the semantic model:
  - document title is managed by the required manual note name;
  - Cue/Pregunta creates Cornell blocks;
  - text beneath a cue is that block's notes;
  - Summary is the final synthesis;
  - H2/H3 remain ordinary Markdown formatting and are not required for Cornell conversion.
- Rename the visible H2/H3 toolbar labels to semantic generic-format labels such as `Sección` and `Subsec.`, while keeping their Markdown behavior unchanged.
- Prevent a silent switch from non-empty unstructured Libre content into Cornell:
  - remain in Libre;
  - surface guidance to prepare the note first.
- Keep empty notes and already-compatible Cornell Markdown switchable without extra friction.

## UX Principle

Users choose semantic intent; the implementation chooses Markdown syntax.

The expected flow becomes:

```text
Libre
  |
  +-- Preparar Cornell
  |
  +-- + Cue / Pregunta
  |
  +-- Ir a resumen
  |
  v
Cornell listo · N bloques
  |
  v
Cornell / Repaso
```

The user never needs to know that the persisted representation uses H2/H3 internally.

## Compatibility

- No IndexedDB schema change.
- No filesystem permission change.
- No new runtime dependency.
- Existing arbitrary Libre notes remain untouched until the user explicitly prepares them for Cornell.
- Existing canonical Cornell Markdown is recognized without rewriting.
- Existing Cornell structured state remains derived from the canonical body.
- Preparation preserves arbitrary Markdown, including lists, fenced code, Mermaid, and headings, by placing it in one neutral notes block.
- The saved Markdown remains portable. New Cornell serialization uses semantic `### Cue: ...` headings; legacy numbered Cornell documents remain readable.
- Conversation isolation, reload persistence, manual filename requirements, and saved-file behavior remain unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `markdown-notes`: Libre/Cornell mode transition, Cornell structure discoverability, and semantic Markdown editing assistance.

## Version

Markdown Notes becomes v1.7.0 because this changes the editing workflow and mode-transition UX.
