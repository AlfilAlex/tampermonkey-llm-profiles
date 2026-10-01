# Tasks

## Design

- [x] Define manual filename as the only save target.
- [x] Define behavior for legacy auto-generated filenames.
- [x] Define save-button disabled state.
- [x] Define shortcut/programmatic save guard.
- [x] Define no-filesystem-side-effect behavior before filename validation.

## Implementation

- [ ] Make `currentFilename()` resolve only `manualFilename`.
- [ ] Stop rendering inferred/generated filenames in the filename input.
- [ ] Add required filename placeholder and save-button explanation.
- [ ] Disable Save while manual filename is empty.
- [ ] Guard `saveFile()` before directory selection or permission requests.
- [ ] Focus filename input and show validation message on blocked save.
- [ ] Stop automatic fallback generation from UI/save paths.
- [ ] Keep .md normalization.
- [ ] Preserve legacy persisted filename/fallback fields without using them as save authority.
- [ ] Bump userscript and README to v1.6.1.

## Validation

- [ ] Run `node --check markdown-notes/chatgpt-markdown-notes.user.js`.
- [ ] Parse the complete userscript successfully.
- [ ] Validate empty filename input on draft with no manual filename.
- [ ] Validate Save disabled with no manual filename.
- [ ] Validate Cmd/Ctrl+S does not trigger directory selection without filename.
- [ ] Validate entering a filename enables Save.
- [ ] Validate clearing the filename disables Save.
- [ ] Validate title detection never fills filename input.
- [ ] Validate legacy auto-generated filename does not enable Save.
- [ ] Validate successful save uses normalized manual filename.
