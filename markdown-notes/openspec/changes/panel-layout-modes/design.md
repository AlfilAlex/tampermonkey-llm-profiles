# Design: persistent panel layouts

## State and compatibility

Use one persisted mode value (`side`, `bottom`, `floating`), height for the
bottom dock, and a `{left,top,width,height}` floating rectangle in
`localStorage`, namespaced under the existing `APP` identifier.
The existing panel-open and side-width keys remain unchanged. No storage
migration is needed. Invalid stored numbers/modes fall back to safe defaults.

## Presentation

The same `<aside>` hosts editor, library and file controls. Set a
`data-layout` attribute on the root document to select CSS geometry:

- side: current right-docked panel, with ChatGPT workspace right padding.
- bottom: fixed left/right/bottom dock with configurable height, top-edge
  resize handle; ChatGPT workspace bottom padding.
- floating: fixed window positioned via CSS variables (left/top/width/height);
  bottom-right resize handle, dedicated header drag grip.

No editor re-creation occurs when switching layout; update only attributes,
CSS variables and the selector control to retain caret/unsaved state.

## Interaction

A header select changes the mode. Pointer interactions use short-lived
`pointermove`/ `pointerup` listeners and stop on cancellation. Never start
dragging on editable text, inputs or save buttons. Handle Shift+arrow keys
for coarse floating movement via a focusable drag handle. Clamp values on
resize and before persisting. The panel can always be closed/reopened.

Keep drag and resize limits conservative; fallback to standard overlay on
small viewports, but preserve the user's selected desktop mode in storage.

## Platform-specific behavior

Only the existing ChatGPT `[data-app-shell-workspace-row="true"]` gets
padding in docked modes. Udemy DOM is unverified, so no selectors modify the
player; floating is an overlay that can be moved or hidden. Video seeking
and playback controls are never accessed.

## Validation

Pure geometry tests for defaults and viewport clamping, static checks for
layout CSS/handlers, and browser QA for side/bottom/floating layouts,
dragging, resizing, scroll position and panel/library/editor persistence in
Chrome/Tampermonkey. In-browser Udemy and ChatGPT layout checks remain
required before claiming visual compatibility.
