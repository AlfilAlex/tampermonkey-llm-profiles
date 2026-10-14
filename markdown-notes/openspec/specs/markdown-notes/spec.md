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

#### Scenario: User edits the filename

- GIVEN a conversation note is active
- WHEN the user edits the filename field
- THEN the entered value SHALL become the manual filename override for that conversation
- AND the override SHALL be persisted with the local draft state.

#### Scenario: User omits the extension

- GIVEN the user enters a non-empty manual filename without a `.md` suffix
- WHEN the filename is normalized
- THEN Markdown Notes SHALL append `.md`.

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

#### Scenario: Non-empty Libre note is not Cornell-compatible

- **GIVEN** Libre mode is active
- **AND** the canonical body contains non-empty Markdown that does not match the supported Cornell structure
- **WHEN** the user selects Cornell or Repaso
- **THEN** Markdown Notes SHALL remain in Libre
- **AND** SHALL explain that the note must first be prepared for Cornell
- **AND** SHALL preserve the body unchanged.

#### Scenario: Empty Libre note switches to Cornell

- **GIVEN** Libre mode is active
- **AND** the canonical body is empty
- **WHEN** the user selects Cornell
- **THEN** Markdown Notes MAY switch directly to Cornell without requiring preparation.

#### Scenario: Cornell-compatible Libre note switches to Cornell

- **GIVEN** Libre mode is active
- **AND** the canonical body matches the supported Cornell Markdown structure
- **WHEN** the user selects Cornell
- **THEN** Markdown Notes SHALL reconstruct the Cornell projection and switch modes.

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

#### Scenario: Cornell edit updates canonical body

- GIVEN Cornell mode is active
- WHEN the user edits a cue, notes body, or summary
- THEN the canonical Markdown body SHALL be updated to represent that change.

#### Scenario: Cornell reorder updates canonical body

- GIVEN multiple Cornell blocks exist
- WHEN the user reorders them
- THEN the canonical Markdown body SHALL reflect the new block order.

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

#### Scenario: Parse generated Cornell Markdown

- GIVEN a canonical body follows the supported Cornell Markdown structure
- WHEN Cornell mode is entered
- THEN the block order, cues, notes, and summary SHALL be reconstructed from that body.

### Requirement: Freeform compatibility

Libre MUST provide semantic assistance for producing Cornell-compatible Markdown without requiring knowledge of Markdown heading levels.

#### Scenario: Libre note is not structured for Cornell

- **GIVEN** Libre contains arbitrary non-empty Markdown
- **WHEN** the editor renders
- **THEN** the UI SHALL indicate that the note is not yet Cornell-structured
- **AND** SHALL expose an explicit `Preparar Cornell` action.

#### Scenario: Prepare arbitrary Libre note

- **GIVEN** arbitrary Libre Markdown is not Cornell-compatible
- **WHEN** the user activates `Preparar Cornell`
- **THEN** Markdown Notes SHALL preserve the complete existing body inside a neutral Cornell notes block
- **AND** SHALL produce canonical Cornell Markdown
- **AND** SHALL NOT write to the filesystem as a side effect.

#### Scenario: Prepare empty Libre note

- **GIVEN** the Libre body is empty
- **WHEN** the user activates `Preparar Cornell`
- **THEN** Markdown Notes SHALL create a valid empty Cornell document structure
- **AND** SHALL keep filesystem state unchanged.

## ADDED Requirements

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

### Requirement: Active document may be new or reused
The notes panel SHALL let each chat choose to create a new document or adopt a saved Markdown document as the active editable note.

#### Scenario: Create new
- **WHEN** the user selects Crear nuevo
- **THEN** the chat SHALL present an empty note with no existing file selected.

#### Scenario: Reuse existing document
- **WHEN** the user selects an existing Markdown file and presses Usar como nota activa
- **THEN** the existing document SHALL become editable in the current chat
- **AND** subsequent saves SHALL update that same file without creating a copy.

#### Scenario: Protect unsaved draft
- **GIVEN** the current chat contains unsaved work
- **WHEN** another document is selected
- **THEN** the user SHALL be prompted before that draft is replaced.

### Requirement: Persist active selection per conversation
The selected filename and pending unsaved text SHALL survive reload and switching conversations.

#### Scenario: Chat becomes permanent
- **GIVEN** an existing file was adopted while the chat had a temporary identity
- **WHEN** ChatGPT assigns a permanent /c/ ID
- **THEN** the selection and draft SHALL migrate with the chat.

