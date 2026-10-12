# Tasks

- [x] Implement lossless pure Cue insertion that preserves existing Markdown and CRLF line endings.
- [x] Replace full-document reserialization in the Libre **+ Cue / Pregunta** handler.
- [x] Select the newly inserted placeholder by returned character offsets using focus with `preventScroll`.
- [x] Keep draft persistence and Cornell compatibility.
- [x] Add executable regression tests for whitespace, repeated Cues, fenced Markdown and line endings.
- [x] Validate JavaScript syntax and in-memory regression assertions with the actual parser.
- [ ] Run `node --check` and `node --test markdown-notes/tests/cue-whitespace-scroll.test.cjs` in a Node checkout (network unavailable in the present container).
- [x] Document manual browser checks for page scroll, focus and save/reload.
- [ ] Run manual Chrome/Tampermonkey validation (requires browser session).
