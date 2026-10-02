# Design

## Version rule

Userscript releases MUST NOT lower `@version`, including when reverting a feature.

Current sequence:

- unwanted Live Preview: 1.8.0
- reverted source: currently mislabeled 1.7.0
- corrected reverted release: 1.8.1

## Update metadata

Add:

`@updateURL  https://raw.githubusercontent.com/AlfilAlex/tampermonkey-llm-profiles/master/markdown-notes/chatgpt-markdown-notes.user.js`

`@downloadURL https://raw.githubusercontent.com/AlfilAlex/tampermonkey-llm-profiles/master/markdown-notes/chatgpt-markdown-notes.user.js`

This gives Tampermonkey an explicit canonical update source after v1.8.1 is installed.

## Behavioral scope

No runtime logic changes are required. The resulting userscript must remain behaviorally equal to the post-revert implementation and contain no Live Preview code.