### Requirement: Preserve shared document provenance and format
Editing a reused document SHALL NOT change its original chat attribution or unrelated front matter.

#### Scenario: Different chat edits reused note
- **GIVEN** a note was created in chat A
- **WHEN** chat B adopts and saves edits
- **THEN** the file SHALL retain A's chat_id and chat_url
- **AND** a Cornell document SHALL keep its canonical Cornell body.

### Requirement: Prevent conflicting writes
The userscript SHALL reject saving a reused file when its current content differs from the file version originally loaded.

#### Scenario: Another editor changes the file
- **WHEN** a chat attempts to save stale changes
- **THEN** saving SHALL fail with an explicit conflict explanation
- **AND** the local unsaved draft SHALL remain intact.

### Requirement: Keep preview separate from editor
Previewing a library file SHALL not change the current draft.

#### Scenario: Read-only preview
- **WHEN** a document is previewed
- **THEN** it SHALL remain read-only until the user explicitly selects Usar como nota activa.

### Requirement: Prevent accidental filename collisions
A new document SHALL NOT silently overwrite an unrelated existing Markdown file.

#### Scenario: Filename already exists
- **WHEN** a new note is first saved using a filename already on disk
- **THEN** the user SHALL be asked to select a different name or adopt the file.

### Requirement: Non-destructive Cue insertion in Libre mode

When the user activates **+ Cue / Pregunta**, Markdown Notes MUST insert only a new Cornell Cue heading and any immediately necessary separator characters. It MUST NOT reserialize, trim, or otherwise change any pre-existing text, spacing, indentation, or line-ending sequences.

#### Scenario: Existing Cornell note has intentional blank lines
- **GIVEN** a valid Cornell note with several consecutive blank lines within a block and its summary
- **WHEN** the user activates **+ Cue / Pregunta**
- **THEN** the pre-existing block and summary text MUST be byte-for-byte identical to before the action
- **AND** the new Cue MUST appear before the final `## Summary`.

#### Scenario: Repeat insertion
- **GIVEN** an existing note containing the Cue placeholder
- **WHEN** the user inserts another Cue
- **THEN** the existing placeholder and all prior text MUST remain unchanged
- **AND** a new Cue placeholder MUST be inserted exactly once.

#### Scenario: Freeform document
- **GIVEN** a document with no Cornell structure and several blank lines or indentation
- **WHEN** the user adds a Cue
- **THEN** the original Markdown MUST remain a contiguous, unmodified substring in the resulting Cornell document
- **AND** the document MUST remain parseable by the existing Cornell parser.

#### Scenario: Windows line endings
- **GIVEN** an existing Cornell document uses CRLF line endings
- **WHEN** the user adds a Cue
- **THEN** existing CRLF sequences MUST be preserved
- **AND** the inserted lines MUST use the same line-ending style.

### Requirement: Cue insertion must not scroll the surrounding ChatGPT page

Markdown Notes MUST focus and select the inserted Cue without causing a jump in the page or conversation scroll position.

#### Scenario: User is reading midway through a long conversation
- **GIVEN** ChatGPT is scrolled away from the top
- **WHEN** the user presses **+ Cue / Pregunta**
- **THEN** the page/ChatGPT conversation viewport MUST remain at its previous scroll position
- **AND** the new Cue text MUST be selected in the note editor.

### Requirement: Persist edits after safe insertion

The insertion MUST continue to mark the note as changed and schedule normal local-draft persistence.

#### Scenario: Reload after adding a Cue
- **WHEN** the user adds a Cue and the local draft persistence completes
- **THEN** the edited note MUST be restored without losing its original whitespace.

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

### Requirement: Cornell structure assistant

Libre mode MUST expose semantic Cornell structure controls separate from generic Markdown formatting.

#### Scenario: Cornell compatibility status

- **GIVEN** Libre mode is active
- **WHEN** the canonical body is evaluated
- **THEN** the UI SHALL distinguish empty, arbitrary Libre, and Cornell-compatible states.

#### Scenario: Cornell-compatible status includes block count

- **GIVEN** a canonical Cornell body contains N parsed blocks
- **WHEN** Libre renders
- **THEN** the assistant SHALL communicate that Cornell is ready
- **AND** SHALL include the detected block count.

#### Scenario: Assistant hidden outside Libre

- **GIVEN** Cornell or Repaso mode is active
- **WHEN** the editor renders
- **THEN** the Libre structure assistant SHALL be hidden.

