# Proposal

## Why

Markdown Notes can misclassify ChatGPT accessibility navigation such as `Saltar al contenido` as the conversation title. The current sidebar detector matches anchors by pathname only, so a same-document fragment such as `#main` resolves to the active `/c/<id>` pathname and can be mistaken for the active conversation link.

When this happens, the false title is persisted and the filename becomes `saltar-al-contenido.md`, preventing the generated UUID+timestamp fallback from being used.

## What Changes

- Ignore same-document fragment links during sidebar title detection.
- Treat common skip-navigation labels such as `Saltar al contenido` and `Skip to content` as generic UI chrome, not conversation titles.
- Treat previously persisted generic/UI titles as unresolved during draft normalization.
- Preserve the existing filename priority: manual name > real conversation title > generated UUID+timestamp fallback.

## Impact

- No IndexedDB schema migration is required.
- Existing affected drafts self-repair when loaded.
- Existing physical files are not deleted automatically.
- Markdown Notes version increments to v1.4.2.
