# Markdown Notes Specification

## Purpose

Markdown Notes defines the observable behavior of the standalone Tampermonkey userscript that keeps conversation-associated Markdown drafts in ChatGPT, provides an in-browser notes UI, and saves Markdown files to a user-selected local folder.

## Requirements

### Requirement: Conversation-associated draft persistence

Markdown Notes SHALL keep browser draft state isolated by ChatGPT conversation and restore the appropriate draft when that conversation becomes active again.

#### Scenario: Reload an existing conversation

- **GIVEN** a conversation has persisted browser draft state
- **WHEN** the page reloads on that conversation
- **THEN** Markdown Notes SHALL restore that conversation's draft.

#### Scenario: Switch conversations

- **GIVEN** two conversations have different draft state
- **WHEN** the user switches between them
- **THEN** Markdown Notes SHALL restore the state associated with the active conversation without mixing their content.

#### Scenario: New chat receives a permanent ID

- **GIVEN** a draft was created before ChatGPT assigned a permanent conversation ID
- **WHEN** the URL transitions to the permanent conversation ID
- **THEN** Markdown Notes SHALL preserve the temporary draft under the permanent conversation identity when no conflicting persisted state exists.

### Requirement: Docked and resizable notes panel

Markdown Notes SHALL provide a notes panel that remains usable while reading the active ChatGPT conversation.

#### Scenario: Resize the desktop panel

- **GIVEN** the notes panel is open on a desktop-sized viewport
- **WHEN** the user resizes the panel
- **THEN** the panel width SHALL change within its supported bounds
- **AND** the selected width SHALL be restorable after reload.

#### Scenario: Narrow viewport

- **GIVEN** the viewport is too narrow for the docked desktop layout
- **WHEN** the notes panel opens
- **THEN** the panel SHALL remain usable without requiring the desktop workspace reservation behavior.

### Requirement: Local draft and filesystem persistence remain distinct

Markdown Notes SHALL preserve browser draft state independently from filesystem save state.

#### Scenario: Draft changes before filesystem save

- **GIVEN** the user edits a note
- **WHEN** the local draft persistence completes before a filesystem save
- **THEN** the browser draft SHALL retain the edit
- **AND** the saved Markdown file SHALL remain unchanged until the user saves it.

#### Scenario: Filesystem write fails

- **GIVEN** browser draft state contains unsaved changes
- **WHEN** a filesystem write does not complete
- **THEN** Markdown Notes SHALL retain the browser draft
- **AND** SHALL NOT mark the failed write as successfully saved.

### Requirement: Filesystem directory and permission handling

Markdown Notes SHALL save Markdown only through a user-selected browser-controlled directory handle.

#### Scenario: No directory is configured

- **GIVEN** no notes directory is configured
- **WHEN** the user attempts to save
- **THEN** Markdown Notes SHALL request directory selection before writing a file.

#### Scenario: Stored permission is no longer granted

- **GIVEN** a directory handle was restored from browser storage
- **AND** write permission is not currently granted
- **WHEN** the user attempts to save
- **THEN** Markdown Notes SHALL request write permission before writing
- **OR** report the inability to save without discarding the browser draft.

### Requirement: Conversation title identity

Markdown Notes MUST distinguish a real detected ChatGPT conversation title from visual fallback text.

#### Scenario: Real title is available

- **GIVEN** the active conversation exposes a non-empty, non-generic title
- **WHEN** Markdown Notes detects it
- **THEN** the title SHALL become the authoritative note title
- **AND** the detected title SHALL be persisted in the conversation draft state.

#### Scenario: ChatGPT temporarily removes the title from the DOM

- **GIVEN** Markdown Notes already adopted a real conversation title
- **WHEN** a later ChatGPT re-render temporarily makes title detection fail
- **THEN** Markdown Notes SHALL continue using the adopted title
- **AND** SHALL NOT regress to the generic fallback.

#### Scenario: No real title is available yet

- **GIVEN** no non-generic conversation title can be detected
- **WHEN** the panel renders
- **THEN** the UI MAY show `Nota de ChatGPT`
- **BUT** that fallback SHALL NOT be persisted as the authoritative conversation title.

### Requirement: Editable file identity

Markdown Notes MUST expose the target Markdown filename as an editable value associated with the active conversation.

#### Scenario: User edits the filename

