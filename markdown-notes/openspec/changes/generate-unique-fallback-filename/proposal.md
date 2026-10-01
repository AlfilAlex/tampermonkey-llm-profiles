# Proposal

## Why

Markdown Notes can resolve the filename from the ChatGPT conversation title, but when no usable title is available the current automatic fallback is derived from the ChatGPT conversation ID or a timestamp seed. That still exposes an implementation identifier as the visible filename and can leave users with names that do not communicate that they are generated fallbacks.

The fallback should be unique, non-hardcoded, and stable for the draft without depending on the ChatGPT conversation ID.

## What Changes

- Preserve filename precedence:
  1. explicit manual filename;
  2. real detected/adopted conversation title;
  3. generated fallback.
- Remove the ChatGPT conversation ID as an automatic filename fallback.
- Generate the fallback from:
  - a short random UUID component;
  - local date and time including seconds.
- Use the format:
  - `<short-id>_<YYYY-MM-DD_HH-mm-ss>.md`
  - example: `a1b2c3d4_2026-09-30_18-13-42.md`
- Generate the fallback identity once per draft and persist it so rerenders and reloads do not continuously rename the target file.
- Keep manual filename editing unchanged.
- If a real title becomes available later and no manual filename exists, automatic naming may switch from the generated fallback to the title-derived filename.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `markdown-notes`: automatic filename fallback generation and persistence.

## Impact

- Source: `markdown-notes/chatgpt-markdown-notes.user.js`.
- The existing IndexedDB object store remains unchanged.
- Draft state gains an optional generated fallback identifier.
- Existing drafts without that identifier generate and persist one only when a generated fallback is actually needed.
- Existing files are never deleted automatically. If the resolved target filename changes, the next save writes the new target and leaves the previous file untouched.
- Conversation title metadata and manual filename behavior remain unchanged.
