'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'chatgpt-markdown-notes.user.js'), 'utf8'
);
const extract = name => {
  const start = source.indexOf('  function ' + name + '(');
  assert.ok(start >= 0, 'Missing function: ' + name);
  const tail = source.slice(start + 20);
  const next = tail.search(/\n  (?:async )?function \w+\(/);
  assert.ok(next >= 0, 'Cannot delimit function: ' + name);
  return source.slice(start, start + 20 + next);
};
const names = [
  'getUdemyLectureInfo',
  'validUdemyLectureUrl',
  'validChatUrl',
  'yamlString',
  'parseMarkdownMetadata',
  'withLinkedUdemyUrl'
];
const ctx = vm.createContext({ URL });
const api = vm.runInContext(
  names.map(extract).join('\n') +
    '\n({getUdemyLectureInfo, validUdemyLectureUrl, parseMarkdownMetadata, withLinkedUdemyUrl})',
  ctx
);

const urlA = 'https://www.udemy.com/course/redes-aws/learn/lecture/10001#overview';
const urlB = 'https://www.udemy.com/course/redes-aws/learn/lecture/10002';
const urlC = 'https://www.udemy.com/course/otra-materia/learn/lecture/10001';
const base = [
  '---',
  'title: "Networking"',
  'source: "ChatGPT"',
  'chat_id: "original"',
  'chat_url: "https://chatgpt.com/c/original"',
  '---',
  '',
  '# Networking',
  '',
  'Original text',
  ''
].join('\n');

test('separate videos in one course and identical video IDs in other courses', () => {
  const a = api.getUdemyLectureInfo(urlA);
  const b = api.getUdemyLectureInfo(urlB);
  const c = api.getUdemyLectureInfo(urlC);
  assert.ok(a && b && c);
  assert.notEqual(a.key, b.key);
  assert.notEqual(a.key, c.key);
  assert.equal(a.lectureId, '10001');
  assert.equal(a.courseSlug, 'redes-aws');
  assert.equal(a.url, urlA.replace('#overview', ''));
});

test('reject unrelated pages, unrecognized lessons and third-party hosts', () => {
  assert.equal(api.getUdemyLectureInfo('https://www.udemy.com/course/redes-aws/'), null);
  assert.equal(api.getUdemyLectureInfo('https://www.udemy.com/course/redes-aws/learn/quiz/10001'), null);
  assert.equal(api.getUdemyLectureInfo('https://evil.udemy.com/course/redes-aws/learn/lecture/10001'), null);
  assert.equal(api.getUdemyLectureInfo('https://www.udemy.com/course/redes-aws/learn/lecture/no-id'), null);
});

test('associating a lecture preserves earlier ChatGPT provenance and body', () => {
  const linked = api.withLinkedUdemyUrl(base, urlA, true);
  const parsed = api.parseMarkdownMetadata(linked);
  assert.equal(parsed.originChatId, 'original');
  assert.equal(parsed.originChatUrl, 'https://chatgpt.com/c/original');
  assert.deepEqual(Array.from(parsed.linkedUdemyUrls), [api.validUdemyLectureUrl(urlA)]);
  assert.ok(linked.endsWith('# Networking\n\nOriginal text\n'));
});

test('linking twice is idempotent, other lectures are independent', () => {
  const once = api.withLinkedUdemyUrl(base, urlA, true);
  const twice = api.withLinkedUdemyUrl(once, urlA, true);
  assert.equal(api.parseMarkdownMetadata(twice).linkedUdemyUrls.length, 1);
  const both = api.withLinkedUdemyUrl(twice, urlB, true);
  assert.equal(api.parseMarkdownMetadata(both).linkedUdemyUrls.length, 2);
  const remaining = api.withLinkedUdemyUrl(both, urlA, false);
  assert.deepEqual(Array.from(api.parseMarkdownMetadata(remaining).linkedUdemyUrls), [urlB]);
  assert.ok(remaining.endsWith('# Networking\n\nOriginal text\n'));
});

test('plain Markdown gets minimal portable metadata without altering its body', () => {
  const plain = '# Notes\n\n    indented\n\n';
  const linked = api.withLinkedUdemyUrl(plain, urlA, true);
  assert.ok(linked.endsWith(plain));
  assert.equal(api.parseMarkdownMetadata(linked).originUdemyUrl, null);
});

test('no timestamp or playback seeking is introduced', () => {
  assert.match(source, /@match\s+https:\/\/www\.udemy\.com\/\*/);
  assert.doesNotMatch(source, /linked_udemy_timestamps|udemy_playback_seconds|video\.currentTime\s*=/);
});
