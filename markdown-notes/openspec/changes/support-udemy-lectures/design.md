# Design: platform adapter in the existing Markdown Notes userscript

## Integration boundary

The one source file remains `markdown-notes/chatgpt-markdown-notes.user.js`.
Retain the current Tampermonkey `@name`, namespace, update URL, and all
ChatGPT selectors. `IS_UDEMY` switches only the identity/metadata-specific
paths; shared note editor, Cornell, file picker and library are unchanged.

## Per-video identity

For `www.udemy.com`, `getUdemyLectureInfo()` extracts a stable course slug
and numeric lecture ID from URL paths of the form
`/course/<slug>/learn/lecture/<id>`, discards fragments and query strings,
and constructs a key `udemy:course:<slug>:lecture:<id>`. Treat any other
path as unsupported; no fallback to title, random ID or media timestamp.

Navigation is checked through the existing SPA URL poll (700 ms), and each
lecture key maps to its own draft. Title detection does not identify videos;
the panel exposes slug and ID until actual Udemy title selectors are verified.

## Browser state

The existing IndexedDB database and stores are reused **within each origin**;
same-origin isolation means ChatGPT state and Udemy state do not overlap.
The selected local directory handle requires a separate browser authorization
on Udemy, even when it points to the same folder used in ChatGPT.

## YAML and linking

For new Udemy files, `source: Udemy` and
`udemy_lecture_url`, `udemy_course_slug`, `udemy_lecture_id`
record provenance. ChatGPT-origin fields remain null for new Udemy files.
For existing files, preserve original front matter, and add or remove canonical
video URLs in the `linked_udemy_lectures` YAML list without rewriting the body.

The library preview remains inert `textContent` and supports links back
to ChatGPT or Udemy origins when present. A shared file uses its full snapshot
to detect external writes, including edits from another Udemy lecture.

## DOM and layout

Reuse the fixed, resizable panel and close/reopen controls. ChatGPT-specific
workspace reservation selectors remain confined to ChatGPT DOM elements;
on Udemy the panel is an overlay. **Video-control accessibility on real Udemy
player layouts remains unverified** and must be checked before calling the
layout non-obstructive.

## Validation and safety

- No media/video API read or seek, no transcripts and no remote API calls.
- Test URL identity uniqueness and invalid paths, metadata preserving original
  ChatGPT provenance, deduplication, and unchanged Markdown body.
- Test a real logged-in Udemy course on desktop Chrome/Edge with Tampermonkey;
  verify video navigation, save permissions, layout, Cornell, and conflicts.
