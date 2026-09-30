# Markdown Notes — Delta Specification

## MODIFIED Requirements

### Requirement: Editable file identity

Markdown Notes MUST expose the target Markdown filename as an editable value associated with the active conversation.

#### Scenario: User edits the filename

- GIVEN a conversation note is active
- WHEN the user edits the filename field
- THEN the entered value SHALL become the manual filename override for that conversation
- AND the override SHALL be persisted with the local draft state.

#### Scenario: User omits the extension

- GIVEN the user enters a non-empty manual filename without a `.md` suffix
- WHEN the filename is normalized
- THEN Markdown Notes SHALL append `.md`.

#### Scenario: User clears the filename

- GIVEN a manual filename override exists
- WHEN the user clears the filename field and leaves it empty
- THEN the manual override SHALL be removed
- AND the displayed target filename SHALL return to automatic resolution.

#### Scenario: Title metadata remains independent

- GIVEN the conversation title is `Interpretar rutas netstat`
- AND the user sets the filename to `rutas-linux-lab.md`
- WHEN the Markdown document is generated
- THEN the filesystem target SHALL be `rutas-linux-lab.md`
- AND the Markdown `title` metadata SHALL continue to represent the conversation title.

### Requirement: Automatic filename resolution

When there is no manual filename override, Markdown Notes MUST resolve the target filename using a stable priority order.

#### Scenario: Real conversation title exists

- GIVEN no manual filename override exists
- AND a real conversation title has been detected or adopted
- WHEN the target filename is resolved
- THEN the filename SHALL be derived from the conversation title.

#### Scenario: Title is unavailable but chat ID exists

- GIVEN no manual filename override exists
- AND no real conversation title is available
- AND the URL contains a ChatGPT conversation ID
- WHEN the target filename is resolved
- THEN the full conversation ID SHALL be used as the filename stem
- AND the filename SHALL end in `.md`.

#### Scenario: Neither title nor chat ID exists

- GIVEN no manual filename override exists
- AND no real conversation title is available
- AND no ChatGPT conversation ID is available
- WHEN the target filename is resolved
- THEN Markdown Notes SHALL use a local timestamp filename
- AND the filename SHALL have the format `YYYY-MM-DD_HH-mm-ss.md`.

#### Scenario: Manual filename wins over later title detection

- GIVEN the user has set a manual filename
- WHEN ChatGPT later exposes or changes the conversation title
- THEN Markdown Notes SHALL keep the manual filename unchanged.

### Requirement: Filename persistence and save semantics

Markdown Notes MUST distinguish the desired target filename from the filename last written successfully.

#### Scenario: Save succeeds

- GIVEN a target filename has been resolved
- WHEN the filesystem write succeeds
- THEN the successfully written filename SHALL be stored as the last saved filename.

#### Scenario: Filename changes after a previous save

- GIVEN a note was previously saved as `old-name.md`
- AND the user changes the manual filename to `new-name.md`
- WHEN the user saves again
- THEN Markdown Notes SHALL write `new-name.md`
- AND SHALL NOT automatically delete `old-name.md`.

#### Scenario: Reload with manual filename

- GIVEN a manual filename override was persisted for a conversation
- WHEN the page reloads and that conversation is restored
- THEN the editable filename field SHALL show the persisted manual filename.
