# Proposal

## Why

Markdown Notes could persist the visual fallback `Nota de ChatGPT` as if it were the real conversation title when ChatGPT had not exposed the title yet. That also produced a generic filesystem identity. A later DOM re-render could make the UI alternate between the detected title-derived filename and the previously persisted provisional filename.

## What Changes

- Treat the generic UI label as an unresolved title, never as an authoritative conversation title.
- Improve title extraction from the active ChatGPT conversation link.
- Adopt and persist a real title as soon as it is detected, rather than only when the user presses Save.
- Use a chat-specific provisional filename only while the title is unresolved.
- Replace a provisional filename with the title-derived filename once a real title has been adopted.
- Treat legacy `Nota de ChatGPT` state from v1.2.0 as unresolved.
- Bump Markdown Notes to v1.2.1.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `markdown-notes`: conversation-title detection and file identity now distinguish transient fallback state from authoritative title state.

## Impact

- Source: `markdown-notes/chatgpt-markdown-notes.user.js`.
- IndexedDB schema version remains unchanged.
- Existing draft bodies remain compatible.
- Existing stored fallback titles are repaired logically on load.
- Existing provisional filenames may be superseded by a title-derived filename after the real title becomes available.
- File System Access permissions and directory-handle storage are unchanged.
