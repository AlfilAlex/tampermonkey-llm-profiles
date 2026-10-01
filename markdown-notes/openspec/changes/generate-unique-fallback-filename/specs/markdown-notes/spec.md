# Markdown Notes — Delta Specification

## MODIFIED Requirements

### Requirement: Automatic filename resolution

When there is no manual filename override, Markdown Notes MUST resolve the target filename from a real conversation title or a generated unique fallback.

#### Scenario: Real conversation title exists

- GIVEN no manual filename override exists
- AND a real conversation title has been detected or adopted
- WHEN the target filename is resolved
- THEN the filename SHALL be derived from the conversation title.

#### Scenario: Conversation title is unavailable

- GIVEN no manual filename override exists
- AND no real conversation title is available
- WHEN the target filename is resolved
- THEN Markdown Notes SHALL use a generated fallback
- AND SHALL NOT use the ChatGPT conversation ID as the filename fallback.

#### Scenario: Generated fallback format

- GIVEN a generated fallback is required
- WHEN its identity is created
- THEN it SHALL contain an 8-character short random identifier
- AND a local date/time component including seconds
- AND SHALL use the format `<short-id>_<YYYY-MM-DD_HH-mm-ss>.md`.

#### Scenario: Generated fallback remains stable

- GIVEN a generated fallback identity has already been created for the draft
- WHEN the panel rerenders or the page reloads
- THEN Markdown Notes SHALL reuse the same generated fallback identity
- AND SHALL NOT generate a different filename merely because of the rerender or reload.

#### Scenario: Real title becomes available later

- GIVEN a generated fallback currently resolves the target filename
- AND no manual filename override exists
- WHEN a real conversation title is subsequently adopted
- THEN automatic filename resolution SHALL prefer the title-derived filename.

#### Scenario: Manual filename wins over automatic resolution

- GIVEN the user has set a manual filename
- WHEN a title is detected or a generated fallback exists
- THEN Markdown Notes SHALL keep the manual filename as the target.

### Requirement: Filename persistence and save semantics

Markdown Notes MUST distinguish the desired target filename from the filename last written successfully.

#### Scenario: Generated fallback state is persisted

- GIVEN no manual filename or real conversation title is available
- WHEN Markdown Notes generates the fallback identity
- THEN the short identifier and fallback timestamp SHALL be persisted with the browser draft state.

#### Scenario: Save succeeds under generated fallback

- GIVEN a generated fallback is the current target filename
- WHEN the filesystem write succeeds
- THEN the generated filename SHALL be stored as the last successfully written filename.

#### Scenario: Automatic target changes later

- GIVEN a note was previously saved under a generated fallback
- AND automatic filename resolution later produces a title-derived filename
- WHEN the user saves again
- THEN Markdown Notes SHALL write the new target
- AND SHALL NOT automatically delete the previously written fallback file.
