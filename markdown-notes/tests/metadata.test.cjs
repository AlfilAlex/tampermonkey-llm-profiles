'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'chatgpt-markdown-notes.user.js'), 'utf8'
);
const boot = source.lastIndexOf('\n  bootstrap().catch(');
assert.ok(boot > 0, 'Userscript bootstrap marker should exist');

// Evaluate actual userscript helpers, without executing its DOM/browser bootstrap.
const instrumented = source.slice(0, boot) +
  '\n  globalThis.__metadataApi = { validChatUrl, parseMarkdownMetadata, withLinkedChatUrl };\n})();';
const ctx = vm.createContext({ URL, console });
vm.runInContext(instrumented, ctx);
const { validChatUrl, parseMarkdownMetadata, withLinkedChatUrl } = ctx.__metadataApi;

const original = [
  '---',
  'title: "Routing lesson"',
  'created: "2026-10-07T12:00:00-06:00"',
  'chat_id: "origin-A"',
  'chat_url: "https://chatgpt.com/c/origin-A"',
  '---',
  '',
  '# Routing lesson',
  '',
  'Original body.',
  ''
].join('\n');

test('associating another conversation retains the original provenance and note body', () => {
  const next = withLinkedChatUrl(original, 'https://chatgpt.com/c/chat-B', true);
  const meta = parseMarkdownMetadata(next);
  assert.equal(meta.originChatId, 'origin-A');
  assert.equal(meta.originChatUrl, 'https://chatgpt.com/c/origin-A');
  assert.deepEqual(Array.from(meta.linkedChatUrls), ['https://chatgpt.com/c/chat-B']);
  assert.ok(next.endsWith('\n# Routing lesson\n\nOriginal body.\n'));
});

test('linking twice is idempotent and unlinking leaves the document intact', () => {
  const once = withLinkedChatUrl(original, 'https://chatgpt.com/c/chat-B', true);
  const twice = withLinkedChatUrl(once, 'https://chatgpt.com/c/chat-B', true);
  assert.deepEqual(Array.from(parseMarkdownMetadata(twice).linkedChatUrls), [
    'https://chatgpt.com/c/chat-B'
  ]);
  const removed = withLinkedChatUrl(twice, 'https://chatgpt.com/c/chat-B', false);
  assert.equal(parseMarkdownMetadata(removed).linkedChatUrls.length, 0);
  assert.ok(removed.endsWith('\n# Routing lesson\n\nOriginal body.\n'));
});

test('multiple linked conversations are stored without copying the document', () => {
  const both = withLinkedChatUrl(
    withLinkedChatUrl(original, 'https://chatgpt.com/c/chat-B', true),
    'https://chatgpt.com/c/chat-C', true
  );
  assert.deepEqual(Array.from(parseMarkdownMetadata(both).linkedChatUrls), [
    'https://chatgpt.com/c/chat-B',
    'https://chatgpt.com/c/chat-C'
  ]);
});

test('plain markdown gets minimal metadata while its body remains unchanged', () => {
  const plain = '# Legacy note\n\nPlain text.\n';
  const linked = withLinkedChatUrl(plain, 'https://chatgpt.com/c/chat-B', true);
  assert.ok(linked.endsWith(plain));
  assert.equal(parseMarkdownMetadata(linked).originChatUrl, null);
});

test('unsafe or unrelated websites are not exposed as chat links', () => {
  assert.equal(validChatUrl('javascript:alert(1)'), null);
  assert.equal(validChatUrl('https://example.com/c/chat-B'), null);
  assert.equal(validChatUrl('https://chatgpt.com.evil.test/c/chat-B'), null);
});
