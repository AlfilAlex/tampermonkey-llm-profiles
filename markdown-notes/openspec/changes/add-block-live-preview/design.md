# Design

## Source of Truth

`activeState.body` remains the only canonical note body. Live Preview never stores a second Markdown document.

The flow is: canonical body -> block parser -> rendered preview -> activate one block -> textarea -> replace the same canonical body range.

## Ephemeral View State

Use browser-session-only state:

- `freeformView = 'live' | 'source'`
- `liveActiveBlock = { start, end } | null`

A reload starts in Live Preview. No new IndexedDB field is required.

## Block Parsing

`parseMarkdownPreviewBlocks(body)` scans by line while retaining exact character offsets. Blank lines are separators and are not standalone blocks.

Recognized block types, in order:

1. fenced code;
2. headings;
3. horizontal rules;
4. list sequences;
5. blockquote sequences;
6. paragraphs.

Fenced code remains one block even if its contents contain Markdown or Cornell markers.

Each block stores `start`, `end`, `type`, and exact `raw` text.

## Editing a Live Block

Activation sets `liveActiveBlock`, rerenders the preview, and replaces only that block with `textarea.tmn-live-block-editor` containing the exact raw Markdown.

On every input the canonical body is replaced as:

`body.slice(0, start) + textarea.value + body.slice(end)`

Then `liveActiveBlock.end` becomes `start + textarea.value.length`.

The preview is not reparsed while typing. On blur or Escape, the active block is cleared and the updated body is parsed again.

## Full Markdown View

The existing `.tmn-editor` remains the full-source editor. Switching between Live and Markdown does not convert or copy content because both read/write the same body.

## Formatting Toolbar

Add `.tmn-live-block-editor` as a supported Markdown target.

- Source view: toolbar targets `.tmn-editor`.
- Live Preview with active block: toolbar targets `.tmn-live-block-editor`.
- Live Preview without active block: formatting buttons are disabled.

## Safe Rendering

Never assign note Markdown to `innerHTML`.

A conservative inline renderer supports bold, italic, inline code, and Markdown links by creating DOM nodes. Unsupported syntax remains visible as text.

Only `http:`, `https:`, and `mailto:` link schemes are clickable. Raw HTML remains text.

Lists, task lists, blockquotes, headings, paragraphs, horizontal rules, and fenced code receive readable DOM treatment.

Mermaid fences remain code blocks in v1.8.0; diagram execution is out of scope.

## Cornell Semantics

Special visual treatment is added for canonical Cornell headings while their stored syntax remains unchanged:

- `## Cornell Notes` -> Cornell marker;
- `### Cue: Question` -> Cue / Question badge plus cue text;
- `## Summary` -> Summary marker.

## Empty Note

An empty Live Preview shows an empty-state action. Activating it switches to full Markdown source because there is no canonical block range yet.

## Keyboard

- Rendered blocks use `tabindex=0`.
- Enter activates block editing.
- Space may activate when focus is on the block itself.
- Escape returns an active editor to preview.

## Responsive Behavior

Preview content wraps inside the current panel. Fenced code may scroll horizontally inside its own block. The Live/Markdown switch wraps safely.

## Non-goals

- CodeMirror or another runtime dependency.
- Raw HTML rendering.
- Mermaid execution.
- Tables in v1.8.0.
- Image fetching.
- Exact click-to-character caret mapping.
- Full CommonMark compliance.
