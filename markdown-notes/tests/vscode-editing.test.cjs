'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');

const source = fs.readFileSync(
  path.join(__dirname,'..','chatgpt-markdown-notes.user.js'),'utf8'
);
function extract(name) {
  const at = source.indexOf('  function ' + name + '(');
  assert.ok(at > 0, 'Expected function '+name);
  const end = source.slice(at+20).search(/\n  (?:async\s+)?function \w+\(/);
  assert.ok(end >= 0, 'Expected next function after '+name);
  return source.slice(at,at+20+end);
}
const functions=['transformOneLine','minimalTextChange','selectionWordAt','findOccurrences'];
const api = vm.runInNewContext(
  functions.map(extract).join('\n') + '\n({transformOneLine,minimalTextChange,selectionWordAt,findOccurrences})'
);
const doEdit=(text,position,action)=>api.transformOneLine(text,position,action);

test('Ctrl+X without selection cuts whole current line including its terminator',()=>{
  const result=doEdit('alpha\nbeta\ngamma',7,'cut');
  assert.equal(result.text,'alpha\ngamma');
  assert.equal(result.cutText,'beta\n');
});
test('Ctrl+X cuts last line, not unrelated preceding characters',()=>{
  assert.equal(doEdit('alpha\nbeta',7,'cut').text,'alpha');
  assert.equal(doEdit('only',2,'cut').text,'');
});
test('Ctrl+Shift+K removes only one line, including on CRLF documents',()=>{
  assert.equal(doEdit('one\r\ntwo\r\nthree',6,'delete').text,'one\r\nthree');
});
test('Alt+Up and Alt+Down swap neighboring lines while keeping line separators',()=>{
  assert.equal(doEdit('one\ntwo\nthree',6,'up').text,'two\none\nthree');
  assert.equal(doEdit('one\r\ntwo\r\nthree',1,'down').text,'two\r\none\r\nthree');
  assert.equal(doEdit('one\ntwo',1,'up').text,'one\ntwo');
});
test('Shift+Alt+Up/Down duplicates a complete line',()=>{
  assert.equal(doEdit('one\ntwo\nthree',5,'duplicateDown').text,'one\ntwo\ntwo\nthree');
  assert.equal(doEdit('one\ntwo',6,'duplicateUp').text,'one\ntwo\ntwo');
  assert.equal(doEdit('one\ntwo',6,'duplicateDown').text,'one\ntwo\ntwo');
});
test('word selection supports accented Unicode letters',()=>{
  const r=api.selectionWordAt('configuración SQL',4);
  assert.equal('configuración SQL'.slice(r.from,r.to),'configuración');
});
test('occurrences are disjoint and limit prevents huge document stalls',()=>{
  const ranges=Array.from(api.findOccurrences('foo foo foo','foo',2));
  assert.equal(ranges.length,2);
  assert.deepEqual(ranges.map(r=>r.from),[0,4]);
});
test('minimal edit updates only changed span, preserving external text',()=>{
  const edit=api.minimalTextChange('alpha\nbeta','alpha\ngamma');
  assert.equal('alpha\nbeta'.slice(0,edit.from)+edit.replacement+'alpha\nbeta'.slice(edit.to),'alpha\ngamma');
});
test('real multi-cursor adapter uses CodeMirror selections and keeps native fallback',()=>{
  assert.match(source,/CodeMirror\.fromTextArea\(textarea/);
  assert.match(source,/doc\.addSelection\(/);
  assert.match(source,/doc\.setSelections\(/);
  assert.match(source,/advancedEditor\.toTextArea\(\)/);
  assert.match(source,/clipboardData\.setData\('text\/plain'/);
  assert.match(source,/Ctrl-D/);
  assert.match(source,/Shift-Ctrl-L/);
});
test('dependency is pinned and user preferences retain old drafts',()=>{
  assert.match(source,/@require\s+https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/codemirror\/5\.65\.21\/codemirror\.min\.js/);
  assert.match(source,/@resource\s+tmnCodeMirrorCss/);
  assert.match(source,/ADVANCED_EDITOR_KEY/);
});
