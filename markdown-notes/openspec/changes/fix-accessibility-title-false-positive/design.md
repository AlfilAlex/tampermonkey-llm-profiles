# Design

## Root Cause

`titleFromSidebarLink()` currently accepts any anchor whose resolved URL pathname equals the active pathname. A fragment-only link such as `#main` inherits the current pathname, so pathname equality alone is insufficient.

## Fix

1. Require a real conversation ID before using sidebar-link title detection.
2. Reject candidate anchors whose resolved URL contains a hash fragment.
3. Keep pathname equality for actual conversation links.
4. Extend generic-title filtering with skip-navigation labels in Spanish and English.
5. During state normalization, reject any stored title that is generic, not only the historical `Nota de ChatGPT` fallback.

This keeps the generated filename fallback reachable whenever no real title is available.
