# Design

## Goals

1. Preserve the current lightweight freeform workflow.
2. Make Cornell notes comfortable inside a resizable side panel rather than reproducing a fixed paper page.
3. Keep each cue semantically paired with its notes.
4. Make review possible without introducing a spaced-repetition subsystem.
5. Export readable, portable Markdown.
6. Preserve compatibility with existing drafts and filesystem behavior.

## Non-goals

This change does not propose:

- AI-generated cues or summaries;
- spaced repetition scheduling;
- recall scores/history;
- drag-and-drop ordering;
- bidirectional parsing of an edited Markdown file back into Cornell state;
- automatic transformation between freeform and Cornell content.

## Interaction Model

The panel gains a compact mode control near the note header:

```text
[ Libre | Cornell | Repaso ]
```

### Libre

Existing behavior remains unchanged.

### Cornell

Cornell content is edited as ordered semantic blocks.

Wide panel:

```text
┌─────────────────────────────────────────────────┐
│ Cue / Question  │ Notes                         │
│ ~30%            │ ~70%                          │
├─────────────────┼───────────────────────────────┤
│ Why /0?         │ Default route explanation...  │
└─────────────────┴───────────────────────────────┘
```

Narrow panel:

```text
┌─────────────────────────────────────────────────┐
│ Cue / Question                                  │
├─────────────────────────────────────────────────┤
│ Notes                                           │
└─────────────────────────────────────────────────┘
```

Each block provides compact actions:

- move up;
- move down;
- delete.

A persistent `+ Añadir bloque` action appears after the block list.

The Summary editor appears below all blocks and spans the full available width.

### Repaso

Review mode is read-oriented:

1. show the cue;
2. hide its notes by default;
3. provide `Revelar notas`;
4. allow hiding again or advancing to the next block.

The first version does not record whether the user remembered the answer.

## Why Blocks Instead of Two Global Columns

Two global textareas would require correlating "cue line N" with "notes section N" by convention. Insertions, deletions, multi-paragraph notes, code blocks, and reordering would make that relationship fragile.

A block keeps the relation explicit:

```js
{
  id: "uuid",
  cue: "¿Qué decide una ruta /0?",
  notes: "..."
}
```

The responsive layout then becomes only a presentation concern.

## Responsive Behavior

Use a container/panel-width breakpoint rather than viewport width alone when practical, because the notes panel itself is resizable.

Proposed initial behavior:

- effective editor width >= 560 px: two-column block;
- effective editor width < 560 px: stacked cue then notes.

The Summary always spans the full width.

The existing <= 900 px overlay behavior remains unchanged.

## Persistence Model

Extend the existing per-conversation draft object without changing IndexedDB object stores:

```js
{
  body: "",
  savedBody: "",
  noteTitle: null,
  manualFilename: null,
  filename: null,

  noteMode: "freeform",

  cornell: {
    blocks: [
      {
        id: "uuid",
        cue: "",
        notes: ""
      }
    ],
    summary: ""
  },

  savedCornellSnapshot: null
}
```

### Compatibility

Older drafts have no `noteMode` or `cornell`.

Normalization MUST interpret them as:

```js
{
  noteMode: "freeform",
  cornell: {
    blocks: [],
    summary: ""
  }
}
```

No IndexedDB version bump is necessary unless implementation discovers a storage-level requirement.

## Dirty State

Freeform mode continues comparing `body` against `savedBody`.

Cornell mode needs an equivalent saved snapshot so that unsaved changes are detectable without serializing the filesystem Markdown and treating it as application state.

A normalized Cornell snapshot should include:

- block order;
- block IDs;
- cue text;
- notes text;
- summary.

Filename changes remain part of the existing dirty-state calculation.

## Markdown Serialization

Cornell data serializes to ordinary Markdown.

Recommended shape:

```markdown
---
title: "..."
note_method: "cornell"
source: "ChatGPT"
chat_id: "..."
---

# Title

## Cornell Notes

### 1. Cue text

Notes body...

### 2. Another cue

Notes body...

## Summary

Summary body...
```

### Why Not a Markdown Table

Markdown tables are a poor fit for technical notes because cells become awkward for:

- fenced code blocks;
- multiple paragraphs;
- nested lists;
- Mermaid;
- long explanations.

Headings preserve portability and editing ergonomics.

### Empty Cues

If a block has notes but no cue, export a neutral heading such as:

```markdown
### 1. Note
```

The serializer MUST NOT drop the block content.

## Mode Switching

Switching modes changes the editor view, not the underlying data.

- `Libre -> Cornell` does not automatically parse `body`.
- `Cornell -> Libre` does not overwrite `body`.
- Both representations may coexist in the draft.
- The currently selected `noteMode` determines which representation is saved.

This avoids destructive or ambiguous transformations.

## Conversation Switching and Reload

`noteMode` and Cornell state are persisted under the existing conversation key.

On conversation switch:

1. persist the previous active draft;
2. load and normalize the new conversation state;
3. render the selected note mode;
4. preserve existing new-chat-to-chat-ID migration behavior.

On reload, the previously selected mode and Cornell content must be restored.

## Filesystem Behavior

The existing directory handle and permission workflow remains unchanged.

On save:

- `freeform` serializes the existing freeform Markdown;
- `cornell` serializes Cornell structured state;
- the resolved editable filename behavior remains unchanged;
- a successful write updates the corresponding saved snapshot.

The filesystem file is not used as the editable database.

## Accessibility and Interaction

- Mode selector MUST be keyboard reachable.
- Cue and notes fields require accessible labels.
- Block move/delete controls require descriptive labels, not icon-only semantics.
- Review reveal controls must expose expanded/collapsed state.
- Focus should remain predictable after adding, moving, or deleting a block.
- Destructive block deletion should avoid accidental activation; the implementation may use confirmation or an undo strategy.

## Open Questions for Implementation Review

1. Whether block deletion should use confirmation or short-lived undo.
2. Whether review mode should show one block at a time or a scrollable list of all cues.
3. Whether the 560 px layout breakpoint should be CSS container-query based or calculated from panel width.
4. Whether empty Cornell drafts should start with zero blocks or one blank block.

These are intentionally left reviewable before implementation.
