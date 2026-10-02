# Markdown Notes — Delta Specification

## ADDED Requirements

### Requirement: Block-based Live Preview

Libre MUST provide a rendered block view over the canonical Markdown body while preserving raw Markdown editing.

#### Scenario: Libre opens in Live Preview
- **GIVEN** Libre mode is active
- **WHEN** the editor renders
- **THEN** the canonical body SHALL be shown in Live Preview by default
- **AND** a full Markdown source view SHALL remain available.

#### Scenario: Switch to full Markdown
- **GIVEN** Live Preview is active
- **WHEN** the user selects Markdown view
- **THEN** the existing full-source textarea SHALL show the exact canonical body
- **AND** switching views SHALL NOT create or copy another document body.

### Requirement: Live block editing

Rendered blocks MUST become directly editable as Markdown without replacing the canonical-body model.

#### Scenario: Activate rendered block
- **GIVEN** a rendered Markdown block exists
- **WHEN** the user clicks or keyboard-activates the block
- **THEN** only that block SHALL become a Markdown textarea
- **AND** other blocks SHALL remain rendered.

#### Scenario: Edit active block
- **GIVEN** a Live Preview block is active
- **WHEN** the user changes its Markdown
- **THEN** the corresponding range of `activeState.body` SHALL be replaced immediately
- **AND** browser draft persistence SHALL observe that canonical-body change.

#### Scenario: Leave active block
- **GIVEN** a Live Preview block is being edited
- **WHEN** focus leaves that block
- **THEN** the updated canonical body SHALL be reparsed
- **AND** the block SHALL return to rendered form.

### Requirement: Safe Markdown preview

Live Preview MUST render supported Markdown without executing arbitrary note content as HTML or script.

#### Scenario: Raw HTML appears in note
- **GIVEN** the canonical body contains raw HTML
- **WHEN** Live Preview renders
- **THEN** that HTML SHALL be treated as text.

#### Scenario: Unsafe link scheme
- **GIVEN** Markdown contains a link using a scheme other than HTTP, HTTPS, or mailto
- **WHEN** Live Preview renders
- **THEN** the target SHALL NOT become an executable/clickable URL.

### Requirement: Supported Live Preview blocks

Live Preview MUST provide readable rendering for common Markdown used by Markdown Notes.

#### Scenario: Common Markdown
- **GIVEN** the body contains headings, paragraphs, emphasis, inline code, links, lists, task lists, blockquotes, fenced code, or horizontal rules
- **WHEN** Live Preview renders
- **THEN** those constructs SHALL receive corresponding visual treatment.

#### Scenario: Fenced code contains Markdown markers
- **GIVEN** a fenced code block contains headings, list syntax, or Cornell markers
- **WHEN** Live Preview parses blocks
- **THEN** the complete fence SHALL remain one code block.

### Requirement: Cornell semantics in Live Preview

Live Preview MUST make canonical Cornell markers understandable without changing stored Markdown.

#### Scenario: Semantic cue heading
- **GIVEN** the body contains `### Cue: Routing`
- **WHEN** Live Preview renders
- **THEN** the preview SHALL communicate Cue / Question semantics
- **AND** editing that block SHALL expose the original Markdown syntax.

### Requirement: Live Preview formatting toolbar

Formatting controls MUST operate only on an actual editable Markdown target.

#### Scenario: Active Live block
- **GIVEN** Live Preview is active and a block is being edited
- **WHEN** a formatting action is used
- **THEN** it SHALL transform the active block textarea
- **AND** the canonical body SHALL update.

#### Scenario: No active Live block
- **GIVEN** Live Preview is active and no block is being edited
- **WHEN** the toolbar renders
- **THEN** formatting action buttons SHALL be disabled rather than editing a hidden source textarea.

### Requirement: Live Preview keyboard accessibility

#### Scenario: Keyboard activate block
- **GIVEN** a rendered block has keyboard focus
- **WHEN** the user presses Enter
- **THEN** that block SHALL enter Markdown editing.

#### Scenario: Escape active editor
- **GIVEN** a Live block textarea has focus
- **WHEN** the user presses Escape
- **THEN** the block SHALL return to rendered preview.

## MODIFIED Requirements

### Requirement: Freeform compatibility

Libre MUST preserve arbitrary Markdown content exactly while allowing either rendered or full-source editing.

#### Scenario: Existing arbitrary draft
- **GIVEN** an existing Libre draft contains arbitrary Markdown
- **WHEN** Live Preview is introduced
- **THEN** its canonical body SHALL remain unchanged
- **AND** no migration SHALL rewrite the body merely to render it.
