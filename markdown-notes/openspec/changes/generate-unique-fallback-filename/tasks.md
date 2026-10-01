# Tasks

## Design

- [x] Define filename precedence.
- [x] Remove chat ID from fallback naming.
- [x] Define short UUID plus local date/time format.
- [x] Define stable persistence semantics.
- [x] Define migration behavior for drafts with legacy fallback timestamp state.

## Implementation

- [ ] Add persisted short fallback identifier to normalized draft state.
- [ ] Generate short fallback ID using browser crypto APIs with compatibility fallback.
- [ ] Generate ID and timestamp together only when fallback naming is required.
- [ ] Replace chat-ID/timestamp-only automatic fallback with short-ID plus timestamp.
- [ ] Preserve title-derived and manual filename precedence.
- [ ] Preserve existing filesystem save semantics.
- [ ] Update README and userscript semantic version.

## Validation

- [ ] Parse the modified userscript successfully.
- [ ] Verify fallback format matches `<8 hex>_<YYYY-MM-DD_HH-mm-ss>.md`.
- [ ] Verify rerender/reload reuses the generated identity.
- [ ] Verify a real title supersedes the generated fallback when no manual override exists.
- [ ] Verify manual filename remains highest priority.
- [ ] Verify existing drafts without the new ID can migrate without losing note content.
- [ ] Verify filesystem write failure leaves browser draft state intact.