### Requirement: Semantic cue insertion

Libre MUST allow users to add Cornell cues without manually constructing Markdown headings.

#### Scenario: Add cue to Cornell-ready note

- **GIVEN** Libre contains canonical Cornell Markdown
- **WHEN** the user activates `+ Cue / Pregunta`
- **THEN** Markdown Notes SHALL insert a new Cornell block before Summary
- **AND** SHALL insert a semantic `### Cue: ...` heading without reserializing unrelated Markdown
- **AND** SHALL focus/select the cue placeholder for immediate replacement.

#### Scenario: Add cue to arbitrary Libre note

- **GIVEN** Libre contains non-Cornell Markdown
- **WHEN** the user activates `+ Cue / Pregunta`
- **THEN** Markdown Notes SHALL first preserve the existing body through Cornell preparation
- **AND** SHALL then add the new cue block.

### Requirement: Semantic summary navigation

Libre MUST provide direct navigation to the Cornell summary without requiring the user to find or create its Markdown heading.

#### Scenario: Go to existing summary

- **GIVEN** canonical Cornell Markdown exists
- **WHEN** the user activates `Ir a resumen`
- **THEN** the Libre textarea SHALL receive focus
- **AND** the caret SHALL move to the Summary body.

#### Scenario: Go to summary from arbitrary Libre

- **GIVEN** the note is not yet Cornell-compatible
- **WHEN** the user activates `Ir a resumen`
- **THEN** Markdown Notes SHALL prepare the note non-destructively
- **AND** SHALL move the caret to the generated Summary body.

### Requirement: Cornell structure guidance

Libre MUST explain Cornell semantics without requiring the user to understand internal heading levels.

#### Scenario: User opens structure help

- **GIVEN** Libre mode is active
- **WHEN** the user expands the Cornell structure help
- **THEN** the UI SHALL explain Cue/Pregunta, notes content, and Summary
- **AND** SHALL state that H1/H2/H3 are not required for Cornell conversion.

#### Scenario: Generic heading controls

- **GIVEN** the Markdown toolbar is visible
- **WHEN** heading controls are rendered
- **THEN** their visible labels SHALL describe generic document structure rather than implying Cornell semantics
- **AND** accessible labels/tooltips SHALL still identify the corresponding Markdown heading level.

### Requirement: Semantic Cornell Markdown cues

New Cornell serialization MUST make cue boundaries understandable in raw Libre Markdown while remaining backward compatible.

#### Scenario: New Cornell serialization

- **GIVEN** a Cornell block has a cue
- **WHEN** Markdown Notes serializes the canonical body
- **THEN** the block SHALL use a `### Cue: ...` heading
- **AND** block identity SHALL NOT depend on persisted numeric ordering.

#### Scenario: Legacy numbered Cornell body

- **GIVEN** an existing canonical body uses legacy numbered `### N. ...` cue headings
- **WHEN** Markdown Notes parses the body
- **THEN** the existing cues and notes SHALL remain reconstructable.

#### Scenario: Generic numbered heading inside semantic Cornell notes

- **GIVEN** a semantic Cornell block contains an ordinary numbered H3 heading in its notes
- **WHEN** the body is parsed
- **THEN** that heading SHALL remain note content
- **AND** SHALL NOT create another Cornell block.

### Requirement: Local Cornell block actions

Cornell mode MUST provide block-local insertion and guarded deletion controls.

#### Scenario: Insert block after current block

- **GIVEN** a Cornell block exists
- **WHEN** the user activates its compact add control
- **THEN** Markdown Notes SHALL insert a new blank block immediately after that block
- **AND** SHALL preserve the order and content of all existing blocks
- **AND** SHALL focus the new block's Cue / Question field.

#### Scenario: Append action remains available

- **GIVEN** Cornell mode is active
- **WHEN** the editor renders
- **THEN** the existing append-at-end block action SHALL remain available in addition to block-local insertion.

#### Scenario: First delete activation does not delete

- **GIVEN** a Cornell block exists
- **WHEN** the user activates Delete once
- **THEN** the block SHALL remain unchanged
- **AND** the control SHALL enter a temporary confirmation state.

#### Scenario: Confirm delete

- **GIVEN** a block's Delete control is in its temporary confirmation state
- **WHEN** the user activates that control again before the confirmation expires
- **THEN** that block SHALL be removed
- **AND** other blocks SHALL remain unchanged.

#### Scenario: Delete confirmation expires

