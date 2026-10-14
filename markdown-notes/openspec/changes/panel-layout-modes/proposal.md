# Proposal: Side, bottom and floating panel layouts

## Why

Markdown Notes currently opens exclusively as a right-hand docked panel. On
ChatGPT and Udemy this can constrain horizontal reading or obstruct a video.
The user wants to reposition the **expanded** notes panel below the content,
or use it as a movable floating window, while retaining the existing side layout.

## What Changes

- Add a visible position selector in the expanded panel header:
  **Lateral**, **Abajo**, **Flotante**.
- Preserve the current right-side dock as the default for existing installations.
- Add an adjustable bottom dock spanning the viewport width with a draggable
  top edge to resize its height.
- Add a freely movable floating window with a dedicated grab handle and
  bottom-right resizing. Constrain its geometry to the viewport.
- Persist chosen layout and dimensions per browser origin using versioned local
  settings, independently of drafts, Markdown files and the selected folder.
- When docked in ChatGPT, reserve workspace space in the selected direction.
  On Udemy, do not alter unverified player DOM layout; offer an overlay the
  learner can reposition or close.
- Retain existing minimized/closed launcher, Libre/Cornell/Review editor,
  library and save behavior.
- On small viewports, present a safe compact overlay without permanently
  losing the chosen desktop layout.

## Capabilities

### Modified Capabilities
- `markdown-notes`: panel positioning, resizing, drag and persistence.

## Impact

- Only `markdown-notes/chatgpt-markdown-notes.user.js` is changed.
- New localStorage layout/geometry settings; no IndexedDB migration.
- Existing `panel-width` and `panel-open` preferences remain compatible.
- No other userscript, remote API, Markdown schema or filesystem change.
- Browser layout and Udemy video control visibility require manual QA.
