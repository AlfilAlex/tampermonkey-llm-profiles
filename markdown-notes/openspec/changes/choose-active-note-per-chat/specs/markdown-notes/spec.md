# Active document selection — delta specification

## MODIFIED Requirements

### Requirement: Active document may be new or reused
The notes panel SHALL let each chat choose to create a new document or adopt a saved Markdown document as the active editable note.

#### Scenario: Create new
- **WHEN** the user selects Crear nuevo
- **THEN** the chat SHALL present an empty note with no existing file selected.

#### Scenario: Reuse existing document
- **WHEN** the user selects an existing Markdown file and presses Usar como nota activa
- **THEN** the existing document SHALL become editable in the current chat
- **AND** subsequent saves SHALL update that same file without creating a copy.

#### Scenario: Protect unsaved draft
- **GIVEN** the current chat contains unsaved work
- **WHEN** another document is selected
- **THEN** the user SHALL be prompted before that draft is replaced.

### Requirement: Persist active selection per conversation
The selected filename and pending unsaved text SHALL survive reload and switching conversations.

#### Scenario: Chat becomes permanent
- **GIVEN** an existing file was adopted while the chat had a temporary identity
- **WHEN** ChatGPT assigns a permanent /c/ ID
- **THEN** the selection and draft SHALL migrate with the chat.

### Requirement: Preserve shared document provenance and format
Editing a reused document SHALL NOT change its original chat attribution or unrelated front matter.

#### Scenario: Different chat edits reused note
- **GIVEN** a note was created in chat A
- **WHEN** chat B adopts and saves edits
- **THEN** the file SHALL retain A's chat_id and chat_url
- **AND** a Cornell document SHALL keep its canonical Cornell body.

### Requirement: Prevent conflicting writes
The userscript SHALL reject saving a reused file when its current content differs from the file version originally loaded.

#### Scenario: Another editor changes the file
- **WHEN** a chat attempts to save stale changes
- **THEN** saving SHALL fail with an explicit conflict explanation
- **AND** the local unsaved draft SHALL remain intact.

### Requirement: Keep preview separate from editor
Previewing a library file SHALL not change the current draft.

#### Scenario: Read-only preview
- **WHEN** a document is previewed
- **THEN** it SHALL remain read-only until the user explicitly selects Usar como nota activa.

### Requirement: Prevent accidental filename collisions
A new document SHALL NOT silently overwrite an unrelated existing Markdown file.

#### Scenario: Filename already exists
- **WHEN** a new note is first saved using a filename already on disk
- **THEN** the user SHALL be asked to select a different name or adopt the file.
