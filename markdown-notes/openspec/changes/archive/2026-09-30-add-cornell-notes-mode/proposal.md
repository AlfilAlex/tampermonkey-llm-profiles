# Proposal

## Why

Markdown Notes currently provides one freeform Markdown editor per ChatGPT conversation. That works well for capture, but it does not provide a structured note-taking workflow for study and later retrieval.

The Cornell note-taking method separates prompts/cues from the main notes and keeps a summary section. In a digital implementation, the useful interaction is not merely reproducing a paper template: each cue should remain explicitly associated with the notes it refers to so that the same content can support editing, responsive layout, Markdown export, and later recall/review.

The proposed UI follows that principle while preserving the existing freeform editor.

## What Changes

- Add a per-conversation note mode selector:
  - `Libre`
  - `Cornell`
  - `Repaso`
- Preserve the current freeform editor as the default for existing drafts.
- Model Cornell content as ordered blocks, each containing:
  - one cue/question;
  - one Markdown notes body.
- Add a full-width Cornell summary field.
- Render Cornell blocks responsively:
  - wide panel: cue column approximately 30% and notes approximately 70%;
  - narrow panel/mobile: cue above notes.
- Add a review mode that shows cues while associated notes remain hidden until explicitly revealed.
- Export Cornell notes as portable Markdown headings/sections rather than a Markdown table.
- Keep the existing editable filename, folder selection, File System Access behavior, and chat-title detection unchanged.

## UX Rationale

The proposal intentionally avoids two large independent textareas for all cues and all notes. That representation looks like the paper layout but loses the semantic relationship between an individual cue and its corresponding notes.

The proposed unit is instead:

```js
{
  id: "stable-id",
  cue: "What does longest-prefix match decide?",
  notes: "The kernel selects ..."
}
```

This allows:

- precise cue-to-note reveal in review mode;
- independent reordering;
- responsive presentation without changing the data model;
- Markdown export without tables;
- future extensions such as per-block review state without reparsing freeform text.

## UI Inspirations

The design combines patterns commonly used in digital Cornell implementations:

- the traditional Cornell cue/notes/summary visual hierarchy;
- block-oriented editing instead of a rigid paper-sized canvas;
- responsive stacking on narrow layouts;
- recall/reveal behavior inspired by digital review modes where cues remain visible and notes are temporarily hidden.

The goal is to preserve the learning workflow rather than imitate paper geometry exactly.

## Markdown Export

Cornell mode exports to normal Markdown:

```markdown
---
title: "Interpretar rutas netstat"
note_method: "cornell"
source: "ChatGPT"
chat_id: "..."
---

# Interpretar rutas netstat

## Cornell Notes

### 1. ¿Qué hace longest-prefix match?

El kernel selecciona la ruta con el prefijo más específico.

### 2. ¿Cuándo interviene ARP?

ARP resuelve la MAC del siguiente salto cuando corresponde.

## Summary

Primero se selecciona la ruta y después se resuelve el siguiente salto.
```

The export MUST remain useful in GitHub, VS Code, Obsidian, and ordinary Markdown readers without requiring this userscript.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `markdown-notes`: add structured Cornell editing, responsive Cornell presentation, review/reveal behavior, per-conversation mode persistence, and Cornell Markdown export.

## Impact

- Source implementation will remain in `markdown-notes/chatgpt-markdown-notes.user.js`.
- Existing freeform drafts remain valid and default to `Libre`.
- IndexedDB keeps the same object store; the persisted draft object gains optional Cornell fields.
- No automatic conversion from existing freeform notes to Cornell content is proposed.
- No automatic conversion from Cornell back to freeform is proposed.
- Filesystem permissions and configured directory handles are unchanged.
- File naming behavior introduced in Markdown Notes v1.3.0 is unchanged.
- Saved Cornell Markdown is a filesystem representation; the browser draft remains the authoritative editable structured state.
- The first implementation does not include spaced repetition, AI-generated cues, recall scoring, or automatic deletion/renaming of files.

## References

- Cornell University Learning Strategies Center, Cornell Note Taking System: https://lsc.cornell.edu/how-to-study/taking-notes/cornell-note-taking-system/
- Digital implementations reviewed for UX patterns include Cornell-style Notion templates and Obsidian Cornell-note plugins. Their interaction patterns inform this proposal, but this userscript does not depend on them.
