# Proposal

## Why

PR #15 released Markdown Notes as v1.8.0. The subsequent revert restored the source code to the pre-Live-Preview implementation but also restored the metadata version to v1.7.0.

Tampermonkey update checks compare `@version`. An installation that already has v1.8.0 can therefore treat the reverted v1.7.0 source as older and keep running the unwanted Live Preview build.

## What Changes

- Publish the reverted implementation as v1.8.1 so the version remains monotonic.
- Keep the code behavior identical to the current post-revert v1.7.0 source: no Live Preview.
- Add explicit `@updateURL` and `@downloadURL` metadata pointing to the raw `master` userscript.
- Update README version to v1.8.1.

## Compatibility

- No IndexedDB/localStorage migration.
- No filesystem behavior change.
- No note content change.
- Existing v1.8.0 installations can update to v1.8.1 instead of remaining stuck on Live Preview.
- Existing installations that were added by copy/paste may still require one manual reinstall/update before the new metadata can govern future updates.

## Version

Markdown Notes becomes v1.8.1.
