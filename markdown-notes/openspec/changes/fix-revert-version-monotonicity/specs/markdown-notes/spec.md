# Markdown Notes — Delta Specification

## ADDED Requirements

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
