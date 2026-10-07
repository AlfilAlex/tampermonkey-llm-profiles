# Design: local Markdown library and conversation links

## Context
The userscript (currently v1.8.1) stores one editable draft per chat in IndexedDB and saves Markdown into a user-authorized directory. `buildMarkdown()` already emits `chat_id` and `chat_url`, but derives them from the active URL at write time. Directory handles live in IndexedDB; the single-editor note mode supports Libre/Cornell/Repaso. This change must not replace that draft or break these modes.

## Data model
- Authored draft: add nullable `originChatId` and `originChatUrl`. Set on first filesystem save and preserve afterward. Legacy stored drafts derive their origin from existing chat key only when that draft had already been saved.
- Markdown front matter: keep existing `chat_id` and `chat_url` as the origin fields for backward compatibility. Add optional `linked_chat_urls` as a YAML sequence of validated ChatGPT conversation URLs. Do not overwrite existing front matter fields.
- IndexedDB: add a new `chat-links` store, keyed by `chat:<id>` and containing distinct filenames in the current authorized directory. Persist after a successful explicit link/unlink metadata write. Store no filesystem absolute paths.
- The directory is a single flat collection. Linked files are identified by filename within the current selected directory. Reset the displayed link index when the selected directory changes; do not delete old indexes automatically.

## User flow
1. Open the notes panel and click **Biblioteca**.
2. Enumerate `.md` files from `directoryHandle.values()`. Request read permission when necessary through a direct user gesture; do not traverse subdirectories.
3. Choose a file for **Vista previa**. Read its current bytes via `getFileHandle(...).getFile().text()`. Render as text using `textContent` (not `innerHTML`) and display the validated original chat URL.
4. Click **Vincular a este chat**. Require a permanent chat ID and write permission. Re-read the file immediately before writing, change only `linked_chat_urls`, write atomically where supported, and persist the filename to the per-chat link index only after file write succeeds.
5. Click **Desvincular** to remove only the active chat URL from metadata and the local index. Never delete the file.
6. Switching chats or reloading restores each chat's linked filenames. Missing/unreadable files remain visible as unavailable until manually unlinked.

## Security and compatibility
- File preview uses inert DOM nodes / `textContent`, never injecting saved Markdown/HTML into the ChatGPT page as executable markup.
- Only validated `https://chatgpt.com/c/<id>` URLs may be rendered as clickable conversation links. Do not navigate to arbitrary URLs contained in Markdown.
- No external network calls, remote sync, automatic attachment upload, or arbitrary path access.
- Handle browser permission denial and `NotFoundError` without modifying drafts.
- Gracefully handle existing `.md` files without front matter; do not infer nonexistent origin.
- Save/restore per-chat links in IndexedDB; on demand reconcile the current library's `linked_chat_urls` for portability (explicit refresh).
- Avoid overwriting a changed body: read the existing file fresh before any metadata update and preserve its remainder byte-for-byte apart from intentional front matter insertion/update.

## Validation
- Static JS parsing (equivalent to a syntax check), pure metadata parser tests, and manual browser tests.
- Manual tests: origin immutability, Libre/Cornell preservation, link/unlink/reload, legacy/no-front-matter imports, directory permission denied, missing and externally edited files.
