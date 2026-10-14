# Udemy lecture notes specification

### Requirement: One draft for each identifiable lecture video
The same Markdown Notes userscript SHALL isolate Udemy drafts by course and
lecture identity and restore them when navigating between videos.

#### Scenario: Two videos in one course
- **GIVEN** two video URLs with different lecture IDs under the same course slug
- **WHEN** the user navigates between them
- **THEN** each video SHALL restore its own draft.

#### Scenario: Unidentifiable video
- **WHEN** the page lacks a supported `/course/<slug>/learn/lecture/<id>` URL
- **THEN** Markdown Notes SHALL NOT save or adopt a document under an invented lecture ID.

### Requirement: Reuse the same editor and document library
A Udemy lecture SHALL use the existing Markdown Notes interface for Libre,
Cornell, Crear nuevo, Elegir existente, read-only preview and explicit saves.

#### Scenario: New lecture note
- **WHEN** the user selects Crear nuevo on a recognized video
- **THEN** a blank per-video Markdown draft SHALL be available.

#### Scenario: Adopt an older file
- **WHEN** the user selects a local Markdown file and activates it
- **THEN** it SHALL load into the editor without creating a duplicate
- **AND** future explicit saves SHALL update that selected file.

#### Scenario: Preview only
- **WHEN** the user opens a library file without adopting it
- **THEN** the active editor draft SHALL remain unchanged.

### Requirement: Record Udemy origin without timestamps
A new Udemy note SHALL record the course slug, lecture ID and lecture URL,
with no saved playback timestamp.

#### Scenario: New Udemy file
- **WHEN** a newly authored Udemy note is saved
- **THEN** the YAML front matter SHALL identify Udemy as the source and
  record the known course slug, numeric lecture ID and canonical lecture URL
- **AND** SHALL NOT include a playback position.

### Requirement: Preserve existing file origins on reuse
When an older document is adopted in a Udemy video, its original metadata
SHALL be preserved; added lecture references SHALL not replace its origin.

#### Scenario: Adopt a ChatGPT-created file
- **GIVEN** an existing Markdown document with `chat_id` and `chat_url`
- **WHEN** the Udemy video associates the file
- **THEN** those fields SHALL remain and the new lecture SHALL be recorded
  as a `linked_udemy_lectures` reference.

#### Scenario: Link a lecture twice
- **WHEN** the same lecture links the same file more than once
- **THEN** only one association for that lecture SHALL be retained.

### Requirement: Preserve local draft and safe-save semantics
Browser drafts and filesystem writes SHALL remain separate for Udemy, and
reused files SHALL be protected from unintended replacement.

#### Scenario: External edit conflict
- **GIVEN** a reused file changed after the lecture loaded it
- **WHEN** the learner attempts to save the stale draft
- **THEN** the file SHALL NOT be silently overwritten
- **AND** the draft SHALL remain available.

#### Scenario: Missing filesystem permission
- **WHEN** the selected directory cannot be written
- **THEN** the user SHALL be asked for permission or informed of the error
- **AND** the browser draft SHALL remain intact.

### Requirement: Platform-specific browser isolation
The userscript SHALL not assume an IndexedDB or directory handle selected
on ChatGPT is accessible on Udemy.

#### Scenario: First use on Udemy
- **GIVEN** a folder was previously authorized on ChatGPT
- **WHEN** the user first saves a file on Udemy
- **THEN** the Udemy origin SHALL ask the user to select or authorize a folder.

### Requirement: Do not control playback
Taking notes SHALL NOT seek a video or create playback timestamp bookmarks.

#### Scenario: Add Cornell Cue
- **WHEN** the user inserts a Cue while watching Udemy
- **THEN** no seek command or playback timestamp SHALL be emitted.

### Requirement: Recognizable note context
The Udemy panel SHALL display which video identity it is currently associated with.

#### Scenario: Navigate to next lecture
- **WHEN** Udemy navigation changes to another supported lecture URL
- **THEN** the panel SHALL show the new course/lecture identity.
