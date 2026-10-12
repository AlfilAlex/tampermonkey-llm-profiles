# Markdown Notes — linked documents and provenance

## ADDED Requirements

### Requirement: Stable document origin
Markdown Notes SHALL retain the first successfully saved chat as the origin of an authored Markdown document.

#### Scenario: Initial save in a conversation
- **GIVEN** the user creates a note in conversation A
- **WHEN** the file is saved for the first time
- **THEN** the file SHALL contain the origin's `chat_id` and `chat_url` if available.

#### Scenario: Save after origin is recorded
- **GIVEN** a document has an existing origin
- **WHEN** the document is saved or associated from another chat
- **THEN** the origin fields SHALL not be replaced by the active chat.

#### Scenario: Legacy document
- **GIVEN** a document already has `chat_id` and `chat_url`
- **WHEN** the document is listed or linked
- **THEN** these existing values SHALL be treated as its historical origin.
- **AND** they SHALL not be inferred from the current chat if absent.

### Requirement: Browse authorized Markdown library
Markdown Notes SHALL allow browsing `.md` files located directly in the user-selected directory without requesting access to other directories.

#### Scenario: List files
- **GIVEN** directory read access is available
- **WHEN** the user opens the library
- **THEN** the interface SHALL list Markdown filenames in that directory.

#### Scenario: No permission or missing folder
- **GIVEN** the selected directory is unavailable or permission is denied
- **WHEN** the user opens the library
- **THEN** Markdown Notes SHALL show an actionable error without discarding existing drafts.

### Requirement: Safe read-only document preview
Markdown Notes SHALL show a selected file in a viewer that does not execute HTML or scripts contained in the document and does not replace the chat's editable draft.

#### Scenario: Preview existing file
- **WHEN** the user selects a Markdown file in the library
- **THEN** its contents and original chat link (when valid) SHALL be available for inspection
- **AND** no file write or ChatGPT message submission SHALL occur.

#### Scenario: Preview externally modified file
- **GIVEN** a file has changed on disk
- **WHEN** it is opened again
- **THEN** the viewer SHALL read the current file from the directory rather than a stale saved body.

### Requirement: Associate and disassociate a file with a conversation
Markdown Notes SHALL allow multiple saved files to be associated with one chat and a saved file to be associated with multiple chats, without duplicating that file.

#### Scenario: Link file from another conversation
- **GIVEN** a document was authored in conversation A
- **WHEN** the user links it to conversation B
- **THEN** B SHALL list it among associated documents after reload
- **AND** A SHALL remain the origin
- **AND** the editable draft of B SHALL remain unchanged.

#### Scenario: Repeat linking
- **WHEN** a user links the same filename to the same chat again
- **THEN** the association SHALL remain a single entry.

#### Scenario: Remove association
- **WHEN** the user unlinks a saved file from the active chat
- **THEN** the file SHALL remain on disk
- **AND** its origin and associations with other chats SHALL remain intact.

#### Scenario: Existing local file no longer exists
- **GIVEN** an associated document has been deleted or moved
- **WHEN** the user attempts to view it
- **THEN** Markdown Notes SHALL report that it is unavailable rather than silently replacing it.

### Requirement: Portable associations and safe metadata updates
Markdown Notes SHALL maintain human-readable linked-chat metadata in each associated Markdown file and a local per-chat index, without silently rewriting the document body.

#### Scenario: Explicit link changes metadata
- **WHEN** the user authorizes linking a file to a chat
- **THEN** the link SHALL be recorded as a `linked_chat_urls` entry in the file's front matter
- **AND** in the active chat's IndexedDB association index after a successful write.

#### Scenario: File write is denied
- **GIVEN** an existing Markdown file cannot be written
- **WHEN** the user tries to link or unlink it
- **THEN** the UI SHALL report the failure
- **AND** SHALL not claim the association was saved.

#### Scenario: Legacy file has no front matter
- **GIVEN** a plain Markdown document without YAML metadata
- **WHEN** the user explicitly links it
- **THEN** a minimal front matter MAY be added without changing its original body.
