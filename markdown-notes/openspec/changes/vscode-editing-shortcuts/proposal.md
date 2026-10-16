# Proposal: VS Code-like text editing in Markdown Notes

## Why

Markdown Notes currently edits Libre and Cornell Markdown using native HTML
textareas. This is lightweight, but a textarea supports only one contiguous
selection and cannot provide genuine independent multi-cursor editing.
The learner requests multiple selections and VS Code's cut-whole-line
behavior, with related line-editing productivity shortcuts.

## What changes

- Add an opt-in **Editor avanzado** toggle for **Libre** using CodeMirror 5,
  pinned as a Tampermonkey dependency. Keep the native textarea as a
  one-click rollback option for compatibility.
- Support multiple independently visible selections and cursors in Libre:
  **Ctrl/Cmd+D** (next occurrence), **Ctrl/Cmd+Shift+L** (all occurrences),
  and **Alt+click** (add caret), including typing in each selection.
- Add predictable line editing: **Ctrl/Cmd+X** cuts the full current line
  if there is no selection; **Ctrl/Cmd+Shift+K** deletes a line;
  **Alt+Up/Down** moves a line; **Shift+Alt+Up/Down** duplicates a line.
- Keep existing Markdown formatting and save shortcuts, plus normal native
  clipboard behavior when text is already selected.
- Add cut-line/duplicate/move/delete features to Cornell Markdown Notes and
  Summary textareas without replacing their structured Cornell UI.
- Do not install an entire VS Code IDE or alter ChatGPT/Udemy input fields.
- Preserve the canonical Markdown body, existing drafts, Cornell structure,
  file saves, selection-while-formatting, and the panel's three layouts.

## Runtime dependency

CodeMirror 5 (5.65.21) is used as a classic browser userscript dependency
because its `fromTextArea` interface can adapt the existing editor.
It is archived upstream; CodeMirror 6 is preferable for new standalone apps,
but an ESM build and a much broader rewrite would be required here.
Make the advanced view explicitly optional and record that this trade-off
must be revisited.

## Impact

- Changes only the existing Markdown Notes userscript and its OpenSpec.
- Adds pinned Tampermonkey `@require` JavaScript and `@resource` CSS
  (install/update needs connectivity to the selected dependency host).
- Retains previous draft schema and browser-local storage; one new
  boolean UI preference per website origin.
- No new network APIs, telemetry or remote document syncing.
