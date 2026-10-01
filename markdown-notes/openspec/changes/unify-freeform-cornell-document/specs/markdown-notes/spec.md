# Markdown Notes — Delta Specification

## MODIFIED Requirements

### Requirement: Per-conversation note mode

Markdown Notes MUST expose Libre, Cornell, and Repaso as views over one canonical note document per conversation.

#### Scenario: Cornell content is visible in Libre

- GIVEN the user edits Cornell blocks
- WHEN the user switches to Libre
- THEN Libre SHALL display the Markdown representation of those same Cornell blocks and summary
- AND SHALL NOT display an independent empty or stale freeform draft.

#### Scenario: Libre changes are reflected in Cornell

- GIVEN the current body is valid Cornell Markdown
- AND the user edits that Markdown in Libre
- WHEN the user returns to Cornell
- THEN Markdown Notes SHALL rebuild the Cornell projection from the current body.

#### Scenario: Switching views does not create a second note

- GIVEN a conversation has one canonical body
- WHEN the user switches among Libre, Cornell, and Repaso
- THEN Markdown Notes SHALL retain one canonical browser document
- AND mode switching alone SHALL NOT create an independent content history.

### Requirement: Structured Cornell blocks

Cornell mode MUST edit a structured projection of the canonical Markdown body.

#### Scenario: Cornell edit updates canonical body

- GIVEN Cornell mode is active
- WHEN the user edits a cue, notes body, or summary
- THEN the canonical Markdown body SHALL be updated to represent that change.

#### Scenario: Cornell reorder updates canonical body

- GIVEN multiple Cornell blocks exist
- WHEN the user reorders them
- THEN the canonical Markdown body SHALL reflect the new block order.

#### Scenario: Freeform document enters Cornell

- GIVEN the canonical body contains arbitrary non-Cornell Markdown
- WHEN the user enters Cornell mode
- THEN Markdown Notes SHALL preserve the complete body by importing it as a Cornell block
- AND SHALL NOT discard the freeform text.

### Requirement: Portable Cornell Markdown export

Cornell structure MUST have a deterministic Markdown representation that can be edited in Libre and reconstructed later.

#### Scenario: Serialize Cornell structure

- GIVEN Cornell blocks and summary exist
- WHEN their canonical body is generated
- THEN the body SHALL contain `## Cornell Notes`
- AND each non-empty block SHALL use a numbered `### N. ...` heading
- AND the body SHALL contain `## Summary`.

#### Scenario: Parse generated Cornell Markdown

- GIVEN a canonical body follows the supported Cornell Markdown structure
- WHEN Cornell mode is entered
- THEN the block order, cues, notes, and summary SHALL be reconstructed from that body.

#### Scenario: Unsupported edited structure

- GIVEN the user edits the body such that it no longer matches the supported Cornell structure
- WHEN Cornell mode is entered
- THEN Markdown Notes SHALL preserve the complete body as notes in a single Cornell block
- AND SHALL NOT silently discard text.

### Requirement: Freeform compatibility

Existing drafts MUST migrate to the single-document model without losing previously stored content.

#### Scenario: Legacy draft contains only freeform body

- GIVEN a legacy draft contains freeform body content and no meaningful Cornell content
- WHEN the draft is loaded
- THEN the freeform body SHALL remain the canonical body unchanged.

#### Scenario: Legacy draft contains only Cornell content

- GIVEN a legacy draft has meaningful Cornell content and an empty freeform body
- WHEN the draft is loaded
- THEN Markdown Notes SHALL serialize the Cornell content into the canonical body.

#### Scenario: Legacy draft contains both independent contents

- GIVEN a legacy draft contains non-empty freeform body and meaningful Cornell content
- AND the body is not already valid Cornell Markdown
- WHEN the draft is normalized
- THEN Markdown Notes SHALL preserve the previous freeform body and Cornell content in one Cornell document
- AND SHALL NOT discard either representation.

### Requirement: Local draft and filesystem persistence remain distinct

Markdown Notes MUST save the same canonical body regardless of the currently selected view.

#### Scenario: Save from Libre

- GIVEN a canonical note body exists
- WHEN the user saves while Libre is selected
- THEN the saved file SHALL contain that canonical body.

#### Scenario: Save from Cornell or Repaso

- GIVEN the same canonical note body exists
- WHEN the user saves while Cornell or Repaso is selected
- THEN the saved file SHALL contain the same canonical body representation.

#### Scenario: Successful save updates baseline

- GIVEN a filesystem write succeeds
- WHEN save state is persisted
- THEN `savedBody` SHALL become the current canonical body
- AND dirty state SHALL no longer depend on a separate Cornell snapshot.
