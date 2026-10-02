# Markdown Notes — Delta Specification

## MODIFIED Requirements

### Requirement: Conversation title identity

Markdown Notes MUST NOT infer note identity from ChatGPT conversation-title sources.

#### Scenario: ChatGPT has a generated conversation title

- GIVEN ChatGPT displays a title derived from the conversation or first user message
- AND the user has not entered a manual note name
- WHEN Markdown Notes renders
- THEN Markdown Notes SHALL NOT copy that title into its note header
- AND SHALL NOT use it as Markdown document title
- AND SHALL NOT use it as filesystem filename.

#### Scenario: Document title and sidebar contain text

- GIVEN the ChatGPT page exposes sidebar, heading, or browser-title text
- WHEN note identity is resolved
- THEN those values SHALL NOT participate in note title or filename resolution.

### Requirement: Editable file identity

Markdown Notes MUST use one explicit manual note name as the visible source for document title and filesystem filename.

#### Scenario: No manual note name

- GIVEN no manual note name exists
- WHEN the panel renders
- THEN the note-name input SHALL be empty
- AND Save SHALL remain disabled
- AND no generated ID or ChatGPT-derived text SHALL be shown as a substitute.

#### Scenario: Manual note name is entered

- GIVEN the user enters `Routing Linux`
- WHEN note identity is resolved
- THEN the filesystem filename SHALL normalize to `Routing Linux.md`
- AND the Markdown document title SHALL be `Routing Linux`.

#### Scenario: Manual name contains md extension

- GIVEN the user enters `Routing Linux.md`
- WHEN the Markdown document title is generated
- THEN the title SHALL be `Routing Linux`
- AND the filename SHALL remain `Routing Linux.md`.

### Requirement: Internal draft identity

Every browser draft MUST have a unique internal identifier independent from its visible note name.

#### Scenario: New draft

- GIVEN a new browser draft is created
- WHEN its state is initialized
- THEN Markdown Notes SHALL assign a unique internal `noteId`.

#### Scenario: Legacy draft without noteId

- GIVEN an existing persisted draft has no `noteId`
- WHEN it is normalized
- THEN Markdown Notes SHALL generate a `noteId`
- AND SHALL preserve existing body, Cornell, filename, and manual-name state.

#### Scenario: Internal ID remains invisible

- GIVEN a draft has an internal `noteId`
- WHEN the panel renders or the note is saved
- THEN `noteId` SHALL NOT be used as visible note title
- AND SHALL NOT be used as filesystem filename.

### Requirement: Filename persistence and save semantics

Filesystem save MUST continue to require the manual note name.

#### Scenario: Legacy inferred title exists without manual name

- GIVEN a legacy draft contains an inferred `noteTitle`
- AND no manual note name exists
- WHEN the draft loads
- THEN Save SHALL remain disabled
- AND the inferred title SHALL NOT populate the note-name field.

#### Scenario: Save with manual name

- GIVEN a valid manual note name exists
- WHEN a filesystem save succeeds
- THEN the saved Markdown title and filesystem filename SHALL both derive from that manual name.
