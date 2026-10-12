'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const script = readFileSync(
  path.join(__dirname, '..', 'chatgpt-markdown-notes.user.js'),
  'utf8'
);

// Load the actual userscript functions; avoid a separate copy of the algorithm.
function extract(name) {
  const start = script.indexOf('  function ' + name + '(');
  assert.ok(start >= 0, 'Missing function: ' + name);
  const end = script.indexOf('\n  function ', start + 10);
  assert.ok(end > start, 'Missing end of function: ' + name);
  return script.slice(start, end);
}

const names = [
  'createCornellBlock',
  'normalizeCornellState',
  'findCornellStructure',
  'parseCornellBody',
  'analyzeCornellCompatibility',
  'insertCornellCuePreservingWhitespace'
];
const runtime = vm.runInNewContext(
  names.map(extract).join('\n') +
    '\n({insertCornellCuePreservingWhitespace,parseCornellBody})',
  { crypto: { randomUUID: () => 'test-block-id' } }
);
const insert = runtime.insertCornellCuePreservingWhitespace;
const parse = runtime.parseCornellBody;

const original = '## Cornell Notes\n\n### Cue: antiguo\n\n' +
  'Primera línea\n\n\nSegunda línea\n    sangría\n\n' +
  '## Summary\n\nResumen\n\n\nFinal';
const summary = '## Summary\n\nResumen\n\n\nFinal';

test('preserves original note and summary without collapsing blank lines', () => {
  const updated = insert(original);
  const splitIndex = original.indexOf(summary);
  assert.ok(updated.body.startsWith(original.slice(0, splitIndex)));
  assert.ok(updated.body.endsWith(original.slice(splitIndex)));
  assert.ok(updated.body.includes('Primera línea\n\n\nSegunda línea'));
  assert.ok(updated.body.includes('Resumen\n\n\nFinal'));
  assert.equal(parse(updated.body).blocks.length, 2);
});

test('focus selection identifies only the newly inserted placeholder', () => {
  const before = '## Cornell Notes\n\n### Cue: Pregunta o concepto\n\n' +
    'Old notes\n\n## Summary\n\nSummary';
  const result = insert(before);
  assert.equal(result.body.slice(result.selectionStart, result.selectionEnd), 'Pregunta o concepto');
  assert.equal(result.body.split('### Cue: Pregunta o concepto').length - 1, 2);
  assert.ok(result.selectionStart > before.indexOf('### Cue: Pregunta o concepto'));
  assert.equal(parse(result.body).blocks.length, 2);
});

test('keeps CRLF in an existing Cornell document', () => {
  const before = '## Cornell Notes\r\n\r\n### Cue: antiguo\r\n\r\n' +
    'ABC\r\n\r\n\r\n## Summary\r\n\r\nResumen\r\n';
  const next = insert(before);
  assert.ok(next.body.includes('ABC\r\n\r\n\r\n'));
  assert.ok(next.body.endsWith('## Summary\r\n\r\nResumen\r\n'));
  assert.ok(next.body.includes('### Cue: Pregunta o concepto\r\n\r\n'));
  assert.equal(parse(next.body).blocks.length, 2);
});

test('wraps freeform Markdown while preserving its full content verbatim', () => {
  const freeform = 'Introducción\n\n\n  indentación\n\n## Detalles\n\n- uno\n';
  const next = insert(freeform);
  assert.ok(next.body.includes(freeform));
  assert.ok(next.body.startsWith('## Cornell Notes\n'));
  assert.ok(next.body.endsWith('## Summary'));
  assert.equal(parse(next.body).blocks.length, 2);
});

test('does not confuse a Summary heading inside fenced code with the real Summary', () => {
  const before = '## Cornell Notes\n\n### Cue: old\n\n' +
    '~~~md\n## Summary\n~~~\n\n## Summary\n\nActual summary';
  const next = insert(before);
  assert.ok(next.body.includes('~~~md\n## Summary\n~~~'));
  assert.ok(next.body.endsWith('## Summary\n\nActual summary'));
  assert.equal(parse(next.body).blocks.length, 2);
});

test('new Cue selection prevents focus-induced page scrolling', () => {
  assert.match(script, /editor\.focus\(\{\s*preventScroll:\s*true\s*\}\)/);
  const handlerStart = script.indexOf('  function addCornellCueFromLibre()');
  const handlerEnd = script.indexOf('  function goToCornellSummaryFromLibre()', handlerStart);
  const handler = script.slice(handlerStart, handlerEnd);
  assert.match(handler, /insertCornellCuePreservingWhitespace/);
  assert.doesNotMatch(handler, /serializeCornellBody/);
  assert.match(handler, /persistSemanticCornellEdit/);
});
