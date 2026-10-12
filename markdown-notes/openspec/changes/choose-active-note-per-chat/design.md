# Design

- Each conversation still has a single draft in IndexedDB. Add nullable sharedFilename, sharedDirectoryId, sharedFileSnapshot.
- Creating a new note resets those fields only after user confirmation if the current draft contains unsaved changes.
- Adopting an existing note reads the current local file, extracts its body without destroying YAML and any generated title heading, switches the existing Libre/Cornell editor to that body, and stores the full file as a baseline snapshot.
- Saves to an adopted file preserve its existing header and original chat identity. The body is replaced in place; no duplicate file.
- Before any filesystem write, compare the current file to the baseline snapshot and reject if it changed elsewhere. Retain local unsaved draft upon conflict.
- A new, unrelated file with a colliding filename must not be silently overwritten.
- Persist active document selection on temporary chats and migrate it on transition to /c/<id>. Write portable linked-chat metadata only when a permanent chat URL exists and a user-authorized write is possible.
- Browser/file permissions, missing files, and the Cornell conversion path require manual validation.
