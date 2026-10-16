# Design: CodeMirror as optional Libre adapter

## Integration

Retain the existing `.tmn-editor` textarea as source of truth/rollback,
and enhance it with pinned CodeMirror 5 `fromTextArea`. Keep the advanced
editor opt-in; when disabled the textarea is shown exactly as before.
The CodeMirror change handler mirrors the current content through the
textarea input event and existing browser draft handling. A guard prevents
programmatic `setValue` on navigation from writing to the wrong draft.

The Markdown toolbar targets the active CodeMirror selection when enabled,
and plain textarea selection otherwise. Avoid rebuilding the CodeMirror
instance during layout switching or Cornell mode transitions. Refresh it
after becoming visible.

## Multiselection

Use the editor's real `setSelections`, `addSelection`, `replaceSelections`
API, not a simulated range count. Add matching occurrences in Ctrl/Cmd+D,
all matches in Ctrl/Cmd+Shift+L, and extra caret via Alt+click.
Limit the number of matches to avoid freezing unusually long documents.

## Clipboard and line operations

Use a `cut` event handler on the editor widget for Ctrl/Cmd+X when there
is no selection. Write exact removed line(s) to `ClipboardEvent.clipboardData`
and only change document after writing the clipboard successfully. When
clipboardData is unavailable, leave the text unchanged rather than losing it.

Provide tested, pure transformations for deletion, duplication and swapping
of full lines; preserve LF or CRLF at unaffected boundaries. Native Cornell
Markdown textarea shortcuts call the same transformations via
`setRangeText` and dispatch input; Cue fields remain untouched.

## Fallback and compatibility

Add a user preference `APP:advanced-editor`. Default disabled for existing
installations. Only initialize CodeMirror when available; when unavailable,
keep normal textarea visible and explain the advanced feature cannot start.
CodeMirror CSS is loaded from pinned Tampermonkey `@resource`; not from
untrusted document Markdown.

Upstream CodeMirror 5 is archived. Keep dependency version pinned, document
its maintenance implication, and do not silently migrate existing drafts.

## Validation

Use Node tests of line-command logic and selection calculations. Verify
JavaScript syntax and DOM integration separately in Chrome/Tampermonkey on
ChatGPT and Udemy, for both standard and advanced editor modes.
