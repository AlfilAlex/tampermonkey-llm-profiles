# Markdown Notes — Delta Specification

## MODIFIED Requirements

### Requirement: Conversation title identity

Markdown Notes MUST distinguish a real detected ChatGPT conversation title from navigation/accessibility UI text.

#### Scenario: Same-document skip link exists

- GIVEN the active page contains an anchor such as `href="#main"`
- AND resolving that anchor produces the same pathname as the active conversation
- WHEN Markdown Notes searches for the active conversation link
- THEN that fragment link SHALL NOT be considered a conversation-title source.

#### Scenario: Accessibility navigation text is encountered

- GIVEN a title candidate is `Saltar al contenido`, `Skip to content`, or equivalent configured generic navigation text
- WHEN title candidates are evaluated
- THEN that text SHALL be rejected as a conversation title.

#### Scenario: Legacy false title is persisted

- GIVEN an existing draft persisted generic accessibility/navigation text as `noteTitle`
- WHEN the draft is loaded
- THEN Markdown Notes SHALL treat the title as unresolved
- AND SHALL remain able to adopt a real title later
- AND automatic filename resolution SHALL be allowed to use the generated fallback while no real title exists.
