# Lecture Notes — delta specification

## ADDED Requirements

### Requirement: Independent Udemy lecture identity
Udemy Markdown Notes SHALL associate an editable draft with a specific video
within a specific course, keeping independent drafts when the video changes.

#### Scenario: Navigate between two course videos
- **GIVEN** a user has notes for lecture A and lecture B
- **WHEN** the course player navigates from A to B
- **THEN** the panel SHALL load B's note without replacing A's draft.

#### Scenario: Return to a lecture
- **WHEN** the user returns to a previously visited lecture
- **THEN** its selected document and locally persisted unsaved edits SHALL be restored.

#### Scenario: Identity cannot be determined reliably
- **GIVEN** a page has insufficient course/lecture identity
- **WHEN** the notes panel is opened
- **THEN** the UI SHALL explain the problem and SHALL NOT attach the draft
  to a possibly incorrect video.

### Requirement: Create or reuse one active document per video
The user SHALL be able to start a new document or explicitly select an existing
Markdown file as the active editable document of a lecture video.

#### Scenario: New video note
- **WHEN** the user presses Crear nuevo for a video
- **THEN** a blank editable note SHALL be created for that lecture.

#### Scenario: Adopt a saved file
- **GIVEN** a saved `.md` file in the selected directory
- **WHEN** the user previews and chooses Usar como nota activa
- **THEN** its content SHALL load in the editor
- **AND** a subsequent successful save SHALL update the same file, not a duplicate.

#### Scenario: Reuse one file from two videos
- **WHEN** a document is adopted from another lecture
- **THEN** its existing provenance SHALL be preserved
- **AND** the current lecture SHALL be represented as an additional association.

#### Scenario: Unsaved work on document switch
- **GIVEN** the editor contains unsaved work
- **WHEN** another document is selected
- **THEN** replacement SHALL require explicit confirmation or cancellation.

### Requirement: Local Markdown modes and library
The userscript SHALL support a normal Markdown editor and Cornell formatting,
plus a separate read-only preview of files in the user-authorized directory.

#### Scenario: Preview a saved document
- **WHEN** a document is selected in the local library
- **THEN** it SHALL be displayed without executing embedded HTML or JavaScript
- **AND** the active editor draft SHALL remain unchanged until adoption.

#### Scenario: Use Cornell notes
- **WHEN** the user edits a Cornell document
- **THEN** cue, notes and summary content SHALL remain representable and savable
  as portable Markdown.

### Requirement: Video and course attribution without timestamps
Newly authored files SHALL identify their Udemy course and lecture without
recording a playback time.

#### Scenario: Save a new Udemy lecture note
- **WHEN** the user saves a new note
- **THEN** front matter SHALL include the known course and lecture identifiers,
  descriptive titles, and a lecture URL where available
- **AND** SHALL NOT include playback position or timestamp markers.

#### Scenario: Adopt a document with existing provenance
- **GIVEN** a document has ChatGPT or Udemy origin front matter
- **WHEN** the user associates it with another Udemy lecture
- **THEN** unknown and existing origin fields SHALL remain intact.

### Requirement: Save permissions and conflict protection
Filesystem writes SHALL require a user-authorized directory and SHALL NOT
silently overwrite a different document or a changed revision.

#### Scenario: Browser permission revoked
- **GIVEN** previously granted filesystem permission is unavailable
- **WHEN** the user attempts to save
- **THEN** the UI SHALL ask for permission or report failure
- **AND** SHALL preserve the local draft.

#### Scenario: Another tab modified a reused file
- **GIVEN** the selected file changed since the lecture loaded it
- **WHEN** the user tries to save edits from a stale draft
- **THEN** the write SHALL be refused with a conflict explanation.

### Requirement: Persistent browser state
The user SHALL retain unsaved drafts and selected filenames independently for
each video in IndexedDB.

#### Scenario: Reload course player
- **GIVEN** a lecture draft was edited but not saved to disk
- **WHEN** the user reloads that lecture
- **THEN** the browser draft SHALL be restored.

### Requirement: No interaction with media playback
The notes userscript SHALL not alter the Udemy player's playback or seek to a
timestamp as part of note creation, opening, saving, or switching.

#### Scenario: Add a Cornell cue during playback
- **WHEN** the user adds a question in the notes panel
- **THEN** the script SHALL NOT seek the video or store a playback timestamp.

### Requirement: Non-obstructive desktop notes panel
The notes interface SHALL allow the learner to use the course player and notes
at the same time, without making important video controls inaccessible.

#### Scenario: Resize the notes panel
- **WHEN** the user adjusts panel width in a supported desktop viewport
- **THEN** the width SHALL persist after reload
- **AND** the video controls SHALL remain usable.
