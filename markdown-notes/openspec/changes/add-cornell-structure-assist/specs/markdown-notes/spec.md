# Markdown Notes — Delta Specification

## MODIFIED Requirements

### Requirement: Per-conversation note mode

Markdown Notes MUST make the transition from arbitrary Libre Markdown to Cornell explicit and non-destructive.

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
- **THEN** Markdown Notes SHALL append a new Cornell block before Summary
- **AND** SHALL serialize a semantic `### Cue: ...` heading
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
