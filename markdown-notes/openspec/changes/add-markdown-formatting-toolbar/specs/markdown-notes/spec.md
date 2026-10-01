# Markdown Notes — Delta Specification

## ADDED Requirements

### Requirement: Markdown formatting toolbar

Markdown Notes MUST provide formatting controls for Markdown-capable note fields without replacing Markdown as the stored representation.

#### Scenario: Toolbar in Libre

- GIVEN Libre mode is active
- WHEN the editor is shown
- THEN the Markdown formatting toolbar SHALL be visible
- AND toolbar operations SHALL target the Libre Markdown textarea.

#### Scenario: Toolbar in Cornell

- GIVEN Cornell mode is active
- WHEN a Notes or Summary field is active
- THEN toolbar operations SHALL transform that Markdown field
- AND the resulting Cornell content SHALL synchronize to the canonical body.

#### Scenario: Cue field is excluded

- GIVEN a Cornell Cue / Question field is active
- WHEN the user activates a Markdown toolbar command
- THEN Markdown Notes SHALL NOT insert Markdown formatting into the Cue field.

#### Scenario: Toolbar in Repaso

- GIVEN Repaso mode is active
- WHEN the view renders
- THEN the Markdown formatting toolbar SHALL be hidden.

### Requirement: Inline formatting operations

Markdown Notes MUST support non-destructive inline Markdown insertion.

#### Scenario: Bold selected text

- GIVEN text is selected in a supported Markdown textarea
- WHEN Bold is activated
- THEN the selected text SHALL be wrapped in `**`.

#### Scenario: Bold without selection

- GIVEN a supported Markdown textarea has a caret but no selection
- WHEN Bold is activated
- THEN Markdown Notes SHALL insert a bold placeholder
- AND SHALL leave a useful selection or caret for immediate typing.

#### Scenario: Link selected text

- GIVEN text is selected
- WHEN Link is activated
- THEN the result SHALL use Markdown link syntax
- AND the URL placeholder SHALL remain editable.

### Requirement: Line-based formatting operations

Markdown Notes MUST support headings, lists, task lists, and blockquotes across the current line or selected lines.

#### Scenario: Multiple selected lines become bullets

- GIVEN multiple lines are selected
- WHEN Unordered List is activated
- THEN each selected line SHALL receive a Markdown bullet prefix.

#### Scenario: Multiple selected lines become ordered items

- GIVEN multiple lines are selected
- WHEN Ordered List is activated
- THEN each selected line SHALL receive an incrementing Markdown ordered-list prefix beginning at 1.

#### Scenario: Current line becomes heading

- GIVEN no text range is selected
- AND the caret is within a line
- WHEN H2 is activated
- THEN that complete line SHALL receive an H2 prefix.

### Requirement: Code formatting operations

Markdown Notes MUST support inline and fenced code insertion.

#### Scenario: Inline code selection

- GIVEN a single-line selection exists
- WHEN Inline Code is activated
- THEN the selection SHALL be wrapped in backticks.

#### Scenario: Fenced code selection

- GIVEN text is selected
- WHEN Code Block is activated
- THEN the selected text SHALL be wrapped in a fenced Markdown code block.

### Requirement: Formatting preserves editor state flow

Toolbar operations MUST behave like ordinary edits for persistence and dirty-state purposes.

#### Scenario: Formatting Libre marks canonical body changed

- GIVEN Libre mode is active
- WHEN a toolbar operation changes text
- THEN activeState.body SHALL reflect the transformed text
- AND normal draft persistence SHALL run.

#### Scenario: Formatting Cornell updates canonical body

- GIVEN a Cornell Notes or Summary field is active
- WHEN a toolbar operation changes text
- THEN the Cornell structured state SHALL reflect the transformed text
- AND the canonical Markdown body SHALL reflect the same change.

### Requirement: Markdown editing shortcuts

Markdown Notes SHALL provide common formatting shortcuts without conflicting with save behavior.

#### Scenario: Bold shortcut

- GIVEN a supported Markdown textarea has focus
- WHEN the user presses Cmd/Ctrl+B
- THEN Bold SHALL be applied.

#### Scenario: Italic shortcut

- GIVEN a supported Markdown textarea has focus
- WHEN the user presses Cmd/Ctrl+I
- THEN Italic SHALL be applied.

#### Scenario: Link shortcut

- GIVEN a supported Markdown textarea has focus
- WHEN the user presses Cmd/Ctrl+K
- THEN Link SHALL be applied.

#### Scenario: Save shortcut remains available

- GIVEN an editable notes field is focused
- WHEN the user presses Cmd/Ctrl+S
- THEN the existing save behavior SHALL remain unchanged.