- **GIVEN** a conversation note is active
- **WHEN** the user edits the filename field
- **THEN** the entered value SHALL become the manual filename override for that conversation
- **AND** the override SHALL be persisted with the local draft state.

#### Scenario: User omits the extension

- **GIVEN** the user enters a non-empty manual filename without a `.md` suffix
- **WHEN** the filename is normalized
- **THEN** Markdown Notes SHALL append `.md`.

#### Scenario: User clears the filename

- **GIVEN** a manual filename override exists
- **WHEN** the user clears the filename field and leaves it empty
- **THEN** the manual override SHALL be removed
- **AND** the displayed target filename SHALL return to automatic resolution.

#### Scenario: Title metadata remains independent

- **GIVEN** the conversation title differs from the manual filename
- **WHEN** the Markdown document is generated
- **THEN** the filesystem target SHALL use the manual filename
- **AND** the Markdown title metadata SHALL continue to represent the conversation title.

### Requirement: Automatic filename resolution

When there is no manual filename override, Markdown Notes MUST resolve the target filename using a stable priority order.

#### Scenario: Real conversation title exists

- **GIVEN** no manual filename override exists
- **AND** a real conversation title has been detected or adopted
- **WHEN** the target filename is resolved
- **THEN** the filename SHALL be derived from the conversation title.

#### Scenario: Title is unavailable but chat ID exists

- **GIVEN** no manual filename override exists
- **AND** no real conversation title is available
- **AND** the URL contains a ChatGPT conversation ID
- **WHEN** the target filename is resolved
- **THEN** the full conversation ID SHALL be used as the filename stem
- **AND** the filename SHALL end in `.md`.

#### Scenario: Neither title nor chat ID exists

- **GIVEN** no manual filename override exists
- **AND** no real conversation title is available
- **AND** no ChatGPT conversation ID is available
- **WHEN** the target filename is resolved
- **THEN** Markdown Notes SHALL use a local timestamp filename
- **AND** the filename SHALL have the format `YYYY-MM-DD_HH-mm-ss.md`.

#### Scenario: Manual filename wins over later title detection

- **GIVEN** the user has set a manual filename
- **WHEN** ChatGPT later exposes or changes the conversation title
- **THEN** Markdown Notes SHALL keep the manual filename unchanged.

### Requirement: Filename persistence and save semantics

Markdown Notes MUST distinguish the desired target filename from the filename last written successfully.

#### Scenario: Save succeeds

- **GIVEN** a target filename has been resolved
- **WHEN** the filesystem write succeeds
- **THEN** the successfully written filename SHALL be stored as the last saved filename.

#### Scenario: Filename changes after a previous save

- **GIVEN** a note was previously saved under one filename
- **AND** the user changes the manual filename
- **WHEN** the user saves again
- **THEN** Markdown Notes SHALL write the new target filename
- **AND** SHALL NOT automatically delete the previous file.

#### Scenario: Reload with manual filename

- **GIVEN** a manual filename override was persisted for a conversation
- **WHEN** the page reloads and that conversation is restored
- **THEN** the editable filename field SHALL show the persisted manual filename.

### Requirement: Per-conversation note mode

Markdown Notes MUST persist the selected note representation independently for each conversation.

#### Scenario: Existing draft without mode metadata

- **GIVEN** an existing draft was created before Cornell mode exists
- **WHEN** the draft is loaded
- **THEN** Markdown Notes SHALL treat it as `freeform`
- **AND** SHALL preserve its existing body.

#### Scenario: Cornell mode survives reload

- **GIVEN** a conversation is set to Cornell mode
- **AND** Cornell content has been persisted locally
- **WHEN** the page reloads
- **THEN** Markdown Notes SHALL restore Cornell mode and its Cornell content.

#### Scenario: Conversation switching with different modes

- **GIVEN** two conversations use different note modes or Cornell content
- **WHEN** the user switches between them
- **THEN** each conversation SHALL restore its own persisted mode and draft state.

### Requirement: Structured Cornell blocks

Cornell mode MUST represent content as an ordered collection of cue-and-notes blocks plus one summary.

#### Scenario: Add a block

- **GIVEN** Cornell mode is active
- **WHEN** the user chooses to add a block
- **THEN** a new editable block SHALL be created
- **AND** the block SHALL contain an independently editable cue and notes body.

#### Scenario: Reorder a block

