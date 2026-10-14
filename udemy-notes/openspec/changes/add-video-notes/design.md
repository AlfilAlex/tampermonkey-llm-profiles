# Design: standalone Udemy lecture notes

## Architecture

A separate `udemy-notes/udemy-markdown-notes.user.js` is planned. Do not
inject ChatGPT-specific selectors or share mutable runtime state. Keep the
proven Markdown draft/library concepts, but build a Udemy-specific adapter
responsible for identifying course, lecture, title, and navigation changes.

## Identity and navigation

Prefer an unambiguous course ID plus lecture ID when available from the page's
public URL/DOM context. Use a canonical lecture URL only when it demonstrably
identifies one lecture reliably. Do not key by title alone. Treat re-render and
history-based navigation as potentially asynchronous; re-check identity before
committing state. When identity cannot be resolved, disable potentially
misassociated saves and display an actionable explanation.

Treat quizzes, exercises and non-video lessons as out of scope for the initial
version. Verify actual URL patterns and player DOM with a real Udemy course
before writing CSS selectors.

## Storage model

Use IndexedDB with a dedicated prefix and per-video keys
(`course:<id>:lecture:<id>`). Persist the editor body, representation,
selected filename, file revision snapshot, and updated timestamp. Store the
File System Access directory handle separately. Metadata should include source,
course/lecture IDs, titles and canonical lecture URL when available.

When an existing Markdown file is adopted, preserve all existing front matter
and unknown fields, and add an explicit `linked_udemy_lectures` association
without replacing original `chat_id`, `chat_url` or Udemy origin fields.

## Browser filesystem and conflict safety

Access only user-selected directories, enumerate `.md` files, preview as
inert text, and write on explicit save/adoption actions. Treat draft saves
and filesystem writes as separate operations. Compare a current read to the
last-read file snapshot before overwriting. Never overwrite an existing
unrelated filename without explicit adoption.

## UI

Create a resizable sidebar optimized for video use with **Crear nuevo**,
**Elegir existente**, Libre/Cornell and **Guardar cambios**. Position it so
video controls remain available. Defer exact dock/reservation selectors to
verified Udemy DOM observations, and provide a safe fallback layout rather
than hardcoding unverified selectors.

## Exclusions

No timestamps, seeking, subtitle/transcript capture, Udemy API calls,
video/media downloads, telemetry or remote note syncing.

## Test plan

Pure unit tests for identity normalization, per-lecture isolation,
YAML round trips, Markdown preservation and file conflict detection.
Browser acceptance tests for SPA lecture transitions, selected folder
permissions, video controls, responsive panel, freeform/Cornell,
persistence and saved-file reuse. The real player DOM must be checked
before describing selectors as verified.
