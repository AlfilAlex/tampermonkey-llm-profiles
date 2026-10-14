# Proposal: Extend the same Markdown Notes userscript to Udemy videos

## Why

Markdown Notes already provides the editor, Cornell view, IndexedDB drafts,
local Markdown files and reusable document library in ChatGPT. Reimplementing
these features as a separate Udemy userscript would duplicate code and make
maintenance harder. The desired behavior is **one Markdown Notes installation**
on ChatGPT and on Udemy, with one note identity per lecture video and **no
playback timestamps**.

## What Changes

- Extend the existing `chatgpt-markdown-notes.user.js` with a restricted
  `@match` for `https://www.udemy.com/*`; retain the existing `@name`,
  `@namespace`, update URL and legacy ChatGPT behavior for installation
  compatibility.
- Add a platform-specific lecture adapter: identify the course slug and numeric
  lecture ID from a canonical URL shaped
  `/course/<slug>/learn/lecture/<id>`. The identity fails closed when absent.
- Use the existing editor, **Crear nuevo**, **Elegir existente**, Biblioteca,
  Cornell, explicit saves and stale-file conflict checks for Udemy videos.
- Attribute newly authored Markdown documents using
  `source: Udemy`, `udemy_course_slug`, `udemy_lecture_id`, and
  `udemy_lecture_url`. Preserve earlier ChatGPT origins on adopted documents;
  associate reused documents with `linked_udemy_lectures`.
- Keep video and ChatGPT browser drafts distinct using lecture and chat keys.
- Add a small read-only course/video identity label in the notes panel.
- Move the prior standalone Udemy OpenSpec proposal into the existing
  `markdown-notes/openspec/` project; remove `udemy-notes/`.

## Non-Goals

- No timestamps, playback seeking, transcript extraction or downloading course media.
- No Udemy API calls or integration with its native Notes feature.
- No support assertion for Udemy Business or mobile apps.
- No guarantee that an unverified player DOM can be resized safely.

## Impact

- Exactly one userscript and one OpenSpec project for Markdown Notes.
- The browser's same-origin policy still keeps permissions and IndexedDB
  separate across `chatgpt.com` and `www.udemy.com`; users select a
  directory separately on each site if they want to use the same files.
- No storage schema change on either origin and no changes to Prompt Profiles.
- Existing ChatGPT Tampermonkey installation metadata is retained.
- Udemy lecture URL format is a tested pure parser assumption, not a
  browser-verified claim about every live Udemy player.