- **GIVEN** at least two Cornell blocks exist
- **WHEN** the user moves one block up or down
- **THEN** the persisted order SHALL change accordingly
- **AND** cue-to-notes associations SHALL remain unchanged.

#### Scenario: Delete a block

- **GIVEN** a Cornell block exists
- **WHEN** the user intentionally deletes it
- **THEN** that block SHALL be removed without changing the content of other blocks.

### Requirement: Responsive Cornell layout

Cornell mode MUST remain usable at both wide and narrow panel widths.

#### Scenario: Wide panel

- **GIVEN** the Cornell editor has sufficient horizontal space
- **WHEN** a block is rendered
- **THEN** its cue and notes SHALL appear side-by-side
- **AND** the cue region SHALL use substantially less width than the notes region.

#### Scenario: Narrow panel

- **GIVEN** the Cornell editor does not have sufficient horizontal space
- **WHEN** a block is rendered
- **THEN** its cue SHALL appear above its notes
- **AND** no horizontal scrolling SHALL be required for normal editing.

#### Scenario: Summary layout

- **GIVEN** Cornell mode is active
- **WHEN** the summary is rendered
- **THEN** it SHALL span the available editor width regardless of block layout.

### Requirement: Cornell review mode

Markdown Notes MUST provide a review view that supports cue-driven recall without exposing associated notes immediately.

#### Scenario: Enter review mode

- **GIVEN** at least one Cornell block contains a cue or notes
- **WHEN** the user enters review mode
- **THEN** the current cue SHALL remain visible
- **AND** its associated notes SHALL initially be hidden.

#### Scenario: Reveal notes

- **GIVEN** a review item has hidden notes
- **WHEN** the user activates its reveal control
- **THEN** the associated notes SHALL become visible.

#### Scenario: Review does not mutate notes

- **GIVEN** the user reveals, hides, or navigates review items
- **WHEN** review state changes
- **THEN** Cornell cue, notes, summary, and block order SHALL remain unchanged.

### Requirement: Portable Cornell Markdown export

When Cornell mode is saved, Markdown Notes MUST serialize the structured draft to portable Markdown without requiring proprietary rendering extensions.

#### Scenario: Cornell save

- **GIVEN** Cornell mode is active
- **AND** filesystem permission is granted
- **WHEN** the user saves the note
- **THEN** the output SHALL contain frontmatter identifying `note_method: "cornell"`
- **AND** SHALL contain a Cornell Notes section
- **AND** SHALL contain each non-empty block in persisted order
- **AND** SHALL contain a Summary section.

#### Scenario: Technical Markdown inside notes

- **GIVEN** a Cornell notes body contains paragraphs, lists, fenced code, or Mermaid
- **WHEN** the file is serialized
- **THEN** those Markdown constructs SHALL remain representable without being forced into Markdown table cells.

#### Scenario: Block without cue

- **GIVEN** a Cornell block contains notes but has an empty cue
- **WHEN** the file is serialized
- **THEN** the notes content SHALL still be exported under a neutral block heading.

#### Scenario: Completely empty block

- **GIVEN** a Cornell block has neither cue nor notes content
- **WHEN** the file is serialized
- **THEN** that block SHALL NOT create an empty Markdown section.

### Requirement: Freeform compatibility

Adding Cornell mode MUST NOT destructively transform existing freeform content.

#### Scenario: Switch from freeform to Cornell

- **GIVEN** a freeform body exists
- **WHEN** the user switches to Cornell mode
- **THEN** the freeform body SHALL remain stored unchanged
- **AND** Markdown Notes SHALL NOT automatically parse or delete it.

#### Scenario: Return to freeform

- **GIVEN** Cornell content exists
- **AND** a freeform body existed previously
- **WHEN** the user returns to freeform mode
- **THEN** the previous freeform body SHALL be restored unchanged.

### Requirement: Cornell reuses existing filesystem and filename behavior

Cornell mode MUST reuse the existing file destination and filename mechanisms.

#### Scenario: Editable filename override

- **GIVEN** a manual filename override exists
- **WHEN** a Cornell note is saved
- **THEN** the same manual filename precedence SHALL apply as in freeform mode.

#### Scenario: Directory permission is unavailable

- **GIVEN** Cornell mode is active
- **AND** the stored directory handle no longer has write permission
- **WHEN** the user attempts to save
- **THEN** Markdown Notes SHALL use the existing permission request or error behavior
- **AND** SHALL keep the browser draft intact if filesystem writing does not complete.
