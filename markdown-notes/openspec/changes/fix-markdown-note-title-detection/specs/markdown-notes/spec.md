# Markdown Notes — Delta Specification

## MODIFIED Requirements

### Requirement: Conversation title identity

Markdown Notes MUST distinguish a real detected ChatGPT conversation title from visual fallback text.

#### Scenario: Real title is available

- GIVEN the active conversation exposes a non-empty, non-generic title
- WHEN Markdown Notes detects it
- THEN the title SHALL become the authoritative note title
- AND the detected title SHALL be persisted in the conversation draft state.

#### Scenario: ChatGPT temporarily removes the title from the DOM

- GIVEN Markdown Notes already adopted a real conversation title
- WHEN a later ChatGPT re-render temporarily makes title detection fail
- THEN Markdown Notes SHALL continue using the adopted title
- AND SHALL NOT regress to the generic fallback or provisional filename.

#### Scenario: No real title is available yet

- GIVEN no non-generic conversation title can be detected
- WHEN the panel renders
- THEN the UI MAY show `Nota de ChatGPT`
- BUT that fallback SHALL NOT be persisted as the authoritative conversation title.

#### Scenario: Legacy fallback title is loaded

- GIVEN a persisted v1.2.0 draft stores `Nota de ChatGPT` as its note title
- WHEN the draft is loaded
- THEN Markdown Notes SHALL treat that title as unresolved
- AND SHALL remain able to adopt a subsequently detected real title.

### Requirement: File identity while title detection is pending

Markdown Notes MUST avoid a shared generic filename for unrelated conversations while the conversation title is unresolved.

#### Scenario: Save occurs before title detection

- GIVEN the conversation has a chat identity
- AND no real title is detectable
- WHEN the user saves the note
- THEN Markdown Notes SHALL use a provisional filename derived from that conversation identity.

#### Scenario: Real title appears after a provisional filename exists

- GIVEN a provisional filename is stored for the note
- AND a real title is later detected and adopted
- WHEN the panel renders
- THEN the target filename SHALL be derived from the adopted title instead of the provisional name.

#### Scenario: Save succeeds after title adoption

- GIVEN a real title has been adopted
- WHEN the note is saved successfully
- THEN the stored filename SHALL be updated to the title-derived filename that was actually written.
