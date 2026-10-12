# Design

## Root causes confirmed by source inspection

`addCornellCueFromLibre()` currently calls `prepareCornellBody()`, then `parseCornellBody()`, appends a block, and calls `serializeCornellBody()` over the whole note. `parseCornellBody()` and `serializeCornellBody()` use `trim()` and reconstruct headings/empty lines, so original formatting is irreversibly lost during insertion.

`selectTextInFreeformEditor()` calls `editor.focus()` without `preventScroll`. This may cause the browser to move the page when the Cue placeholder is selected.

## Change

- Add pure `insertCornellCuePreservingWhitespace(raw, cue)` returning `{body, selectionStart, selectionEnd}`.
- For an existing parseable Cornell note, use `findCornellStructure()` to locate the `## Summary` line outside fenced code. Compute the exact character offset from the original text's line delimiters. Splice in `### Cue: ...` and minimal neighboring separators; do not touch any other character.
- For a Libre document without a valid Cornell structure, wrap the original source in a minimal Cornell structure. Keep the source text unchanged as a contiguous substring.
- Do not call `serializeCornellBody()` in the **add Cue** handler. Parse the new body only to update the cached Cornell projection.
- Replace broad text search with exact start/end selection offsets for the inserted placeholder, since earlier Cues may have identical names.
- Focus the editor with `{preventScroll: true}` when selecting the new Cue, avoiding page scroll. Do not interfere with deliberate scrolling inside the textarea to reveal the inserted text.
- Keep the existing `persistSemanticCornellEdit()` path for UI update, dirty state and local persistence.

## Validation

- Pure helper assertions for whitespace identity, repeated placeholders, freeform wrapping, CRLF and fenced code.
- Syntax validation and browser acceptance checks for DOM focus, ChatGPT scroll position and Libre/Cornell transitions.
- Automated tests cannot establish browser layout behavior; verify that separately in Chrome/Tampermonkey.
