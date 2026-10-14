# Manual QA: Markdown Notes in Udemy (v1.11.0)

This is **one userscript**, not a separate Udemy plugin. It uses the same
Tampermonkey `@name` and `@namespace` as the ChatGPT installation.

## Preconditions

Open desktop Chrome/Edge with Tampermonkey and access to a Udemy course.
Use a test Markdown folder containing only replaceable files.

## Steps

1. Open a course video with a URL containing
   `/course/<slug>/learn/lecture/<numeric-id>`. Confirm the panel shows the
   course slug and video ID. On a course landing page or quiz, saving must
   refuse an unidentified video.
2. Select **Crear nuevo**, name a note and edit it. Save and inspect the YAML:
   `source: Udemy`, course slug, lecture ID and URL, with no playback time.
3. Navigate to a second video in the same course, create a different draft,
   then return. Confirm both videos retain independent drafts.
4. Choose **Elegir existente** and adopt an older `.md` file. Preview alone
   must not modify the editor. Adoption may add a
   `linked_udemy_lectures` entry; the document body and original chat
   attribution must remain intact.
5. Edit and save the adopted note from two video pages in sequence. An
   outdated version must fail rather than silently overwrite a newer write.
6. Test Cornell cues, rendering, and persistence. Confirm the video does not
   seek or pause as a side effect of note creation or save.
7. Check that the fixed panel does not make Udemy video controls unusable on
   the intended desktop width, and can be closed or resized.
8. On ChatGPT, verify conversation draft restoration and normal saving did
   not regress. Select the directory independently on each domain.

## Local checks (repo root, Node.js installed)

```bash
node --check markdown-notes/chatgpt-markdown-notes.user.js
node --test markdown-notes/tests/udemy-lecture-adapter.test.cjs
```

Both commands only observe syntax and logic; they do not modify files.
Passing unit tests does not establish that the live Udemy player DOM has
been verified.
