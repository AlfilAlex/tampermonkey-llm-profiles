# Markdown Notes — Delta Specification

## ADDED Requirements

### Requirement: Per-conversation note mode

Markdown Notes MUST persist the selected note representation independently for each conversation.

#### Scenario: Existing draft without mode metadata

- GIVEN an existing draft was created before Cornell mode exists
- WHEN the draft is loaded
- THEN Markdown Notes SHALL treat it as `freeform`
- AND SHALL preserve its existing body.

#### Scenario: Cornell mode survives reload

- GIVEN a conversation is set to Cornell mode
- AND Cornell content has been persisted locally
- WHEN the page reloads
- THEN Markdown Notes SHALL restore Cornell mode and its Cornell content.

#### Scenario: Conversation switching

- GIVEN two conversations use different note modes or Cornell content
- WHEN the user switches between them
- THEN each conversation SHALL restore its own persisted mode and draft state.

### Requirement: Structured Cornell blocks

Cornell mode MUST represent content as an ordered collection of cue-and-notes blocks plus one summary.

#### Scenario: Add a block

- GIVEN Cornell mode is active
- WHEN the user chooses to add a block
- THEN a new editable block SHALL be created
- AND the block SHALL contain an independently editable cue and notes body.

#### Scenario: Reorder a block

- GIVEN at least two Cornell blocks exist
- WHEN the user moves one block up or down
- THEN the persisted order SHALL change accordingly
- AND cue-to-notes associations SHALL remain unchanged.

#### Scenario: Delete a block

- GIVEN a Cornell block exists
- WHEN the user intentionally deletes it
- THEN that block SHALL be removed without changing the content of other blocks.

### Requirement: Responsive Cornell layout

Cornell mode MUST remain usable at both wide and narrow panel widths.

#### Scenario: Wide panel

- GIVEN the Cornell editor has sufficient horizontal space
- WHEN a block is rendered
- THEN its cue and notes SHALL appear side-by-side
- AND the cue region SHALL use substantially less width than the notes region.

#### Scenario: Narrow panel

- GIVEN the Cornell editor does not have sufficient horizontal space
- WHEN a block is rendered
- THEN its cue SHALL appear above its notes
- AND no horizontal scrolling SHALL be required for normal editing.

#### Scenario: Summary layout

- GIVEN Cornell mode is active
- WHEN the summary is rendered
- THEN it SHALL span the available editor width regardless of block layout.

### Requirement: Cornell review mode

Markdown Notes MUST provide a review view that supports cue-driven recall without exposing associated notes immediately.

#### Scenario: Enter review mode

- GIVEN at least one Cornell block contains a cue or notes
- WHEN the user enters review mode
- THEN cues SHALL remain visible
- AND associated notes SHALL initially be hidden.

#### Scenario: Reveal notes

- GIVEN a review item has hidden notes
- WHEN the user activates its reveal control
- THEN the associated notes SHALL become visible
- AND unrelated blocks SHALL remain unaffected unless the chosen review presentation explicitly navigates one item at a time.

#### Scenario: Review does not mutate notes

- GIVEN the user reveals or hides notes in review mode
- WHEN review state changes
- THEN Cornell cue, notes, summary, and block order SHALL remain unchanged.

### Requirement: Portable Cornell Markdown export

When Cornell mode is saved, Markdown Notes MUST serialize the structured draft to portable Markdown without requiring proprietary rendering extensions.

#### Scenario: Cornell save

- GIVEN Cornell mode is active
- AND the filesystem permission is granted
- WHEN the user saves the note
- THEN the output SHALL contain frontmatter identifying `note_method: "cornell"`
- AND SHALL contain a Cornell Notes section
- AND SHALL contain each non-empty block in persisted order
- AND SHALL contain a Summary section.

#### Scenario: Technical Markdown inside notes

- GIVEN a Cornell notes body contains paragraphs, lists, fenced code, or Mermaid
- WHEN the file is serialized
- THEN those Markdown constructs SHALL remain representable without being forced into Markdown table cells.

#### Scenario: Block without cue

- GIVEN a Cornell block contains notes but has an empty cue
- WHEN the file is serialized
- THEN the notes content SHALL still be exported under a neutral block heading.

#### Scenario: Completely empty block

- GIVEN a Cornell block has neither cue nor notes content
- WHEN the file is serialized
- THEN that block SHALL NOT create an empty Markdown section.

### Requirement: Freeform compatibility

Adding Cornell mode MUST NOT destructively transform existing freeform content.

#### Scenario: Switch from freeform to Cornell

- GIVEN a freeform body exists
- WHEN the user switches to Cornell mode
- THEN the freeform body SHALL remain stored unchanged
- AND Markdown Notes SHALL NOT automatically parse or delete it.

#### Scenario: Return to freeform

- GIVEN Cornell content exists
- AND a freeform body existed previously
- WHEN the user returns to freeform mode
- THEN the previous freeform body SHALL be restored unchanged.

### Requirement: Existing filesystem and filename behavior

Cornell mode MUST reuse the existing file destination and filename mechanisms.

#### Scenario: Editable filename override

- GIVEN a manual filename override exists
- WHEN a Cornell note is saved
- THEN the same manual filename precedence SHALL apply as in freeform mode.

#### Scenario: Directory permission is unavailable

- GIVEN Cornell mode is active
- AND the stored directory handle no longer has write permission
- WHEN the user attempts to save
- THEN Markdown Notes SHALL use the existing permission request/error behavior
- AND SHALL keep the browser draft intact if filesystem writing does not complete.
