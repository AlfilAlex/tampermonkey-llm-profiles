# VS Code-like editor behavior

## ADDED Requirements

### Requirement: Optional real multi-selection in Libre
Markdown Notes SHALL offer a selectable advanced Libre editor with independent
multiple cursors and selections and a native textarea fallback.

#### Scenario: Add next occurrence
- **GIVEN** Libre advanced editor has a word or selected phrase
- **WHEN** Ctrl/Cmd+D is pressed
- **THEN** the next matching occurrence SHALL be added as another visible
  selection, without discarding the existing selection.

#### Scenario: Edit all occurrences
- **GIVEN** multiple selections are active
- **WHEN** the learner types replacement text
- **THEN** each selected range SHALL be edited and normal draft persistence
  SHALL update the single canonical Markdown body.

#### Scenario: Native fallback
- **WHEN** the learner disables Editor avanzado
- **THEN** the plain textarea SHALL show the same body, without data loss,
  and native clipboard behavior SHALL remain available.

### Requirement: Cut the current line with no selection
Markdown editing fields SHALL support Ctrl/Cmd+X as a line cut when there is
no non-empty selection, while retaining ordinary selected-text cutting.

#### Scenario: No selection
- **GIVEN** the caret is on a line and no text is selected
- **WHEN** Ctrl/Cmd+X is invoked
- **THEN** that line and its line terminator SHALL be copied to clipboard
- **AND** only that line SHALL be removed from the current document.

#### Scenario: Selected text
- **GIVEN** any non-empty selection is active
- **WHEN** Ctrl/Cmd+X is invoked
- **THEN** ordinary cut-selection behavior SHALL be used, not whole-line cut.

### Requirement: Safe line editing commands
The editor SHALL support line duplication, line deletion and line movement
without normalizing unrelated line endings or whitespace.

#### Scenario: Duplicate line
- **WHEN** Shift+Alt+Down duplicates the current line
- **THEN** an identical line SHALL be inserted next to it
- **AND** existing unrelated content SHALL remain unchanged.

#### Scenario: Move line
- **WHEN** Alt+Up moves the current line
- **THEN** it SHALL swap position with its predecessor without changing
  the text of either line.

#### Scenario: Delete line
- **WHEN** Ctrl/Cmd+Shift+K removes the current line
- **THEN** only the targeted line SHALL be removed
- **AND** it SHALL not modify the filesystem until an explicit Save.

### Requirement: Preserve Cornell and platform keyboard isolation
Advanced editing SHALL respect the current Markdown editor context and
shall not intercept key events in the ChatGPT/Udemy page or Cue field.

#### Scenario: Cornell Markdown notes
- **GIVEN** a Cornell Notes or Summary textarea is focused
- **WHEN** a line-editing shortcut is executed
- **THEN** the canonical Cornell Markdown body SHALL be updated through
  the existing editor state flow.

#### Scenario: ChatGPT composer
- **GIVEN** a ChatGPT message composer has focus outside Markdown Notes
- **WHEN** Ctrl/Cmd+X is pressed
- **THEN** Markdown Notes SHALL not prevent or alter the host action.

### Requirement: Advanced editor remains compatible with existing UI
Switching Libre/Cornell/Repaso, switching files or conversation/video,
resizing the panel and saving Markdown SHALL retain the canonical body.

#### Scenario: Change documents
- **GIVEN** Libre advanced editor is enabled
- **WHEN** a different chat/video draft is loaded
- **THEN** the editor SHALL display that draft's body
- **AND** edits to the previous draft SHALL not carry over.

#### Scenario: Formatting toolbar
- **WHEN** the learner applies Bold or Link to selected text in the
  advanced editor
- **THEN** the resulting Markdown change SHALL be reflected in the
  canonical body and saved draft.