- **GIVEN** a block's Delete control is armed for confirmation
- **WHEN** the confirmation window expires without a second activation
- **THEN** the block SHALL remain unchanged
- **AND** the Delete control SHALL return to its normal state.

#### Scenario: Empty block also requires confirmation

- **GIVEN** an empty Cornell block exists
- **WHEN** the user activates Delete once
- **THEN** the block SHALL NOT be removed immediately
- **AND** the same confirmation friction SHALL apply as for populated blocks.

### Requirement: Markdown formatting toolbar

Markdown Notes MUST provide formatting controls for Markdown-capable note fields without replacing Markdown as the stored representation.

#### Scenario: Toolbar in Libre

- GIVEN Libre mode is active
- WHEN the editor is shown
- THEN the Markdown formatting toolbar SHALL be visible
- AND toolbar operations SHALL target the Libre Markdown textarea.

#### Scenario: Toolbar in Cornell

- GIVEN Cornell mode is active
- WHEN a Notes or Summary field is active
- THEN toolbar operations SHALL transform that Markdown field
- AND the resulting Cornell content SHALL synchronize to the canonical body.

#### Scenario: Cue field is excluded

- GIVEN a Cornell Cue / Question field is active
- WHEN the user activates a Markdown toolbar command
- THEN Markdown Notes SHALL NOT insert Markdown formatting into the Cue field.

#### Scenario: Toolbar in Repaso

- GIVEN Repaso mode is active
- WHEN the view renders
- THEN the Markdown formatting toolbar SHALL be hidden.

### Requirement: Inline formatting operations

Markdown Notes MUST support non-destructive inline Markdown insertion.

#### Scenario: Bold selected text

- GIVEN text is selected in a supported Markdown textarea
- WHEN Bold is activated
- THEN the selected text SHALL be wrapped in `**`.

#### Scenario: Bold without selection

- GIVEN a supported Markdown textarea has a caret but no selection
- WHEN Bold is activated
- THEN Markdown Notes SHALL insert a bold placeholder
- AND SHALL leave a useful selection or caret for immediate typing.

#### Scenario: Link selected text

- GIVEN text is selected
- WHEN Link is activated
- THEN the result SHALL use Markdown link syntax
- AND the URL placeholder SHALL remain editable.

### Requirement: Line-based formatting operations

Markdown Notes MUST support headings, lists, task lists, and blockquotes across the current line or selected lines.

#### Scenario: Multiple selected lines become bullets

- GIVEN multiple lines are selected
- WHEN Unordered List is activated
- THEN each selected line SHALL receive a Markdown bullet prefix.

#### Scenario: Multiple selected lines become ordered items

- GIVEN multiple lines are selected
- WHEN Ordered List is activated
- THEN each selected line SHALL receive an incrementing Markdown ordered-list prefix beginning at 1.

#### Scenario: Current line becomes heading

- GIVEN no text range is selected
- AND the caret is within a line
- WHEN H2 is activated
- THEN that complete line SHALL receive an H2 prefix.

### Requirement: Code formatting operations

Markdown Notes MUST support inline and fenced code insertion.

#### Scenario: Inline code selection

- GIVEN a single-line selection exists
- WHEN Inline Code is activated
- THEN the selection SHALL be wrapped in backticks.

#### Scenario: Fenced code selection

- GIVEN text is selected
- WHEN Code Block is activated
- THEN the selected text SHALL be wrapped in a fenced Markdown code block.

### Requirement: Formatting preserves editor state flow

Toolbar operations MUST behave like ordinary edits for persistence and dirty-state purposes.

#### Scenario: Formatting Libre marks canonical body changed

- GIVEN Libre mode is active
- WHEN a toolbar operation changes text
- THEN activeState.body SHALL reflect the transformed text
- AND normal draft persistence SHALL run.

#### Scenario: Formatting Cornell updates canonical body

- GIVEN a Cornell Notes or Summary field is active
- WHEN a toolbar operation changes text
- THEN the Cornell structured state SHALL reflect the transformed text
- AND the canonical Markdown body SHALL reflect the same change.

### Requirement: Markdown editing shortcuts

Markdown Notes SHALL provide common formatting shortcuts without conflicting with save behavior.

#### Scenario: Bold shortcut

- GIVEN a supported Markdown textarea has focus
- WHEN the user presses Cmd/Ctrl+B
- THEN Bold SHALL be applied.

#### Scenario: Italic shortcut

- GIVEN a supported Markdown textarea has focus
- WHEN the user presses Cmd/Ctrl+I
- THEN Italic SHALL be applied.

