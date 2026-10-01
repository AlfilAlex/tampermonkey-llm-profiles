# Markdown Notes — Delta Specification

## MODIFIED Requirements

### Requirement: Editable file identity

Markdown Notes MUST require an explicit user-provided filename before a note can be written to the filesystem.

#### Scenario: No manual filename exists

- GIVEN a conversation draft exists
- AND no valid manual filename has been provided
- WHEN the panel renders
- THEN the filename input SHALL be empty
- AND the Save button SHALL be disabled
- AND Markdown Notes SHALL NOT substitute the conversation title, chat ID, UUID, timestamp, or another generated name.

#### Scenario: User provides filename without extension

- GIVEN no valid filename exists
- WHEN the user enters `routing-notes`
- THEN Markdown Notes SHALL normalize the target to `routing-notes.md`
- AND Save SHALL become available.

#### Scenario: User clears the filename

- GIVEN a valid manual filename exists
- WHEN the user clears the filename field
- THEN Save SHALL become unavailable again.

### Requirement: Filename persistence and save semantics

Markdown Notes MUST validate the manual filename before any filesystem save side effect.

#### Scenario: Save shortcut without filename

- GIVEN no manual filename exists
- WHEN the user invokes Cmd/Ctrl+S
- THEN Markdown Notes SHALL NOT open a directory picker
- AND SHALL NOT request filesystem write permission
- AND SHALL NOT write a file
- AND SHALL focus the filename input
- AND SHALL communicate that the filename is required.

#### Scenario: Legacy automatic filename exists

- GIVEN a legacy draft has a last-saved `filename`
- AND `manualFilename` is empty
- WHEN the draft loads
- THEN the legacy filename SHALL NOT count as an explicit filename choice
- AND Save SHALL remain disabled until the user enters a manual name.

#### Scenario: Manual filename save succeeds

- GIVEN a valid manual filename exists
- AND filesystem permission is granted
- WHEN the user saves
- THEN the normalized manual filename SHALL be the target written
- AND the successful target SHALL become the stored last-written `filename`.

### Requirement: Conversation title identity

The conversation title MUST remain independent from filesystem filename selection.

#### Scenario: Real conversation title exists but filename is empty

- GIVEN a real conversation title has been detected
- AND the user has not entered a manual filename
- WHEN the panel renders
- THEN the title MAY be displayed as note metadata
- BUT it SHALL NOT enable Save
- AND it SHALL NOT populate the filename input.
