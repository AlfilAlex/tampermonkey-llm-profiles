'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'chatgpt-markdown-notes.user.js'),
  'utf8'
);
const start = source.indexOf('  function splitSavedMarkdownDocument(');
const end = source.indexOf('  function hasUnsavedDraftToReplace()', start);
assert.ok(start > 0 && end > start, 'Expected Markdown helpers in userscript');
const helpers = source.slice(start, end);
const api = vm.runInNewContext(
  helpers + '({splitSavedMarkdownDocument,updateSavedMarkdownBody,assertSharedFileRevision})'
);

const document = [
  '---',
  'title: "Networking"',
  'chat_id: "origin-A"',
  'chat_url: "https://chatgpt.com/c/origin-A"',
  'custom_tag: "preserve-me"',
  '---',
  '',
  '# Networking',
  '',
  '## Section',
  'Initial text.',
  ''
].join('\n');

test('load a generated document without duplicating its title in the editor', () => {
  assert.equal(
    api.splitSavedMarkdownDocument(document).body,
    '## Section\nInitial text.'
  );
});

test('save modifies the body while preserving original origin and unknown metadata', () => {
  const next = api.updateSavedMarkdownBody(document, '## Section\nEdited in chat B');
  assert.ok(next.includes('chat_id: "origin-A"'));
  assert.ok(next.includes('chat_url: "https://chatgpt.com/c/origin-A"'));
  assert.ok(next.includes('custom_tag: "preserve-me"'));
  assert.ok(next.endsWith('# Networking\n\n## Section\nEdited in chat B\n'));
});

test('preserve plain Markdown without inventing an origin', () => {
  const next = api.updateSavedMarkdownBody('# Existing\n\nHello\n', 'New content');
  assert.equal(next, 'New content\n');
});

test('reject stale writes while accepting the unchanged original version', () => {
  assert.doesNotThrow(() => api.assertSharedFileRevision(document, document));
  assert.throws(
    () => api.assertSharedFileRevision(document + 'remote change', document),
    /Conflicto/
  );
});

test('preserve Cornell body syntax for the existing parser', () => {
  const body = '## Preguntas y notas\n\n### Pregunta\nDefinición\n\n## Resumen\nSíntesis';
  const next = api.updateSavedMarkdownBody(document, body);
  assert.ok(next.endsWith(body + '\n'));
});
