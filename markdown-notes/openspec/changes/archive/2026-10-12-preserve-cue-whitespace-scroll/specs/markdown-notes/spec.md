# Markdown Notes — Cue insertion without whitespace or scroll changes

## ADDED Requirements

### Requirement: Non-destructive Cue insertion in Libre mode

When the user activates **+ Cue / Pregunta**, Markdown Notes MUST insert only a new Cornell Cue heading and any immediately necessary separator characters. It MUST NOT reserialize, trim, or otherwise change any pre-existing text, spacing, indentation, or line-ending sequences.

#### Scenario: Existing Cornell note has intentional blank lines
- **GIVEN** a valid Cornell note with several consecutive blank lines within a block and its summary
- **WHEN** the user activates **+ Cue / Pregunta**
- **THEN** the pre-existing block and summary text MUST be byte-for-byte identical to before the action
- **AND** the new Cue MUST appear before the final `## Summary`.

#### Scenario: Repeat insertion
- **GIVEN** an existing note containing the Cue placeholder
- **WHEN** the user inserts another Cue
- **THEN** the existing placeholder and all prior text MUST remain unchanged
- **AND** a new Cue placeholder MUST be inserted exactly once.

#### Scenario: Freeform document
- **GIVEN** a document with no Cornell structure and several blank lines or indentation
- **WHEN** the user adds a Cue
- **THEN** the original Markdown MUST remain a contiguous, unmodified substring in the resulting Cornell document
- **AND** the document MUST remain parseable by the existing Cornell parser.

#### Scenario: Windows line endings
- **GIVEN** an existing Cornell document uses CRLF line endings
- **WHEN** the user adds a Cue
- **THEN** existing CRLF sequences MUST be preserved
- **AND** the inserted lines MUST use the same line-ending style.

### Requirement: Cue insertion must not scroll the surrounding ChatGPT page

Markdown Notes MUST focus and select the inserted Cue without causing a jump in the page or conversation scroll position.

#### Scenario: User is reading midway through a long conversation
- **GIVEN** ChatGPT is scrolled away from the top
- **WHEN** the user presses **+ Cue / Pregunta**
- **THEN** the page/ChatGPT conversation viewport MUST remain at its previous scroll position
- **AND** the new Cue text MUST be selected in the note editor.

### Requirement: Persist edits after safe insertion

The insertion MUST continue to mark the note as changed and schedule normal local-draft persistence.

#### Scenario: Reload after adding a Cue
- **WHEN** the user adds a Cue and the local draft persistence completes
- **THEN** the edited note MUST be restored without losing its original whitespace.