#### Scenario: Link shortcut

- GIVEN a supported Markdown textarea has focus
- WHEN the user presses Cmd/Ctrl+K
- THEN Link SHALL be applied.

#### Scenario: Save shortcut remains available

- GIVEN an editable notes field is focused
- WHEN the user presses Cmd/Ctrl+S
- THEN the existing save behavior SHALL remain unchanged.

### Requirement: Monotonic userscript release version

Published Markdown Notes userscript metadata MUST use a version greater than previously published versions, including after reverting a feature.

#### Scenario: Revert after v1.8.0

- **GIVEN** v1.8.0 has already been installed
- **WHEN** the Live Preview feature is reverted
- **THEN** the reverted userscript SHALL advertise a version greater than v1.8.0
- **AND** SHALL NOT advertise v1.7.0.

### Requirement: Explicit update source

Markdown Notes MUST declare the canonical raw userscript URL for update and download metadata.

#### Scenario: Updated userscript metadata

- **WHEN** v1.8.1 is installed
- **THEN** `@updateURL` SHALL point to the raw `master` userscript
- **AND** `@downloadURL` SHALL point to the same canonical userscript.

### Requirement: Live Preview remains reverted

The version correction MUST NOT restore Live Preview behavior.

#### Scenario: v1.8.1 source

- **WHEN** the corrected release is inspected
- **THEN** Live Preview UI and runtime symbols SHALL remain absent
- **AND** the existing Libre Markdown editor and Cornell UX SHALL remain unchanged.

### Requirement: Select the panel's expanded layout
Markdown Notes SHALL allow selecting **Lateral**, **Abajo**, or **Flotante**
while the notes panel is open, without replacing the current draft.

#### Scenario: Switch from side to bottom
- **GIVEN** the notes panel is open with an unsaved Markdown draft
- **WHEN** the user selects Abajo
- **THEN** the panel SHALL occupy the bottom of the viewport
- **AND** the draft and selection of note SHALL remain intact.

#### Scenario: Switch to floating
- **WHEN** the user selects Flotante
- **THEN** the panel SHALL become a movable window with its own geometry.

#### Scenario: Existing installation
- **GIVEN** the user has never selected a layout
- **WHEN** Markdown Notes starts
- **THEN** it SHALL default to the existing Lateral layout.

### Requirement: Resizable bottom dock
The expanded bottom layout SHALL occupy a bounded portion of the viewport,
and its top edge SHALL allow users to resize the height.

#### Scenario: Resize bottom dock
- **WHEN** the user drags the top resize handle
- **THEN** the panel's height SHALL change within available viewport limits
- **AND** the new height SHALL be remembered.

### Requirement: Movable and resizable floating panel
The expanded floating layout SHALL support pointer dragging via a dedicated
handle and bounded resizing, without stealing editor text gestures.

#### Scenario: Drag floating window
- **WHEN** the user drags the floating-window handle
- **THEN** the panel SHALL move within viewport margins
- **AND** the position SHALL persist.

#### Scenario: Resize floating window
- **WHEN** the user drags the bottom-right resize handle
- **THEN** the width and height SHALL be adjusted while remaining usable.

#### Scenario: Prevent drag from editor interactions
- **WHEN** the user selects text or interacts with an input/button
- **THEN** the window SHALL NOT move.

### Requirement: Restore safe geometry
Layout, size and floating position SHALL persist across page reload and
navigation, and SHALL be clamped when the viewport changes.

#### Scenario: Reopen panel
- **GIVEN** the panel was closed in floating layout
- **WHEN** the user reopens it
- **THEN** its last layout and bounded geometry SHALL be restored.

#### Scenario: Viewport becomes smaller
- **WHEN** the viewport shrinks
- **THEN** the panel SHALL remain reachable and within the screen
- **AND** existing note content SHALL not be changed.

### Requirement: Preserve app content and hosting platform behavior
Position changes SHALL not affect drafts, files, Cornell mode or library
and SHALL avoid permanently obscuring important host content.

#### Scenario: ChatGPT bottom dock
- **WHEN** Abajo is active on a supported desktop ChatGPT viewport
- **THEN** the known workspace SHALL reserve bottom space for the panel.

#### Scenario: Udemy floating panel
- **WHEN** Flotante is selected during a Udemy lecture
- **THEN** the window SHALL be movable away from relevant player controls
- **AND** it SHALL NOT manipulate video playback.
