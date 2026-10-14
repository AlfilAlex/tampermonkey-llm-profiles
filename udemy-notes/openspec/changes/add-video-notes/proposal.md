# Proposal: Udemy Markdown Notes, one active note per video

## Why

The existing ChatGPT Markdown Notes userscript is tied to ChatGPT conversations,
but the note-taking workflow is useful while studying Udemy lectures. The
requested unit of organization is **each course video/lecture**, explicitly
**without playback timestamps**.

## What Changes

- Introduce `udemy-notes/` as a standalone project with its own OpenSpec.
- Create a dedicated userscript for Udemy's desktop browser course player.
- Associate a locally persisted Markdown draft with each video using a stable
  course + lecture identity, not only a potentially duplicated lecture title.
- When viewing a video, provide two actions:
  - **Crear nuevo**: start a Markdown document for this lecture;
  - **Elegir existente**: browse the explicitly chosen local folder and adopt a
    previously created `.md` file as the lecture's editable document.
- Offer a separate read-only preview before adopting any existing document.
- Reuse the existing concepts (Libre/Cornell, file selection, persistent drafts,
  a resizeable notes panel, explicit file saves) without coupling runtimes.
- Store source/course/lecture provenance in YAML front matter; preserve any
  previous ChatGPT or Udemy origin metadata when reusing a file.
- When multiple videos adopt one file, each may edit the same file, with
  stale-content protection.
- Detect navigation between Udemy videos and restore the correct draft.

## Explicit Non-Goals

- No notes tied to video timestamps, seeking, or automatic position capture.
- No transcription, screenshots, extraction or downloading course videos.
- No synchronization to Udemy's built-in Notes feature or remote accounts.
- No automatic uploads/attachments to ChatGPT or other services.
- No support commitment for mobile apps or Udemy Business until tested.

## Capabilities

### New Capabilities
- `lecture-notes`: per-video Markdown notes, local library and safe file reuse.

### Modified Capabilities
None. This is an independent OpenSpec project, not a modification of ChatGPT Markdown Notes.

## Impact

- New directory `udemy-notes/` only; existing scripts are not modified.
- Planned new browser storage namespace specific to `www.udemy.com`.
- No server-side integration or network calls.
- Compatibility with older `.md` files through explicit adoption, preserving
  unknown YAML metadata and document bodies.

## Known Uncertainties

- Current Udemy player URL format and DOM selectors must be verified in a real
  logged-in lecture session; selectors must not be assumed from public docs.
- File System Access permission persistence must be tested in the intended browser.
- In early builds, unsupported/non-video lessons must not be silently mixed
  with lecture-video notes.
