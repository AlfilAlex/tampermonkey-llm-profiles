'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const script = fs.readFileSync(
  path.join(__dirname, '..', 'chatgpt-markdown-notes.user.js'), 'utf8'
);

// Read the actual pure functions, not a separately maintained test algorithm.
function getFunction(name) {
  const start = script.indexOf('  function ' + name + '(');
  assert.ok(start !== -1, 'Missing function: ' + name);
  const following = script.slice(start + 20);
  const next = following.search(/\n  (?:async\s+)?function \w+\(/);
  assert.ok(next !== -1, 'Cannot locate end of: ' + name);
  return script.slice(start, start + 20 + next);
}
const constants = [
  'DEFAULT_BOTTOM_HEIGHT', 'DEFAULT_FLOAT_WIDTH',
  'DEFAULT_FLOAT_HEIGHT', 'PANEL_MARGIN'
].map(name => {
  const match = script.match(new RegExp('  const ' + name + ' = ([0-9]+);'));
  assert.ok(match, 'Missing constant: ' + name);
  return 'const ' + name + ' = ' + match[1] + ';';
}).join('\n');
const fns = [
  'normalizedPanelLayout', 'boundedPanelNumber',
  'clampBottomPanelHeight', 'clampFloatingPanelRect'
];
const api = vm.runInNewContext(
  constants + '\n' + fns.map(getFunction).join('\n') +
  '\n({normalizedPanelLayout,clampBottomPanelHeight,clampFloatingPanelRect})'
);

test('defaults to side layout and rejects invalid localStorage values', () => {
  assert.equal(api.normalizedPanelLayout(null), 'side');
  assert.equal(api.normalizedPanelLayout('invalid'), 'side');
  for (const mode of ['side','bottom','floating']) {
    assert.equal(api.normalizedPanelLayout(mode), mode);
  }
});

test('bottom height remains within usable viewport', () => {
  assert.equal(api.clampBottomPanelHeight(390, 900), 390);
  assert.equal(api.clampBottomPanelHeight(9000, 900), 800);
  assert.equal(api.clampBottomPanelHeight(10, 900), 380);
  assert.equal(api.clampBottomPanelHeight('bad', 900), 390);
});

test('floating panel is clamped after resizing viewport', () => {
  const r = api.clampFloatingPanelRect(
    {left: 950,top: 700,width: 700,height: 600}, 1280, 800
  );
  assert.ok(r.left >= 8 && r.left + r.width <= 1272);
  assert.ok(r.top >= 8 && r.top + r.height <= 792);
});

test('floating geometry remains usable after corrupted preferences', () => {
  const r = api.clampFloatingPanelRect(
    {left: NaN,top: Infinity,width: -4,height: 'bad'}, 1200, 800
  );
  assert.equal(r.width, 520);
  assert.equal(r.height, 580);
  assert.ok(r.left >= 8 && r.top >= 8);
});

test('mode switching does not touch active notes and is persisted', () => {
  const begin = script.indexOf('  function setPanelLayout(');
  const end = script.indexOf('  function restorePanelLayout(', begin);
  const body = script.slice(begin, end);
  assert.match(body, /localStorage\.setItem\(PANEL_LAYOUT_KEY/);
  assert.doesNotMatch(body, /activeState|DRAFT_STORE|saveFile|renderAll/);
});

test('layout controls and floating handle are accessible in the panel', () => {
  assert.match(script, /class="tmn-layout-select" aria-label="Posición del panel"/);
  assert.match(script, /<option value="side">Lateral/);
  assert.match(script, /<option value="bottom">Abajo/);
  assert.match(script, /<option value="floating">Flotante/);
  assert.match(script, /class="tmn-float-drag" type="button"/);
  assert.match(script, /function moveFloatingWithKeyboard/);
});

test('CSS reserves space only for docked ChatGPT layout', () => {
  assert.match(script, /data-tmn-notes-layout="side"/);
  assert.match(script, /data-tmn-notes-layout="bottom"/);
  assert.match(script, /data-tmn-notes-layout="floating"/);
  assert.match(script, /padding-bottom: calc\(var\(--tmn-bottom-height\)/);
  assert.match(script, /function startResize\(event\)/);
  assert.match(script, /function startFloatingDrag\(event\)/);
});
