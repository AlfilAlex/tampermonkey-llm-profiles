# Markdown Notes — panel layout modes

## ADDED Requirements

### Requirement: Select the panel's expanded layout
Markdown Notes SHALL allow selecting **Lateral**, **Abajo**, or **Flotante**
while the notes panel is open, without replacing the current draft.

#### Scenario: Switch from side to bottom
- **GIVEN** the notes panel is open with an unsaved Markdown draft
- **WHEN** the user selects Abajo
- **THEN** the panel SHALL occupy the bottom of the viewport
- **AND** the draft and selection of note SHALL remain intact.

#### Scenario: Switch to floating
- **WHEN** the user selects Flotante
- **THEN** the panel SHALL become a movable window with its own geometry.

#### Scenario: Existing installation
- **GIVEN** the user has never selected a layout
- **WHEN** Markdown Notes starts
- **THEN** it SHALL default to the existing Lateral layout.

### Requirement: Resizable bottom dock
The expanded bottom layout SHALL occupy a bounded portion of the viewport,
and its top edge SHALL allow users to resize the height.

#### Scenario: Resize bottom dock
- **WHEN** the user drags the top resize handle
- **THEN** the panel's height SHALL change within available viewport limits
- **AND** the new height SHALL be remembered.

### Requirement: Movable and resizable floating panel
The expanded floating layout SHALL support pointer dragging via a dedicated
handle and bounded resizing, without stealing editor text gestures.

#### Scenario: Drag floating window
- **WHEN** the user drags the floating-window handle
- **THEN** the panel SHALL move within viewport margins
- **AND** the position SHALL persist.

#### Scenario: Resize floating window
- **WHEN** the user drags the bottom-right resize handle
- **THEN** the width and height SHALL be adjusted while remaining usable.

#### Scenario: Prevent drag from editor interactions
- **WHEN** the user selects text or interacts with an input/button
- **THEN** the window SHALL NOT move.

### Requirement: Restore safe geometry
Layout, size and floating position SHALL persist across page reload and
navigation, and SHALL be clamped when the viewport changes.

#### Scenario: Reopen panel
- **GIVEN** the panel was closed in floating layout
- **WHEN** the user reopens it
- **THEN** its last layout and bounded geometry SHALL be restored.

#### Scenario: Viewport becomes smaller
- **WHEN** the viewport shrinks
- **THEN** the panel SHALL remain reachable and within the screen
- **AND** existing note content SHALL not be changed.

### Requirement: Preserve app content and hosting platform behavior
Position changes SHALL not affect drafts, files, Cornell mode or library
and SHALL avoid permanently obscuring important host content.

#### Scenario: ChatGPT bottom dock
- **WHEN** Abajo is active on a supported desktop ChatGPT viewport
- **THEN** the known workspace SHALL reserve bottom space for the panel.

#### Scenario: Udemy floating panel
- **WHEN** Flotante is selected during a Udemy lecture
- **THEN** the window SHALL be movable away from relevant player controls
- **AND** it SHALL NOT manipulate video playback.
