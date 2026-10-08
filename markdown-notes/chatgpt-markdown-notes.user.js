// ==UserScript==
// @name         ChatGPT Markdown Notes
// @namespace    https://chatgpt.com/
// @version      1.10.0
// @description  Panel lateral acoplado y redimensionable para notas Markdown persistentes por conversación.
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @updateURL    https://raw.githubusercontent.com/AlfilAlex/tampermonkey-llm-profiles/master/markdown-notes/chatgpt-markdown-notes.user.js
// @downloadURL  https://raw.githubusercontent.com/AlfilAlex/tampermonkey-llm-profiles/master/markdown-notes/chatgpt-markdown-notes.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const APP = 'tm-chatgpt-markdown-notes';
  const DB_NAME = `${APP}-db`;
  const DB_VERSION = 3;

  const HANDLE_STORE = 'handles';
  const DRAFT_STORE = 'drafts';
  const LINKS_STORE = 'chat-links';
  const DIRECTORY_KEY = 'notes-directory';
  const DIRECTORY_ID_KEY = 'notes-directory-id';

  const PANEL_OPEN_KEY = `${APP}:panel-open`;
  const PANEL_WIDTH_KEY = `${APP}:panel-width`;
  const DEFAULT_PANEL_WIDTH = 430;
  const MIN_PANEL_WIDTH = 300;
  const MAX_PANEL_WIDTH = 760;
  const NEW_CHAT_SESSION_KEY = `${APP}:new-chat-session-key`;

  let directoryHandle = null;
  let directoryId = null;
  let linkedFiles = [];
  let libraryFiles = [];
  let libraryVisible = false;
  let selectedLibraryFile = null;
  let panel = null;
  let launcher = null;

  let activeChatKey = null;
  let activeState = null;

  let saving = false;
  let draftSaveTimer = null;
  let navigationTimer = null;
  let resizing = false;

  let reviewIndex = 0;
  let reviewRevealed = false;

  let markdownSelection = null;

  // ===========================================================================
  // IndexedDB
  // ===========================================================================

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(HANDLE_STORE)) {
          db.createObjectStore(HANDLE_STORE);
        }

        if (!db.objectStoreNames.contains(DRAFT_STORE)) {
          db.createObjectStore(DRAFT_STORE);
        }
        if (!db.objectStoreNames.contains(LINKS_STORE)) {
          db.createObjectStore(LINKS_STORE);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function idbGet(storeName, key) {
    const db = await openDb();

    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  }

  async function idbSet(storeName, key, value) {
    const db = await openDb();

    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        store.put(value, key);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(
          tx.error || new Error('La transacción de IndexedDB fue abortada.')
        );
      });
    } finally {
      db.close();
    }
  }

  async function idbDelete(storeName, key) {
    const db = await openDb();

    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        store.delete(key);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(
          tx.error || new Error('La transacción de IndexedDB fue abortada.')
        );
      });
    } finally {
      db.close();
    }
  }

  // ===========================================================================
  // Conversación
  // ===========================================================================

  function getChatId() {
    const match = location.pathname.match(/\/c\/([^/?#]+)/);
    return match ? match[1] : null;
  }

  function getOrCreateNewChatSessionKey() {
    let value = sessionStorage.getItem(NEW_CHAT_SESSION_KEY);

    if (!value) {
      const suffix = typeof crypto?.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      value = `new:${suffix}`;
      sessionStorage.setItem(NEW_CHAT_SESSION_KEY, value);
    }

    return value;
  }

  function getCurrentChatKey() {
    const chatId = getChatId();
    return chatId ? `chat:${chatId}` : getOrCreateNewChatSessionKey();
  }

  function getChatUrl() {
    const chatId = getChatId();

    return chatId
      ? `${location.origin}/c/${chatId}`
      : `${location.origin}${location.pathname}`;
  }

  // ===========================================================================
  // Estado persistente del borrador
  // ===========================================================================

  function createCornellBlock(value = {}) {
    const id = typeof value.id === 'string' && value.id.trim()
      ? value.id.trim()
      : (typeof crypto?.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

    return {
      id,
      cue: typeof value.cue === 'string' ? value.cue : '',
      notes: typeof value.notes === 'string' ? value.notes : ''
    };
  }

  function normalizeCornellState(value) {
    const blocks = Array.isArray(value?.blocks)
      ? value.blocks
        .filter(block => block && typeof block === 'object')
        .map(createCornellBlock)
      : [];

    return {
      blocks,
      summary: typeof value?.summary === 'string' ? value.summary : ''
    };
  }

  function cornellHasContent(value) {
    const cornell = value && typeof value === 'object'
      ? value
      : { blocks: [], summary: '' };

    return Boolean(
      String(cornell.summary || '').trim() ||
      (Array.isArray(cornell.blocks) && cornell.blocks.some(block =>
        String(block?.cue || '').trim() || String(block?.notes || '').trim()
      ))
    );
  }

  function serializeCornellBody(value) {
    const cornell = normalizeCornellState(value);
    const lines = ['## Cornell Notes', ''];

    const blocks = cornell.blocks.filter(block =>
      String(block.cue || '').trim() || String(block.notes || '').trim()
    );

    blocks.forEach(block => {
      const cue = String(block.cue || '')
        .replace(/\s+/g, ' ')
        .trim();
      const notes = String(block.notes || '').trim();
      const heading = cue || 'Nota';

      lines.push(`### Cue: ${heading}`, '');

      if (notes) {
        lines.push(notes, '');
      }
    });

    lines.push('## Summary', '');

    const summary = String(cornell.summary || '').trim();
    if (summary) {
      lines.push(summary, '');
    }

    return lines.join('\n').trimEnd();
  }

  function findCornellStructure(lines) {
    let fenceChar = '';
    let fenceLength = 0;
    let startIndex = -1;
    const summaryIndexes = [];
    const semanticBlockIndexes = [];
    const legacyBlockIndexes = [];

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const fence = line.match(/^\s*((?:[\x60]{3,})|(?:~{3,}))/);

      if (fence) {
        const token = fence[1];

        if (!fenceChar) {
          fenceChar = token[0];
          fenceLength = token.length;
        } else if (token[0] === fenceChar && token.length >= fenceLength) {
          fenceChar = '';
          fenceLength = 0;
        }

        continue;
      }

      if (fenceChar) continue;

      const trimmed = line.trim();

      if (startIndex < 0) {
        if (trimmed === '## Cornell Notes') {
          startIndex = index;
        }
        continue;
      }

      if (trimmed === '## Summary') {
        summaryIndexes.push(index);
        continue;
      }

      if (/^###\s+Cue:\s*.+\s*$/i.test(line)) {
        semanticBlockIndexes.push(index);
        continue;
      }

      if (/^###\s+\d+\.\s+.+\s*$/.test(line)) {
        legacyBlockIndexes.push(index);
      }
    }

    const summaryIndex = summaryIndexes.length > 0
      ? summaryIndexes[summaryIndexes.length - 1]
      : -1;

    const semantic = semanticBlockIndexes.filter(index =>
      index > startIndex && (summaryIndex < 0 || index < summaryIndex)
    );
    const legacy = legacyBlockIndexes.filter(index =>
      index > startIndex && (summaryIndex < 0 || index < summaryIndex)
    );

    return {
      startIndex,
      summaryIndex,
      format: semantic.length > 0 ? 'semantic' : 'legacy',
      blockIndexes: semantic.length > 0 ? semantic : legacy
    };
  }

  function parseCornellBody(value) {
    const body = String(value || '').replace(/\r\n?/g, '\n');
    const lines = body.split('\n');
    const {
      startIndex,
      summaryIndex,
      format,
      blockIndexes
    } = findCornellStructure(lines);

    if (startIndex < 0 || summaryIndex <= startIndex) return null;

    if (lines.slice(0, startIndex).some(line => line.trim())) return null;

    const sectionLines = lines.slice(startIndex + 1, summaryIndex);
    const sectionHasContent = sectionLines.some(line => line.trim());

    if (sectionHasContent && blockIndexes.length === 0) return null;

    const blocks = [];

    for (let i = 0; i < blockIndexes.length; i += 1) {
      const absoluteStart = blockIndexes[i];
      const absoluteEnd = i + 1 < blockIndexes.length
        ? blockIndexes[i + 1]
        : summaryIndex;

      const heading = format === 'semantic'
        ? lines[absoluteStart].match(/^###\s+Cue:\s*(.+?)\s*$/i)
        : lines[absoluteStart].match(/^###\s+\d+\.\s+(.+?)\s*$/);

      if (!heading) return null;

      const label = heading[1].trim();
      const notes = lines
        .slice(absoluteStart + 1, absoluteEnd)
        .join('\n')
        .trim();

      blocks.push(createCornellBlock({
        cue: label.toLowerCase() === 'nota' ? '' : label,
        notes
      }));
    }

    return {
      blocks,
      summary: lines.slice(summaryIndex + 1).join('\n').trim()
    };
  }

  function isCornellBody(value) {
    return parseCornellBody(value) !== null;
  }

  function importBodyAsCornell(value) {
    const body = String(value || '').trim();

    return {
      blocks: body
        ? [createCornellBlock({ cue: '', notes: body })]
        : [],
      summary: ''
    };
  }

  function syncBodyFromCornell() {
    if (!activeState?.cornell) return;

    activeState.body = cornellHasContent(activeState.cornell)
      ? serializeCornellBody(activeState.cornell)
      : '';
  }

  function syncCornellFromBody({ canonicalize = true } = {}) {
    if (!activeState) return false;

    const parsed = parseCornellBody(activeState.body);

    if (parsed) {
      activeState.cornell = normalizeCornellState(parsed);
      return true;
    }

    activeState.cornell = normalizeCornellState(
      importBodyAsCornell(activeState.body)
    );

    if (canonicalize) {
      syncBodyFromCornell();
    }

    return false;
  }

  function analyzeCornellCompatibility(value = activeState?.body) {
    const body = String(value || '');

    if (!body.trim()) {
      return {
        state: 'empty',
        blocks: 0,
        parsed: null
      };
    }

    const parsed = parseCornellBody(body);

    if (parsed) {
      return {
        state: 'ready',
        blocks: parsed.blocks.length,
        parsed
      };
    }

    return {
      state: 'freeform',
      blocks: 0,
      parsed: null
    };
  }

  function prepareCornellBody() {
    if (!activeState) return null;

    const analysis = analyzeCornellCompatibility(activeState.body);

    if (analysis.state === 'ready') {
      activeState.cornell = normalizeCornellState(analysis.parsed);
      return activeState.cornell;
    }

    if (analysis.state === 'empty') {
      activeState.cornell = normalizeCornellState(null);
      activeState.body = '## Cornell Notes\n\n## Summary';
      return activeState.cornell;
    }

    activeState.cornell = normalizeCornellState(
      importBodyAsCornell(activeState.body)
    );
    activeState.body = serializeCornellBody(activeState.cornell);

    return activeState.cornell;
  }

  function persistSemanticCornellEdit() {
    renderEditor();
    renderSaveButton();
    updateStatus();
    scheduleDraftPersistence();
  }

  function selectTextInFreeformEditor(text, fromEnd = false) {
    const editor = panel?.querySelector('.tmn-editor');
    if (!editor) return false;

    const value = editor.value;
    const index = fromEnd ? value.lastIndexOf(text) : value.indexOf(text);
    if (index < 0) return false;

    editor.focus();
    editor.setSelectionRange(index, index + text.length);
    rememberMarkdownSelection(editor);
    return true;
  }

  function prepareCornellFromLibre() {
    if (!activeState || activeState.noteMode !== 'freeform') return;

    const before = activeState.body;
    prepareCornellBody();
    persistSemanticCornellEdit();

    requestAnimationFrame(() => {
      const editor = panel?.querySelector('.tmn-editor');
      editor?.focus();

      if (!before.trim()) {
        const summaryMarker = '## Summary';
        const summaryIndex = editor?.value.indexOf(summaryMarker) ?? -1;

        if (editor && summaryIndex >= 0) {
          const caret = Math.max(0, summaryIndex - 1);
          editor.setSelectionRange(caret, caret);
          rememberMarkdownSelection(editor);
        }
      }
    });
  }

  function addCornellCueFromLibre() {
    if (!activeState || activeState.noteMode !== 'freeform') return;

    prepareCornellBody();

    const parsed = parseCornellBody(activeState.body);
    if (!parsed) {
      setStatus('No se pudo preparar una estructura Cornell válida.', 'error');
      return;
    }

    parsed.blocks.push(createCornellBlock({
      cue: 'Pregunta o concepto',
      notes: ''
    }));

    activeState.cornell = normalizeCornellState(parsed);
    activeState.body = serializeCornellBody(activeState.cornell);
    persistSemanticCornellEdit();

    requestAnimationFrame(() => {
      selectTextInFreeformEditor('Pregunta o concepto', true);
    });
  }

  function goToCornellSummaryFromLibre() {
    if (!activeState || activeState.noteMode !== 'freeform') return;

    prepareCornellBody();

    const parsed = parseCornellBody(activeState.body);
    if (!parsed) {
      setStatus('No se pudo preparar una estructura Cornell válida.', 'error');
      return;
    }

    activeState.cornell = normalizeCornellState(parsed);
    activeState.body = serializeCornellBody(activeState.cornell);
    persistSemanticCornellEdit();

    requestAnimationFrame(() => {
      const editor = panel?.querySelector('.tmn-editor');
      if (!editor) return;

      const marker = '## Summary';
      const markerIndex = editor.value.indexOf(marker);
      if (markerIndex < 0) return;

      let caret = markerIndex + marker.length;

      if (editor.value.slice(caret, caret + 2) === '\n\n') {
        caret += 2;
      } else if (editor.value[caret] === '\n') {
        caret += 1;
      }

      editor.focus();
      editor.setSelectionRange(caret, caret);
      rememberMarkdownSelection(editor);
    });
  }

  function createNoteId() {
    const browserCrypto = globalThis.crypto;

    if (typeof browserCrypto?.randomUUID === 'function') {
      return browserCrypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function createEmptyState() {
    return {
      noteId: createNoteId(),
      body: '',
      savedBody: '',
      manualFilename: null,
      filename: null,
      filenameFallbackId: null,
      filenameFallbackAt: null,
      noteMode: 'freeform',
      savedNoteMode: null,
      originChatId: null,
      originChatUrl: null,
      sharedFilename: null,
      sharedDirectoryId: null,
      sharedFileSnapshot: null,
      cornell: normalizeCornellState(null),
      savedCornellSnapshot: null,
      createdAt: null,
      lastSavedAt: null,
      updatedAt: new Date().toISOString()
    };
  }

  function normalizeState(value) {
    const base = createEmptyState();

    if (!value || typeof value !== 'object') return base;

    const noteMode = ['freeform', 'cornell', 'review'].includes(value.noteMode)
      ? value.noteMode
      : 'freeform';

    let body = typeof value.body === 'string' ? value.body : '';
    let cornell = normalizeCornellState(value.cornell);
    const parsedBody = parseCornellBody(body);

    if (parsedBody) {
      // El Markdown canónico gana sobre cualquier proyección Cornell cacheada.
      cornell = normalizeCornellState(parsedBody);
    } else if (cornellHasContent(cornell)) {
      if (body.trim()) {
        // Migración desde v1.4.x: Libre y Cornell podían contener documentos
        // distintos. Preservamos ambos en un único documento Cornell.
        cornell = normalizeCornellState({
          blocks: [
            createCornellBlock({ cue: '', notes: body }),
            ...cornell.blocks
          ],
          summary: cornell.summary
        });
      }

      body = serializeCornellBody(cornell);
    } else if (noteMode !== 'freeform' && body.trim()) {
      // Un draft que estaba visualmente en Cornell/Repaso pero sólo conserva
      // body se importa sin pérdida como un único bloque.
      cornell = normalizeCornellState(importBodyAsCornell(body));
      body = serializeCornellBody(cornell);
    }

    return {
      noteId: typeof value.noteId === 'string' && value.noteId.trim()
        ? value.noteId.trim()
        : createNoteId(),
      body,
      savedBody: typeof value.savedBody === 'string' ? value.savedBody : '',
      manualFilename: typeof value.manualFilename === 'string' && value.manualFilename.trim()
        ? value.manualFilename.trim()
        : null,
      filename: typeof value.filename === 'string' && value.filename.trim()
        ? value.filename
        : null,
      filenameFallbackId: typeof value.filenameFallbackId === 'string' &&
        /^[a-f0-9]{8}$/i.test(value.filenameFallbackId.trim())
        ? value.filenameFallbackId.trim().toLowerCase()
        : null,
      filenameFallbackAt: typeof value.filenameFallbackAt === 'string' && value.filenameFallbackAt
        ? value.filenameFallbackAt
        : null,
      noteMode,
      savedNoteMode: ['freeform', 'cornell'].includes(value.savedNoteMode)
        ? value.savedNoteMode
        : null,
      originChatId: typeof value.originChatId === 'string' ? value.originChatId : null,
      originChatUrl: typeof value.originChatUrl === 'string' ? value.originChatUrl : null,
      sharedFilename: typeof value.sharedFilename === 'string' ? value.sharedFilename : null,
      sharedDirectoryId: typeof value.sharedDirectoryId === 'string' ? value.sharedDirectoryId : null,
      sharedFileSnapshot: typeof value.sharedFileSnapshot === 'string' ? value.sharedFileSnapshot : null,
      cornell,
      savedCornellSnapshot: typeof value.savedCornellSnapshot === 'string'
        ? value.savedCornellSnapshot
        : null,
      createdAt: typeof value.createdAt === 'string' ? value.createdAt : null,
      lastSavedAt: typeof value.lastSavedAt === 'string' ? value.lastSavedAt : null,
      updatedAt: typeof value.updatedAt === 'string'
        ? value.updatedAt
        : new Date().toISOString()
    };
  }

  async function loadState(chatKey) {
    const stored = await idbGet(DRAFT_STORE, chatKey);
    const state = normalizeState(stored);

    // Existing saved drafts keep their original chat as provenance.
    if (stored?.lastSavedAt && !stored?.originChatId && chatKey.startsWith('chat:')) {
      state.originChatId = chatKey.slice(5);
      state.originChatUrl = 'https://chatgpt.com/c/' + state.originChatId;
    }
    if (!stored?.noteId || (state.originChatId && !stored?.originChatId)) {
      await idbSet(DRAFT_STORE, chatKey, state);
    }

    return state;
  }

  async function persistActiveState() {
    if (!activeChatKey || !activeState) return;

    activeState.updatedAt = new Date().toISOString();
    await idbSet(DRAFT_STORE, activeChatKey, activeState);
  }

  function scheduleDraftPersistence() {
    clearTimeout(draftSaveTimer);

    draftSaveTimer = window.setTimeout(async () => {
      try {
        await persistActiveState();
        updateStatus();
      } catch (error) {
        console.error('[ChatGPT Markdown Notes] Error al persistir borrador:', error);
        setStatus('No se pudo persistir el borrador local.', 'error');
      }
    }, 300);
  }

  function isDirty() {
    if (!activeState) return false;

    const contentChanged = activeState.body !== activeState.savedBody;
    const targetFilename = currentFilename();
    const filenameChanged = Boolean(targetFilename) &&
      targetFilename !== (activeState.filename || '');

    return contentChanged || filenameChanged;
  }

  function ensureCornellStarterBlock() {
    if (!activeState?.cornell) return null;
    if (activeState.cornell.blocks.length > 0) return activeState.cornell.blocks[0];

    const block = createCornellBlock();
    activeState.cornell.blocks.push(block);
    return block;
  }

  function setNoteMode(mode) {
    if (!activeState || !['freeform', 'cornell', 'review'].includes(mode)) return;
    if (activeState.noteMode === mode) return;

    if (
      activeState.noteMode === 'freeform' &&
      (mode === 'cornell' || mode === 'review')
    ) {
      const compatibility = analyzeCornellCompatibility(activeState.body);

      if (compatibility.state === 'freeform') {
        setStatus(
          'Esta nota sigue en formato libre. Usa “Preparar Cornell” para convertirla sin perder contenido.'
        );
        renderCornellStructureAssistant({ emphasize: true });
        return;
      }
    }

    if (activeState.noteMode === 'cornell') {
      syncBodyFromCornell();
    }

    if (mode === 'cornell' || mode === 'review') {
      syncCornellFromBody({ canonicalize: true });
    }

    if (mode === 'cornell') {
      ensureCornellStarterBlock();
    }

    activeState.noteMode = mode;
    reviewIndex = 0;
    reviewRevealed = false;

    renderModeSelector();
    renderEditor();
    renderSaveButton();
    updateStatus();
    scheduleDraftPersistence();
  }

  function addCornellBlock() {
    if (!activeState?.cornell) return;

    const block = createCornellBlock();
    activeState.cornell.blocks.push(block);
    syncBodyFromCornell();
    renderCornellEditor();
    renderSaveButton();
    updateStatus();
    scheduleDraftPersistence();

    requestAnimationFrame(() => {
      panel?.querySelector(
        `.tmn-cornell-block[data-block-id="${CSS.escape(block.id)}"] .tmn-cue-editor`
      )?.focus();
    });
  }

  function insertCornellBlockAfter(blockId) {
    if (!activeState?.cornell) return;

    const blocks = activeState.cornell.blocks;
    const index = blocks.findIndex(block => block.id === blockId);
    if (index < 0) return;

    const block = createCornellBlock();
    blocks.splice(index + 1, 0, block);

    syncBodyFromCornell();
    renderCornellEditor();
    renderSaveButton();
    updateStatus();
    scheduleDraftPersistence();

    requestAnimationFrame(() => {
      panel?.querySelector(
        `.tmn-cornell-block[data-block-id="${CSS.escape(block.id)}"] .tmn-cue-editor`
      )?.focus();
    });
  }

  function moveCornellBlock(blockId, delta) {
    if (!activeState?.cornell) return;

    const blocks = activeState.cornell.blocks;
    const index = blocks.findIndex(block => block.id === blockId);
    const nextIndex = index + delta;

    if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) return;

    const [block] = blocks.splice(index, 1);
    blocks.splice(nextIndex, 0, block);
    syncBodyFromCornell();

    renderCornellEditor();
    renderSaveButton();
    updateStatus();
    scheduleDraftPersistence();

    requestAnimationFrame(() => {
      panel?.querySelector(
        `.tmn-cornell-block[data-block-id="${CSS.escape(blockId)}"] .tmn-cue-editor`
      )?.focus();
    });
  }

  function deleteCornellBlock(blockId) {
    if (!activeState?.cornell) return;

    const index = activeState.cornell.blocks.findIndex(block => block.id === blockId);
    if (index < 0) return;

    activeState.cornell.blocks.splice(index, 1);
    syncBodyFromCornell();
    renderCornellEditor();
    renderSaveButton();
    updateStatus();
    scheduleDraftPersistence();

    requestAnimationFrame(() => {
      const fallbackIndex = Math.min(index, activeState.cornell.blocks.length - 1);
      if (fallbackIndex >= 0) {
        const fallbackId = activeState.cornell.blocks[fallbackIndex].id;
        panel?.querySelector(
          `.tmn-cornell-block[data-block-id="${CSS.escape(fallbackId)}"] .tmn-cue-editor`
        )?.focus();
      } else {
        panel?.querySelector('.tmn-add-block')?.focus();
      }
    });
  }

  function resetCornellDeleteButton(button, blockIndex) {
    if (!(button instanceof HTMLButtonElement)) return;

    button.dataset.confirmDelete = '0';
    button.textContent = 'Eliminar';
    button.classList.remove('tmn-delete-confirm');
    button.setAttribute('aria-label', `Eliminar bloque ${blockIndex + 1}`);
    button.title = `Eliminar bloque ${blockIndex + 1}`;
  }

  function confirmCornellBlockDelete(button, blockId) {
    if (!(button instanceof HTMLButtonElement) || !activeState?.cornell) return;

    const blockIndex = activeState.cornell.blocks.findIndex(block => block.id === blockId);
    if (blockIndex < 0) return;

    if (button.dataset.confirmDelete === '1') {
      deleteCornellBlock(blockId);
      return;
    }

    button.dataset.confirmDelete = '1';
    button.textContent = 'Confirmar';
    button.classList.add('tmn-delete-confirm');
    button.setAttribute(
      'aria-label',
      `Confirmar eliminación del bloque ${blockIndex + 1}`
    );
    button.title = 'Pulsa otra vez para eliminar este bloque';

    window.setTimeout(() => {
      if (!button.isConnected || button.dataset.confirmDelete !== '1') return;
      resetCornellDeleteButton(button, blockIndex);
    }, 3000);
  }

  function currentNoteTitle() {
    const filename = currentFilename();

    return filename
      ? filename.replace(/\.md$/i, '').trim()
      : '';
  }

  function normalizeFilename(value) {
    let filename = String(value || '')
      .trim()
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .replace(/[. ]+$/g, '');

    if (!filename) return '';

    if (!/\.md$/i.test(filename)) {
      filename += '.md';
    }

    const extension = '.md';
    let stem = filename.slice(0, -extension.length)
      .slice(0, 180)
      .replace(/[. ]+$/g, '');

    if (!stem) stem = 'nota';

    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(stem)) {
      stem = `nota-${stem}`;
    }

    return `${stem}${extension}`;
  }

  function currentFilename() {
    return normalizeFilename(activeState?.manualFilename);
  }

  function hasManualFilename() {
    return Boolean(currentFilename());
  }

  // ===========================================================================
  // File System Access API
  // ===========================================================================

  function supportsFileSystemAccess() {
    return typeof window.showDirectoryPicker === 'function';
  }

  async function loadSavedDirectoryHandle() {
    try {
      const handle = await idbGet(HANDLE_STORE, DIRECTORY_KEY);

      if (handle?.kind === 'directory') {
        directoryHandle = handle;
        directoryId = await idbGet(HANDLE_STORE, DIRECTORY_ID_KEY);
        if (!directoryId) {
          directoryId = createNoteId();
          await idbSet(HANDLE_STORE, DIRECTORY_ID_KEY, directoryId);
        }
      }
    } catch (error) {
      console.warn(
        '[ChatGPT Markdown Notes] No se pudo recuperar la carpeta guardada:',
        error
      );
    }

    renderFolder();
  }

  async function chooseDirectory() {
    if (!supportsFileSystemAccess()) {
      throw new Error(
        'Este navegador no expone showDirectoryPicker(). Usa Chrome o Edge en escritorio.'
      );
    }

    const handle = await window.showDirectoryPicker.call(window, {
      id: 'chatgpt-markdown-notes',
      mode: 'readwrite',
      startIn: 'documents'
    });

    const same = directoryHandle && typeof handle.isSameEntry === 'function'
      ? await handle.isSameEntry(directoryHandle)
      : false;
    directoryId = same && directoryId ? directoryId : createNoteId();
    directoryHandle = handle;
    await idbSet(HANDLE_STORE, DIRECTORY_KEY, handle);
    await idbSet(HANDLE_STORE, DIRECTORY_ID_KEY, directoryId);
    libraryFiles = [];
    selectedLibraryFile = null;
    linkedFiles = await loadChatLinks(activeChatKey);
    renderFolder();

    return handle;
  }

  async function forgetDirectory() {
    directoryHandle = null;
    directoryId = null;
    linkedFiles = [];
    libraryFiles = [];
    selectedLibraryFile = null;
    await idbDelete(HANDLE_STORE, DIRECTORY_KEY);
    await idbDelete(HANDLE_STORE, DIRECTORY_ID_KEY);
    renderFolder();
    renderLibrary();
  }

  async function ensureWritePermission(handle) {
    if (!handle) return false;

    const options = { mode: 'readwrite' };

    if (typeof handle.queryPermission === 'function') {
      const state = await handle.queryPermission(options);

      if (state === 'granted') return true;
    }

    if (typeof handle.requestPermission === 'function') {
      const state = await handle.requestPermission(options);
      return state === 'granted';
    }

    return true;
  }

  async function writeMarkdownFile(dir, filename, content) {
    // getFileHandle(..., { create: true }) abre el mismo archivo si existe.
    // createWritable() escribe sobre ese archivo, por lo que Guardar funciona
    // como "guardar cambios", no como "crear una copia".
    const fileHandle = await dir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();

    try {
      await writable.write(content);
    } finally {
      await writable.close();
    }
  }

  // ===========================================================================
  // Markdown
  // ===========================================================================

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function localIsoTimestamp(date = new Date()) {
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMinutes);

    const offsetHours = Math.floor(abs / 60);
    const offsetRemainder = abs % 60;

    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
      `${sign}${pad(offsetHours)}:${pad(offsetRemainder)}`
    );
  }

  function yamlString(value) {
    return `"${String(value)
      .replaceAll('\\', '\\\\')
      .replaceAll('"', '\\"')
      .replaceAll('\r', '')
      .replaceAll('\n', '\\n')}"`;
  }


  function chatLinksKey(chatKey = activeChatKey) {
    return directoryId && chatKey ? directoryId + ':' + chatKey : null;
  }

  async function loadChatLinks(chatKey = activeChatKey) {
    const key = chatLinksKey(chatKey);
    if (!key) return [];
    const stored = await idbGet(LINKS_STORE, key);
    return Array.isArray(stored)
      ? [...new Set(stored.filter(name => typeof name === 'string' && /\.md$/i.test(name)))]
      : [];
  }

  async function persistChatLinks(files, chatKey = activeChatKey) {
    const key = chatLinksKey(chatKey);
    if (!key) throw new Error('Primero configura una carpeta.');
    await idbSet(LINKS_STORE, key, [...new Set(files)]);
  }

  function validChatUrl(value) {
    if (typeof value !== 'string') return null;
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' ||
          !['chatgpt.com', 'chat.openai.com'].includes(url.hostname) ||
          !/^\/c\/[^/]+$/.test(url.pathname)) return null;
      return url.origin + url.pathname;
    } catch {
      return null;
    }
  }

  function parseMarkdownMetadata(raw) {
    const text = String(raw || '');
    const headerMatch = /^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/.exec(text);
    const header = headerMatch ? headerMatch[1] : '';
    const scalar = key => {
      const match = new RegExp('^' + key + ':\\s*(.*)$', 'm').exec(header);
      if (!match) return null;
      const value = match[1].trim();
      if (!value || value === 'null') return null;
      if (value.startsWith('"')) {
        try { return JSON.parse(value); } catch { return null; }
      }
      return value.replace(/^'|'$/g, '');
    };
    const linkedChatUrls = [];
    const block = /^linked_chat_urls:[^\r\n]*\r?\n((?:[ \t]+-[^\r\n]*(?:\r?\n|$))*)/m.exec(header);
    if (block) {
      for (const line of block[1].split(/\r?\n/)) {
        const match = /^\s*-\s+(.+?)\s*$/.exec(line);
        if (!match) continue;
        let url = match[1];
        try { url = JSON.parse(url); } catch { url = url.replace(/^'|'$/g, ''); }
        const safe = validChatUrl(url);
        if (safe && !linkedChatUrls.includes(safe)) linkedChatUrls.push(safe);
      }
    }
    return {
      originChatId: scalar('chat_id'),
      originChatUrl: validChatUrl(scalar('chat_url')),
      linkedChatUrls,
      headerMatch
    };
  }

  function withLinkedChatUrl(raw, url, add) {
    const normalized = validChatUrl(url);
    if (!normalized) throw new Error('Se necesita un chat con URL válida para vincular.');
    const input = String(raw);
    const meta = parseMarkdownMetadata(input);
    const links = new Set(meta.linkedChatUrls);
    if (add) links.add(normalized);
    else links.delete(normalized);
    const rows = [...links].map(link => '  - ' + yamlString(link)).join('\n');
    if (meta.headerMatch) {
      const oldBlock = /^linked_chat_urls:[^\r\n]*\r?\n(?:[ \t]+-[^\r\n]*(?:\r?\n|$))*/m;
      const remaining = meta.headerMatch[1].replace(oldBlock, '').replace(/\n+$/, '');
      const updated = remaining + (rows ? '\nlinked_chat_urls:\n' + rows : '');
      return input.replace(meta.headerMatch[0], () => '---\n' + updated + '\n---');
    }
    return rows ? '---\nlinked_chat_urls:\n' + rows + '\n---\n\n' + input : input;
  }

  async function readMarkdownFile(filename) {
    if (!directoryHandle) throw new Error('Primero selecciona una carpeta.');
    const handle = await directoryHandle.getFileHandle(filename, { create: false });
    return (await handle.getFile()).text();
  }

  async function rewriteMetadata(filename, oldText, updatedText) {
    if (oldText === updatedText) return;
    const handle = await directoryHandle.getFileHandle(filename, { create: false });
    const current = await (await handle.getFile()).text();
    if (current !== oldText) {
      throw new Error('El archivo cambió en disco. Actualiza la biblioteca y vuelve a intentarlo.');
    }
    const writable = await handle.createWritable();
    try {
      await writable.write(updatedText);
      await writable.close();
    } catch (error) {
      try { await writable.abort(); } catch {}
      throw error;
    }
  }

  async function ensureReadPermission(handle) {
    if (!handle) return false;
    const permission = { mode: 'read' };
    if (typeof handle.queryPermission === 'function' &&
        await handle.queryPermission(permission) === 'granted') return true;
    if (typeof handle.requestPermission === 'function')
      return await handle.requestPermission(permission) === 'granted';
    return true;
  }

  function buildMarkdown(linkedChatUrls = []) {
    const title = currentNoteTitle();

    if (!title) {
      throw new Error('Escribe un título / nombre de archivo antes de guardar.');
    }

    const chatId = activeState.originChatId || null;
    const chatUrl = activeState.originChatUrl || null;
    const body = String(activeState.body || '').trim();

    const created = activeState.createdAt || localIsoTimestamp();
    const updated = localIsoTimestamp();

    const lines = [
      '---',
      `title: ${yamlString(title)}`,
      `created: ${yamlString(created)}`,
      `updated: ${yamlString(updated)}`,
      `source: ${yamlString('ChatGPT')}`
    ];

    if (isCornellBody(body)) {
      lines.push(`note_method: ${yamlString('cornell')}`);
    }

    lines.push(
      chatId ? `chat_id: ${yamlString(chatId)}` : 'chat_id: null',
      chatUrl ? `chat_url: ${yamlString(chatUrl)}` : 'chat_url: null',
      ...(linkedChatUrls.length ? ['linked_chat_urls:', ...linkedChatUrls.map(url => `  - ${yamlString(url)}`)] : []),
      '---',
      '',
      `# ${title}`,
      ''
    );

    if (body) {
      lines.push(body, '');
    }

    return lines.join('\n');
  }

  // ===========================================================================
  // Herramientas Markdown
  // ===========================================================================

  function isMarkdownTextarea(target) {
    return target instanceof HTMLTextAreaElement && (
      target.classList.contains('tmn-editor') ||
      target.classList.contains('tmn-block-notes') ||
      target.classList.contains('tmn-summary-editor')
    );
  }

  function rememberMarkdownSelection(target) {
    if (!isMarkdownTextarea(target)) return;

    markdownSelection = {
      target,
      start: target.selectionStart ?? 0,
      end: target.selectionEnd ?? 0
    };
  }

  function defaultMarkdownTarget() {
    if (!panel || !activeState || activeState.noteMode === 'review') return null;

    if (activeState.noteMode === 'freeform') {
      return panel.querySelector('.tmn-editor');
    }

    return panel.querySelector('.tmn-block-notes') ||
      panel.querySelector('.tmn-summary-editor');
  }

  function isMarkdownTargetForActiveMode(target) {
    if (!isMarkdownTextarea(target) || !activeState) return false;

    if (activeState.noteMode === 'freeform') {
      return target.classList.contains('tmn-editor');
    }

    if (activeState.noteMode === 'cornell') {
      return (
        target.classList.contains('tmn-block-notes') ||
        target.classList.contains('tmn-summary-editor')
      );
    }

    return false;
  }

  function resolveMarkdownTarget() {
    const remembered = markdownSelection?.target;

    if (
      isMarkdownTargetForActiveMode(remembered) &&
      remembered.isConnected &&
      panel?.contains(remembered)
    ) {
      return remembered;
    }

    const target = defaultMarkdownTarget();

    if (target) {
      rememberMarkdownSelection(target);
    }

    return target;
  }

  function selectionForTarget(target) {
    const valueLength = target.value.length;

    if (markdownSelection?.target === target) {
      return {
        start: Math.max(0, Math.min(markdownSelection.start, valueLength)),
        end: Math.max(0, Math.min(markdownSelection.end, valueLength))
      };
    }

    return {
      start: target.selectionStart ?? 0,
      end: target.selectionEnd ?? 0
    };
  }

  function commitMarkdownEdit(target, start, end, replacement, selectionStart, selectionEnd) {
    target.setRangeText(replacement, start, end, 'end');
    target.focus();

    const nextStart = Number.isInteger(selectionStart)
      ? selectionStart
      : start + replacement.length;
    const nextEnd = Number.isInteger(selectionEnd)
      ? selectionEnd
      : nextStart;

    target.setSelectionRange(nextStart, nextEnd);
    rememberMarkdownSelection(target);

    target.dispatchEvent(new Event('input', {
      bubbles: true,
      composed: true
    }));
  }

  function applyInlineWrapper(prefix, suffix, placeholder) {
    const target = resolveMarkdownTarget();
    if (!target) return;

    const { start, end } = selectionForTarget(target);
    const selected = target.value.slice(start, end);
    const content = selected || placeholder;
    const replacement = prefix + content + suffix;
    const innerStart = start + prefix.length;
    const innerEnd = innerStart + content.length;

    commitMarkdownEdit(
      target,
      start,
      end,
      replacement,
      innerStart,
      innerEnd
    );
  }

  function selectedLineRange(target) {
    const { start, end } = selectionForTarget(target);
    const value = target.value;

    const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const probeEnd = end > start ? end - 1 : end;
    const newlineAfter = value.indexOf('\n', probeEnd);
    const lineEnd = newlineAfter === -1 ? value.length : newlineAfter;

    return {
      start: lineStart,
      end: lineEnd,
      text: value.slice(lineStart, lineEnd)
    };
  }

  function applyLinePrefix(prefixFactory) {
    const target = resolveMarkdownTarget();
    if (!target) return;

    const range = selectedLineRange(target);
    const lines = range.text.split('\n');
    const replacement = lines
      .map((line, index) => prefixFactory(index) + line)
      .join('\n');

    commitMarkdownEdit(
      target,
      range.start,
      range.end,
      replacement,
      range.start,
      range.start + replacement.length
    );
  }

  function applyFencedCode() {
    const target = resolveMarkdownTarget();
    if (!target) return;

    const { start, end } = selectionForTarget(target);
    const selected = target.value.slice(start, end);
    const fence = String.fromCharCode(96).repeat(3);

    if (selected) {
      const replacement = fence + '\n' + selected + '\n' + fence;
      const innerStart = start + fence.length + 1;
      const innerEnd = innerStart + selected.length;

      commitMarkdownEdit(
        target,
        start,
        end,
        replacement,
        innerStart,
        innerEnd
      );
      return;
    }

    const replacement = fence + '\n\n' + fence;
    const caret = start + fence.length + 1;

    commitMarkdownEdit(
      target,
      start,
      end,
      replacement,
      caret,
      caret
    );
  }

  function applyInlineCode() {
    const target = resolveMarkdownTarget();
    if (!target) return;

    const { start, end } = selectionForTarget(target);
    const selected = target.value.slice(start, end);

    if (selected.includes('\n')) {
      applyFencedCode();
      return;
    }

    applyInlineWrapper(
      String.fromCharCode(96),
      String.fromCharCode(96),
      'código'
    );
  }

  function applyMarkdownLink() {
    const target = resolveMarkdownTarget();
    if (!target) return;

    const { start, end } = selectionForTarget(target);
    const selected = target.value.slice(start, end);

    if (selected) {
      const replacement = '[' + selected + '](https://)';
      const urlStart = start + selected.length + 3;
      const urlEnd = urlStart + 'https://'.length;

      commitMarkdownEdit(
        target,
        start,
        end,
        replacement,
        urlStart,
        urlEnd
      );
      return;
    }

    const replacement = '[texto](https://)';
    const textStart = start + 1;
    const textEnd = textStart + 'texto'.length;

    commitMarkdownEdit(
      target,
      start,
      end,
      replacement,
      textStart,
      textEnd
    );
  }

  function applyMarkdownAction(action) {
    const actions = {
      bold: () => applyInlineWrapper('**', '**', 'texto'),
      italic: () => applyInlineWrapper('*', '*', 'texto'),
      h2: () => applyLinePrefix(() => '## '),
      h3: () => applyLinePrefix(() => '### '),
      bullet: () => applyLinePrefix(() => '- '),
      ordered: () => applyLinePrefix(index => `${index + 1}. `),
      task: () => applyLinePrefix(() => '- [ ] '),
      quote: () => applyLinePrefix(() => '> '),
      inlineCode: applyInlineCode,
      codeBlock: applyFencedCode,
      link: applyMarkdownLink
    };

    actions[action]?.();
  }

  function renderMarkdownToolbar() {
    if (!panel || !activeState) return;

    const toolbar = panel.querySelector('.tmn-markdown-toolbar');
    if (!toolbar) return;

    toolbar.hidden = activeState.noteMode === 'review';
  }

  function renderCornellStructureAssistant({ emphasize = false } = {}) {
    if (!panel || !activeState) return;

    const assistant = panel.querySelector('.tmn-cornell-assist');
    if (!assistant) return;

    const visible = activeState.noteMode === 'freeform';
    assistant.hidden = !visible;

    if (!visible) {
      assistant.classList.remove('tmn-attention');
      return;
    }

    const status = assistant.querySelector('.tmn-cornell-assist-status');
    const prepare = assistant.querySelector('[data-cornell-assist-action="prepare"]');
    const analysis = analyzeCornellCompatibility(activeState.body);

    assistant.dataset.state = analysis.state;

    if (analysis.state === 'ready') {
      status.textContent = `Cornell listo · ${analysis.blocks} ${analysis.blocks === 1 ? 'bloque' : 'bloques'}`;
      prepare.hidden = true;
    } else if (analysis.state === 'empty') {
      status.textContent = 'Libre vacío';
      prepare.hidden = false;
    } else {
      status.textContent = 'Libre · sin estructura Cornell';
      prepare.hidden = false;
    }

    if (emphasize) {
      assistant.classList.add('tmn-attention');

      window.setTimeout(() => {
        assistant.classList.remove('tmn-attention');
      }, 1600);
    }
  }

  // ===========================================================================
  // UI
  // ===========================================================================

  function addStyles() {
    if (document.getElementById(`${APP}-styles`)) return;

    const style = document.createElement('style');
    style.id = `${APP}-styles`;

    style.textContent = `
      :root {
        --tmn-notes-width: ${DEFAULT_PANEL_WIDTH}px;
        --tmn-notes-gap: 8px;
      }

      #${APP}-launcher {
        position: fixed;
        right: 14px;
        bottom: 62px;
        z-index: 2147483000;
      }

      /*
       * En escritorio el panel reserva espacio dentro del workspace de ChatGPT.
       * Así reduce el área útil del chat en vez de taparlo.
       */
      @media (min-width: 901px) {
        html.${APP}-open [data-app-shell-workspace-row="true"] {
          box-sizing: border-box !important;
          padding-right: calc(var(--tmn-notes-width) + var(--tmn-notes-gap)) !important;
          transition: padding-right 120ms ease-out;
        }
      }

      #${APP}-launcher button,
      #${APP}-panel button {
        border: 1px solid rgba(127,127,127,.28);
        border-radius: 9px;
        background: #2b2c2f;
        color: #f5f5f5;
        cursor: pointer;
        font: 600 12px/1 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #${APP}-launcher button {
        min-height: 36px;
        padding: 0 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,.28);
      }

      #${APP}-panel {
        position: fixed;
        top: 8px;
        right: 8px;
        bottom: 8px;
        width: min(var(--tmn-notes-width), calc(100vw - 24px));
        z-index: 2147483001;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(127,127,127,.3);
        border-radius: 14px;
        background: #202123;
        color: #f5f5f5;
        box-shadow: 0 22px 70px rgba(0,0,0,.42);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #${APP}-panel[hidden] {
        display: none !important;
      }

      #${APP}-panel .tmn-resizer {
        position: absolute;
        top: 0;
        bottom: 0;
        left: -6px;
        width: 12px;
        z-index: 3;
        cursor: ew-resize;
        touch-action: none;
      }

      #${APP}-panel .tmn-resizer::after {
        content: "";
        position: absolute;
        top: 12px;
        bottom: 12px;
        left: 5px;
        width: 2px;
        border-radius: 999px;
        background: rgba(160,160,160,.22);
        transition: background 120ms ease;
      }

      #${APP}-panel .tmn-resizer:hover::after,
      html.${APP}-resizing #${APP}-panel .tmn-resizer::after {
        background: rgba(210,210,210,.62);
      }

      html.${APP}-resizing,
      html.${APP}-resizing * {
        cursor: ew-resize !important;
        user-select: none !important;
      }


      #${APP}-panel .tmn-library-bar {display:flex; align-items:center; gap:8px; padding:7px 12px; border-bottom:1px solid #5555; font-size:11px;}
      #${APP}-panel .tmn-library-bar button, #${APP}-panel .tmn-library-view button {padding:6px 9px; min-height:28px;}
      #${APP}-panel .tmn-linked-count {opacity:.75;}
      #${APP}-panel .tmn-library-view[hidden], #${APP}-panel .tmn-library-preview[hidden] {display:none!important;}
      #${APP}-panel .tmn-library-view {display:flex; flex-direction:column; flex:1; min-height:0; overflow:auto; gap:9px; padding:10px;}
      #${APP}-panel .tmn-library-actions, #${APP}-panel .tmn-library-item-actions {display:flex;gap:8px;}
      #${APP}-panel .tmn-library-status {font-size:11px;opacity:.75;}
      #${APP}-panel .tmn-library-item-actions button[hidden] {display:none!important;}
      #${APP}-panel .tmn-library-list {display:flex;flex-direction:column;gap:4px;max-height:32%;overflow:auto;}
      #${APP}-panel .tmn-library-list button {width:100%;text-align:left;overflow-wrap:anywhere;line-height:1.4;background:#8882;}
      #${APP}-panel .tmn-library-list button[aria-current="true"] {border-color:#ddd;}
      #${APP}-panel .tmn-library-preview {display:flex;flex-direction:column;gap:8px;min-height:0;flex:1;border-top:1px solid #5555;padding-top:8px;}
      #${APP}-panel .tmn-library-filename {font-weight:700;font-size:12px;overflow-wrap:anywhere;}
      #${APP}-panel .tmn-library-origin {font-size:11px;color:inherit;}
      #${APP}-panel .tmn-library-origin[hidden] {display:none!important;}
      #${APP}-panel .tmn-library-body {flex:1;min-height:100px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 ui-monospace,Menlo,monospace;padding:10px;border:1px solid #5555;border-radius:8px;background:#0003;}
      #${APP}-panel.tmn-library-open .tmn-mode-switch,
      #${APP}-panel.tmn-library-open .tmn-markdown-toolbar,
      #${APP}-panel.tmn-library-open .tmn-cornell-assist,
      #${APP}-panel.tmn-library-open .tmn-editor-wrap,
      #${APP}-panel.tmn-library-open .tmn-footer {display:none!important;}

      #${APP}-panel .tmn-header {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 13px 14px 11px;
        border-bottom: 1px solid rgba(127,127,127,.22);
      }

      #${APP}-panel .tmn-heading {
        min-width: 0;
        flex: 1;
      }

      #${APP}-panel .tmn-file-name {
        box-sizing: border-box;
        width: 100%;
        margin-top: 6px;
        border: 1px solid rgba(127,127,127,.24);
        border-radius: 7px;
        padding: 5px 7px;
        outline: none;
        background: rgba(0,0,0,.16);
        color: #d7d7d7;
        font: 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }

      #${APP}-panel .tmn-file-name:focus {
        border-color: rgba(180,180,180,.55);
        background: rgba(0,0,0,.24);
      }

      #${APP}-panel .tmn-header-actions {
        display: flex;
        gap: 6px;
      }

      #${APP}-panel .tmn-header-actions button {
        width: 32px;
        height: 32px;
        padding: 0;
      }

      #${APP}-panel .tmn-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-bottom: 1px solid rgba(127,127,127,.18);
      }

      #${APP}-panel .tmn-folder {
        min-width: 0;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        opacity: .72;
        font-size: 11px;
      }

      #${APP}-panel .tmn-toolbar button {
        min-height: 30px;
        padding: 0 9px;
      }

      #${APP}-panel .tmn-mode-switch {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
        padding: 7px 10px;
        border-bottom: 1px solid rgba(127,127,127,.18);
        background: rgba(0,0,0,.08);
      }

      #${APP}-panel .tmn-mode-switch button {
        min-height: 30px;
        padding: 0 8px;
        opacity: .66;
      }

      #${APP}-panel .tmn-mode-switch button[aria-selected="true"] {
        background: #f5f5f5;
        color: #151515;
        opacity: 1;
      }

      #${APP}-panel .tmn-markdown-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 6px 10px;
        border-bottom: 1px solid rgba(127,127,127,.18);
        background: rgba(0,0,0,.06);
      }

      #${APP}-panel .tmn-markdown-toolbar[hidden] {
        display: none !important;
      }

      #${APP}-panel .tmn-markdown-toolbar button {
        min-width: 30px;
        min-height: 28px;
        padding: 0 7px;
        border-radius: 7px;
        font-size: 11px;
      }

      #${APP}-panel .tmn-markdown-toolbar .tmn-md-wide {
        min-width: 44px;
      }

      #${APP}-panel .tmn-cornell-assist {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 7px 10px;
        border-bottom: 1px solid rgba(127,127,127,.18);
        background: rgba(0,0,0,.035);
        transition: box-shadow .16s ease, background .16s ease;
      }

      #${APP}-panel .tmn-cornell-assist[hidden] {
        display: none !important;
      }

      #${APP}-panel .tmn-cornell-assist.tmn-attention {
        background: rgba(255,255,255,.075);
        box-shadow: inset 0 0 0 1px rgba(220,220,220,.28);
      }

      #${APP}-panel .tmn-cornell-assist-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 5px;
      }

      #${APP}-panel .tmn-cornell-assist-status {
        flex: 1 1 145px;
        min-width: 0;
        font-size: 11px;
        font-weight: 700;
        opacity: .82;
      }

      #${APP}-panel .tmn-cornell-assist-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      #${APP}-panel .tmn-cornell-assist button {
        min-height: 27px;
        padding: 0 7px;
        border-radius: 7px;
        font-size: 10.5px;
      }

      #${APP}-panel .tmn-cornell-assist details {
        width: 100%;
        font-size: 10.5px;
        line-height: 1.45;
        opacity: .76;
      }

      #${APP}-panel .tmn-cornell-assist summary {
        cursor: pointer;
        user-select: none;
      }

      #${APP}-panel .tmn-cornell-assist-help {
        margin-top: 5px;
        padding: 7px 8px;
        border-radius: 7px;
        background: rgba(0,0,0,.12);
      }

      #${APP}-panel .tmn-cornell-assist-help strong {
        opacity: .95;
      }

      #${APP}-panel .tmn-editor-wrap {
        min-height: 0;
        flex: 1;
        display: flex;
        padding: 10px;
        overflow: hidden;
      }

      #${APP}-panel .tmn-view[hidden] {
        display: none !important;
      }

      #${APP}-panel textarea {
        box-sizing: border-box;
        width: 100%;
        border: 1px solid rgba(127,127,127,.25);
        border-radius: 10px;
        padding: 12px;
        outline: none;
        background: #151617;
        color: #f5f5f5;
        font: 12.5px/1.55 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }

      #${APP}-panel textarea:focus {
        border-color: rgba(180,180,180,.55);
      }

      #${APP}-panel .tmn-editor {
        width: 100%;
        height: 100%;
        min-height: 180px;
        resize: none;
      }

      #${APP}-panel .tmn-cornell-editor {
        width: 100%;
        min-height: 0;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        container-type: inline-size;
        container-name: tmn-cornell;
      }

      #${APP}-panel .tmn-cornell-blocks {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      #${APP}-panel .tmn-cornell-empty,
      #${APP}-panel .tmn-review-empty {
        padding: 18px;
        border: 1px dashed rgba(127,127,127,.28);
        border-radius: 10px;
        text-align: center;
        opacity: .62;
        font-size: 12px;
      }

      #${APP}-panel .tmn-cornell-block {
        border: 1px solid rgba(127,127,127,.24);
        border-radius: 11px;
        overflow: hidden;
        background: rgba(0,0,0,.08);
      }

      #${APP}-panel .tmn-cornell-block-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 8px;
        border-bottom: 1px solid rgba(127,127,127,.16);
      }

      #${APP}-panel .tmn-cornell-block-title {
        flex: 1;
        font-size: 11px;
        font-weight: 700;
        opacity: .68;
      }

      #${APP}-panel .tmn-cornell-actions {
        display: flex;
        gap: 4px;
      }

      #${APP}-panel .tmn-cornell-actions button {
        min-width: 30px;
        min-height: 28px;
        padding: 0 7px;
      }

      #${APP}-panel .tmn-cornell-actions .tmn-delete-confirm {
        font-weight: 700;
        box-shadow: inset 0 0 0 1px rgba(220,220,220,.34);
        background: rgba(255,255,255,.08);
      }

      #${APP}-panel .tmn-cornell-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 8px;
        padding: 9px;
      }

      @container tmn-cornell (min-width: 560px) {
        #${APP}-panel .tmn-cornell-grid {
          grid-template-columns: minmax(0, 3fr) minmax(0, 7fr);
        }
      }

      #${APP}-panel .tmn-cornell-field {
        min-width: 0;
      }

      #${APP}-panel .tmn-cornell-field label,
      #${APP}-panel .tmn-summary-wrap label {
        display: block;
        margin: 0 0 5px 2px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .04em;
        text-transform: uppercase;
        opacity: .58;
      }

      #${APP}-panel .tmn-cue-editor {
        min-height: 84px;
        resize: vertical;
      }

      #${APP}-panel .tmn-block-notes {
        min-height: 120px;
        resize: vertical;
      }

      #${APP}-panel .tmn-add-block {
        align-self: flex-start;
        min-height: 32px;
        padding: 0 11px;
      }

      #${APP}-panel .tmn-summary-wrap {
        padding-top: 2px;
      }

      #${APP}-panel .tmn-summary-editor {
        min-height: 110px;
        resize: vertical;
      }

      #${APP}-panel .tmn-review {
        width: 100%;
        min-height: 0;
        overflow: auto;
      }

      #${APP}-panel .tmn-review-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 100%;
        box-sizing: border-box;
        padding: 4px;
      }

      #${APP}-panel .tmn-review-progress {
        font-size: 11px;
        opacity: .58;
      }

      #${APP}-panel .tmn-review-cue,
      #${APP}-panel .tmn-review-notes {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        border: 1px solid rgba(127,127,127,.24);
        border-radius: 11px;
        padding: 14px;
      }

      #${APP}-panel .tmn-review-cue {
        font-size: 15px;
        font-weight: 700;
        background: rgba(255,255,255,.04);
      }

      #${APP}-panel .tmn-review-notes {
        flex: 1;
        min-height: 150px;
        font: 12.5px/1.55 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        background: #151617;
      }

      #${APP}-panel .tmn-review-actions {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 7px;
      }

      #${APP}-panel .tmn-review-actions button {
        min-height: 34px;
        padding: 0 10px;
      }

      #${APP}-panel .tmn-review-reveal {
        background: #f5f5f5;
        color: #151515;
      }

      #${APP}-panel .tmn-footer {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-top: 1px solid rgba(127,127,127,.22);
      }

      #${APP}-panel .tmn-status {
        min-width: 0;
        flex: 1;
        font-size: 11px;
        opacity: .7;
      }

      #${APP}-panel .tmn-status[data-kind="error"] {
        color: #ffb4b4;
        opacity: 1;
      }

      #${APP}-panel .tmn-status[data-kind="success"] {
        color: #b7f5c4;
        opacity: 1;
      }

      #${APP}-panel .tmn-save {
        min-height: 34px;
        padding: 0 12px;
        background: #f5f5f5;
        color: #151515;
        font-weight: 750;
      }

      #${APP}-panel .tmn-save:disabled {
        opacity: .5;
        cursor: default;
      }

      @media (max-width: 900px) {
        #${APP}-panel {
          top: 4px;
          right: 4px;
          bottom: 4px;
          width: min(var(--tmn-notes-width), calc(100vw - 8px));
        }

        #${APP}-panel .tmn-resizer {
          display: none;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createLauncher() {
    if (document.getElementById(`${APP}-launcher`)) return;

    launcher = document.createElement('div');
    launcher.id = `${APP}-launcher`;

    launcher.innerHTML = `
      <button type="button" title="Abrir notas Markdown">📝 Notas</button>
    `;

    document.body.appendChild(launcher);

    launcher.querySelector('button').addEventListener('click', () => {
      setPanelOpen(true);
    });
  }

  function createPanel() {
    if (document.getElementById(`${APP}-panel`)) {
      panel = document.getElementById(`${APP}-panel`);
      return;
    }

    panel = document.createElement('aside');
    panel.id = `${APP}-panel`;
    panel.hidden = true;

    panel.innerHTML = `
      <div class="tmn-resizer" title="Arrastra para cambiar el ancho"></div>

      <div class="tmn-header">
        <div class="tmn-heading">
          <input
            class="tmn-file-name"
            type="text"
            aria-label="Título y nombre del archivo Markdown"
            title="Obligatorio para guardar. Se usa como título del documento y como nombre del archivo; .md se añade automáticamente."
            placeholder="Título / nombre del archivo (obligatorio)"
            spellcheck="false"
          >
        </div>

        <div class="tmn-header-actions">
          <button class="tmn-close" type="button" title="Cerrar panel">✕</button>
        </div>
      </div>

      <div class="tmn-toolbar">
        <div class="tmn-folder">Carpeta: no configurada</div>
        <button class="tmn-folder-button" type="button">Carpeta</button>
        <button class="tmn-forget-folder" type="button" title="Olvidar carpeta configurada">Olvidar</button>
      </div>


      <div class="tmn-library-bar">
        <button class="tmn-create-new" type="button">Crear nuevo</button>
        <button class="tmn-choose-existing" type="button">Elegir existente</button>
        <span class="tmn-linked-count">Sin archivos vinculados</span>
      </div>
      <section class="tmn-library-view" aria-label="Biblioteca de notas guardadas" hidden>
        <div class="tmn-library-actions">
          <button class="tmn-library-refresh" type="button">Actualizar archivos</button>
          <button class="tmn-library-back" type="button">Volver a la nota</button>
        </div>
        <div class="tmn-library-status" aria-live="polite">Elige un archivo Markdown.</div>
        <div class="tmn-library-list" aria-label="Archivos de la carpeta"></div>
        <div class="tmn-library-preview" hidden>
          <div class="tmn-library-filename"></div>
          <a class="tmn-library-origin" target="_blank" rel="noopener noreferrer" hidden>Ver chat de origen</a>
          <pre class="tmn-library-body"></pre>
          <div class="tmn-library-item-actions">
            <button class="tmn-library-use" type="button">Usar como nota activa</button>
            <button class="tmn-library-link" type="button">Vincular solo para consultar</button>
            <button class="tmn-library-unlink" type="button">Desvincular</button>
          </div>
        </div>
      </section>

      <div class="tmn-mode-switch" role="tablist" aria-label="Modo de notas">
        <button type="button" role="tab" data-mode="freeform">Libre</button>
        <button type="button" role="tab" data-mode="cornell">Cornell</button>
        <button type="button" role="tab" data-mode="review">Repaso</button>
      </div>

      <div class="tmn-markdown-toolbar" role="toolbar" aria-label="Formato Markdown">
        <button type="button" data-md-action="bold" aria-label="Negrita" title="Negrita (Ctrl/Cmd+B)"><strong>B</strong></button>
        <button type="button" data-md-action="italic" aria-label="Cursiva" title="Cursiva (Ctrl/Cmd+I)"><em>I</em></button>
        <button type="button" class="tmn-md-wide" data-md-action="h2" aria-label="Sección Markdown nivel 2" title="Sección Markdown (H2) · formato libre, no necesario para Cornell">Sección</button>
        <button type="button" class="tmn-md-wide" data-md-action="h3" aria-label="Subsección Markdown nivel 3" title="Subsección Markdown (H3) · formato libre, no necesario para Cornell">Subsec.</button>
        <button type="button" data-md-action="bullet" aria-label="Lista con viñetas" title="Lista con viñetas">•</button>
        <button type="button" data-md-action="ordered" aria-label="Lista numerada" title="Lista numerada">1.</button>
        <button type="button" data-md-action="task" aria-label="Lista de tareas" title="Lista de tareas">☐</button>
        <button type="button" data-md-action="quote" aria-label="Cita" title="Cita">&gt;</button>
        <button type="button" data-md-action="inlineCode" aria-label="Código inline" title="Código inline">&lt;/&gt;</button>
        <button type="button" class="tmn-md-wide" data-md-action="codeBlock" aria-label="Bloque de código" title="Bloque de código">Code</button>
        <button type="button" class="tmn-md-wide" data-md-action="link" aria-label="Enlace" title="Enlace (Ctrl/Cmd+K)">Link</button>
      </div>

      <div class="tmn-cornell-assist" aria-label="Estructura Cornell" hidden>
        <div class="tmn-cornell-assist-row">
          <div class="tmn-cornell-assist-status">Libre vacío</div>
          <div class="tmn-cornell-assist-actions">
            <button type="button" data-cornell-assist-action="prepare">Preparar Cornell</button>
            <button type="button" data-cornell-assist-action="cue">+ Cue / Pregunta</button>
            <button type="button" data-cornell-assist-action="summary">Ir a resumen</button>
          </div>
        </div>
        <details>
          <summary>¿Cómo se relaciona Libre con Cornell?</summary>
          <div class="tmn-cornell-assist-help">
            <div><strong>Título / archivo:</strong> lo defines arriba; no necesitas escribir H1 en la nota.</div>
            <div><strong>Cue / Pregunta:</strong> crea un bloque Cornell.</div>
            <div><strong>Texto debajo:</strong> son las notas de ese cue.</div>
            <div><strong>Resumen:</strong> es la síntesis final de la nota.</div>
            <div><strong>Sección / Subsec.:</strong> son H2/H3 Markdown normales. No necesitas usarlos para convertir a Cornell.</div>
          </div>
        </details>
      </div>

      <div class="tmn-editor-wrap">
        <textarea
          class="tmn-editor tmn-view"
          spellcheck="false"
          placeholder="Escribe aquí tus notas en Markdown…"
        ></textarea>

        <section class="tmn-cornell-editor tmn-view" aria-label="Editor Cornell" hidden>
          <div class="tmn-cornell-blocks"></div>
          <button class="tmn-add-block" type="button">+ Añadir bloque</button>

          <div class="tmn-summary-wrap">
            <label for="${APP}-summary">Resumen</label>
            <textarea
              id="${APP}-summary"
              class="tmn-summary-editor"
              spellcheck="false"
              placeholder="Resume las ideas principales con tus propias palabras…"
            ></textarea>
          </div>
        </section>

        <section class="tmn-review tmn-view" aria-label="Repaso Cornell" hidden>
          <div class="tmn-review-empty" hidden>No hay bloques Cornell con contenido para repasar.</div>

          <div class="tmn-review-card">
            <div class="tmn-review-progress"></div>
            <div class="tmn-review-cue"></div>
            <div class="tmn-review-notes" hidden></div>

            <div class="tmn-review-actions">
              <button class="tmn-review-prev" type="button" aria-label="Bloque anterior">← Anterior</button>
              <button class="tmn-review-reveal" type="button" aria-expanded="false">Revelar notas</button>
              <button class="tmn-review-next" type="button" aria-label="Bloque siguiente">Siguiente →</button>
            </div>
          </div>
        </section>
      </div>

      <div class="tmn-footer">
        <div class="tmn-status">Borrador local</div>
        <button class="tmn-save" type="button">Guardar nota</button>
      </div>
    `;

    document.body.appendChild(panel);

    panel.querySelector('.tmn-resizer').addEventListener(
      'pointerdown',
      startResize
    );

    panel.querySelector('.tmn-close').addEventListener('click', () => {
      setPanelOpen(false);
    });

    panel.querySelector('.tmn-folder-button').addEventListener('click', async () => {
      setStatus('Seleccionando carpeta…');

      try {
        await chooseDirectory();
        setStatus(`Carpeta configurada: ${directoryHandle.name}`, 'success');
      } catch (error) {
        if (error?.name === 'AbortError') {
          updateStatus();
        } else {
          console.error('[ChatGPT Markdown Notes] Error al seleccionar carpeta:', error);
          setStatus(error?.message || String(error), 'error');
        }
      }
    });

    panel.querySelector('.tmn-forget-folder').addEventListener('click', async () => {
      try {
        await forgetDirectory();
        setStatus('Carpeta olvidada.');
      } catch (error) {
        console.error('[ChatGPT Markdown Notes] Error al olvidar carpeta:', error);
        setStatus(error?.message || String(error), 'error');
      }
    });


    panel.querySelector('.tmn-create-new').addEventListener('click', createNewActiveNote);
    panel.querySelector('.tmn-choose-existing').addEventListener('click', () => {
      setLibraryVisible(true);
      refreshLibrary().catch(error => setLibraryStatus(error.message));
    });
    panel.querySelector('.tmn-library-use').addEventListener('click', () => {
      adoptSelectedDocument().catch(error => setLibraryStatus(error.message));
    });
    panel.querySelector('.tmn-library-back').addEventListener('click', () => setLibraryVisible(false));
    panel.querySelector('.tmn-library-refresh').addEventListener('click', () => {
      refreshLibrary().catch(error => setLibraryStatus(error.message));
    });
    panel.querySelector('.tmn-library-link').addEventListener('click', () => {
      changeLibraryLink(true).catch(error => setLibraryStatus(error.message));
    });
    panel.querySelector('.tmn-library-unlink').addEventListener('click', () => {
      changeLibraryLink(false).catch(error => setLibraryStatus(error.message));
    });

    panel.querySelector('.tmn-save').addEventListener('click', saveFile);

    panel.querySelector('.tmn-mode-switch').addEventListener('click', event => {
      const button = event.target instanceof Element
        ? event.target.closest('button[data-mode]')
        : null;

      if (!button) return;
      setNoteMode(button.dataset.mode);
    });

    const markdownToolbar = panel.querySelector('.tmn-markdown-toolbar');

    markdownToolbar.addEventListener('pointerdown', event => {
      const button = event.target instanceof Element
        ? event.target.closest('button[data-md-action]')
        : null;

      if (button) {
        event.preventDefault();
      }
    });

    markdownToolbar.addEventListener('click', event => {
      const button = event.target instanceof Element
        ? event.target.closest('button[data-md-action]')
        : null;

      if (!button) return;
      applyMarkdownAction(button.dataset.mdAction);
    });

    panel.querySelector('.tmn-cornell-assist').addEventListener('click', event => {
      const button = event.target instanceof Element
        ? event.target.closest('button[data-cornell-assist-action]')
        : null;

      if (!button) return;

      const action = button.dataset.cornellAssistAction;

      if (action === 'prepare') prepareCornellFromLibre();
      else if (action === 'cue') addCornellCueFromLibre();
      else if (action === 'summary') goToCornellSummaryFromLibre();
    });

    const rememberSelectionFromEvent = event => {
      if (isMarkdownTextarea(event.target)) {
        rememberMarkdownSelection(event.target);
      }
    };

    panel.addEventListener('focusin', rememberSelectionFromEvent);
    panel.addEventListener('select', rememberSelectionFromEvent);
    panel.addEventListener('keyup', rememberSelectionFromEvent);
    panel.addEventListener('mouseup', rememberSelectionFromEvent);
    panel.addEventListener('input', rememberSelectionFromEvent);

    panel.querySelector('.tmn-add-block').addEventListener('click', addCornellBlock);

    panel.querySelector('.tmn-cornell-blocks').addEventListener('input', event => {
      if (!activeState?.cornell || !(event.target instanceof HTMLTextAreaElement)) return;

      const blockId = event.target.dataset.blockId;
      const field = event.target.dataset.field;
      const block = activeState.cornell.blocks.find(item => item.id === blockId);

      if (!block || !['cue', 'notes'].includes(field)) return;

      block[field] = event.target.value;
      syncBodyFromCornell();
      renderSaveButton();
      updateStatus();
      scheduleDraftPersistence();
    });

    panel.querySelector('.tmn-cornell-blocks').addEventListener('click', event => {
      const button = event.target instanceof Element
        ? event.target.closest('button[data-action][data-block-id]')
        : null;

      if (!button) return;

      const blockId = button.dataset.blockId;

      if (button.dataset.action === 'up') moveCornellBlock(blockId, -1);
      else if (button.dataset.action === 'down') moveCornellBlock(blockId, 1);
      else if (button.dataset.action === 'addAfter') insertCornellBlockAfter(blockId);
      else if (button.dataset.action === 'delete') confirmCornellBlockDelete(button, blockId);
    });

    panel.querySelector('.tmn-summary-editor').addEventListener('input', event => {
      if (!activeState?.cornell) return;

      activeState.cornell.summary = event.target.value;
      syncBodyFromCornell();
      renderSaveButton();
      updateStatus();
      scheduleDraftPersistence();
    });

    panel.querySelector('.tmn-review-prev').addEventListener('click', () => {
      reviewIndex = Math.max(0, reviewIndex - 1);
      reviewRevealed = false;
      renderReview();
    });

    panel.querySelector('.tmn-review-next').addEventListener('click', () => {
      reviewIndex += 1;
      reviewRevealed = false;
      renderReview();
    });

    panel.querySelector('.tmn-review-reveal').addEventListener('click', () => {
      reviewRevealed = !reviewRevealed;
      renderReview();
    });

    const filenameInput = panel.querySelector('.tmn-file-name');

    filenameInput.addEventListener('input', event => {
      if (!activeState) return;

      const value = String(event.target.value || '').trim();
      activeState.manualFilename = value || null;

      renderSaveButton();
      updateStatus();
      scheduleDraftPersistence();
    });

    filenameInput.addEventListener('blur', () => {
      if (!activeState) return;

      const normalized = normalizeFilename(activeState.manualFilename);
      activeState.manualFilename = normalized || null;

      renderHeader();
      renderSaveButton();
      updateStatus();
      scheduleDraftPersistence();
    });

    panel.querySelector('.tmn-editor').addEventListener('input', event => {
      if (!activeState) return;

      activeState.body = event.target.value;

      // body es la fuente canónica. Cualquier proyección Cornell previa queda
      // obsoleta hasta que el Markdown vuelva a parsearse al entrar a Cornell.
      activeState.cornell = normalizeCornellState(null);

      renderCornellStructureAssistant();
      renderSaveButton();
      updateStatus();
      scheduleDraftPersistence();
    });
  }


  function maxPanelWidthForViewport() {
    // Conserva al menos ~420 px para el chat en escritorio.
    return Math.max(
      MIN_PANEL_WIDTH,
      Math.min(MAX_PANEL_WIDTH, window.innerWidth - 420)
    );
  }

  function clampPanelWidth(width) {
    const value = Number(width) || DEFAULT_PANEL_WIDTH;

    return Math.round(
      Math.max(
        MIN_PANEL_WIDTH,
        Math.min(value, maxPanelWidthForViewport())
      )
    );
  }

  function setPanelWidth(width, persist = true) {
    const value = clampPanelWidth(width);

    document.documentElement.style.setProperty(
      '--tmn-notes-width',
      `${value}px`
    );

    if (persist) {
      localStorage.setItem(PANEL_WIDTH_KEY, String(value));
    }

    return value;
  }

  function restorePanelWidth() {
    const saved = Number(localStorage.getItem(PANEL_WIDTH_KEY));

    setPanelWidth(
      Number.isFinite(saved) && saved > 0
        ? saved
        : DEFAULT_PANEL_WIDTH,
      false
    );
  }

  function startResize(event) {
    if (window.innerWidth <= 900) return;

    event.preventDefault();

    resizing = true;
    document.documentElement.classList.add(`${APP}-resizing`);

    const startX = event.clientX;
    const startingWidth = parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--tmn-notes-width')
    ) || DEFAULT_PANEL_WIDTH;

    const onMove = moveEvent => {
      if (!resizing) return;

      // Panel anclado a la derecha:
      // mover el borde a la izquierda => panel más ancho.
      const delta = startX - moveEvent.clientX;
      setPanelWidth(startingWidth + delta, false);
    };

    const onUp = () => {
      if (!resizing) return;

      resizing = false;
      document.documentElement.classList.remove(`${APP}-resizing`);

      const finalWidth = parseFloat(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--tmn-notes-width')
      ) || DEFAULT_PANEL_WIDTH;

      setPanelWidth(finalWidth, true);

      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onUp, true);
    };

    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onUp, true);
  }

  function setPanelOpen(open) {
    localStorage.setItem(PANEL_OPEN_KEY, open ? '1' : '0');

    document.documentElement.classList.toggle(`${APP}-open`, open);

    if (panel) panel.hidden = !open;
    if (launcher) launcher.hidden = open;

    if (open) {
      requestAnimationFrame(() => {
        if (libraryVisible) panel?.querySelector('.tmn-library-refresh')?.focus();
        else focusActiveEditor();
      });
    }
  }

  function focusActiveEditor() {
    if (!panel || !activeState) return;

    if (activeState.noteMode === 'freeform') {
      panel.querySelector('.tmn-editor')?.focus();
      return;
    }

    if (activeState.noteMode === 'cornell') {
      panel.querySelector('.tmn-cue-editor, .tmn-add-block')?.focus();
      return;
    }

    panel.querySelector('.tmn-review-reveal')?.focus();
  }

  function restorePanelState() {
    setPanelOpen(localStorage.getItem(PANEL_OPEN_KEY) === '1');
  }

  function renderFolder() {
    if (!panel) return;

    const label = panel.querySelector('.tmn-folder');
    const forget = panel.querySelector('.tmn-forget-folder');

    if (label) {
      label.textContent = directoryHandle
        ? `Carpeta: ${directoryHandle.name}`
        : 'Carpeta: no configurada';
    }

    if (forget) {
      forget.disabled = !directoryHandle;
    }
  }


  function setLibraryStatus(message) {
    const status = panel?.querySelector('.tmn-library-status');
    if (status) status.textContent = String(message || '');
  }

  function setLibraryVisible(visible) {
    libraryVisible = Boolean(visible);
    panel?.classList.toggle('tmn-library-open', libraryVisible);
    const region = panel?.querySelector('.tmn-library-view');
    if (region) region.hidden = !libraryVisible;
    renderLibrary();
    if (!libraryVisible) requestAnimationFrame(focusActiveEditor);
  }

  function renderLibrary() {
    if (!panel) return;
    const count = panel.querySelector('.tmn-linked-count');
    if (count) count.textContent = linkedFiles.length
      ? linkedFiles.length + ' archivo(s) vinculado(s)'
      : 'Sin archivos vinculados';
    panel.classList.toggle('tmn-library-open', libraryVisible);
    const region = panel.querySelector('.tmn-library-view');
    if (region) region.hidden = !libraryVisible;
    const list = panel.querySelector('.tmn-library-list');
    if (!list) return;
    list.replaceChildren();

    const indexed = new Map(libraryFiles.map(x => [x.name, x]));
    const orderedNames = [
      ...linkedFiles,
      ...libraryFiles.map(x => x.name).filter(name => !linkedFiles.includes(name))
    ];
    for (const name of orderedNames) {
      const entry = indexed.get(name);
      const row = document.createElement('button');
      row.type = 'button';
      row.textContent =
        (activeState?.sharedFilename === name ? 'Activa · ' : linkedFiles.includes(name) ? 'Vinculada · ' : '') +
        name + (entry ? '' : ' (no encontrado)');
      row.setAttribute('aria-current', String(selectedLibraryFile?.name === name));
      row.addEventListener('click', () => {
        openLibraryFile(name).catch(error => setLibraryStatus(error.message));
      });
      list.appendChild(row);
    }
    const preview = panel.querySelector('.tmn-library-preview');
    if (!preview) return;
    preview.hidden = !selectedLibraryFile;
    if (!selectedLibraryFile) return;

    const selected = selectedLibraryFile;
    panel.querySelector('.tmn-library-filename').textContent = selected.name;
    const originLink = panel.querySelector('.tmn-library-origin');
    const origin = validChatUrl(selected.originChatUrl);
    originLink.hidden = !origin;
    if (origin) originLink.href = origin;
    else originLink.removeAttribute('href');
    panel.querySelector('.tmn-library-body').textContent = selected.content;
    const isLinked = linkedFiles.includes(selected.name);
    panel.querySelector('.tmn-library-link').hidden = isLinked;
    panel.querySelector('.tmn-library-unlink').hidden = !isLinked;
    panel.querySelector('.tmn-library-use').disabled =
      selected.name === activeState?.sharedFilename &&
      activeState.sharedDirectoryId === directoryId;
  }

  async function refreshLibrary() {
    if (!directoryHandle) throw new Error('Configura primero la carpeta de notas.');
    if (!(await ensureReadPermission(directoryHandle))) {
      throw new Error('No se concedió permiso para leer la carpeta seleccionada.');
    }
    const initialChatKey = activeChatKey;
    const initialDirectoryId = directoryId;
    const available = [];
    const matched = [];
    const currentUrl = validChatUrl(getChatUrl());
    for await (const handle of directoryHandle.values()) {
      if (handle.kind !== 'file' || !/\.md$/i.test(handle.name)) continue;
      let originChatUrl = null;
      let linkedChatUrls = [];
      try {
        const file = await handle.getFile();
        if (file.size <= 5 * 1024 * 1024) {
          const meta = parseMarkdownMetadata(await file.text());
          originChatUrl = meta.originChatUrl;
          linkedChatUrls = meta.linkedChatUrls;
        }
      } catch (error) {
        console.warn('[Markdown Notes] No se pudo leer el archivo:', handle.name, error);
      }
      available.push({ name: handle.name, originChatUrl, linkedChatUrls });
      if (currentUrl && linkedChatUrls.includes(currentUrl)) matched.push(handle.name);
    }
    if (initialChatKey !== activeChatKey || initialDirectoryId !== directoryId) return;

    libraryFiles = available.sort((a,b) => a.name.localeCompare(b.name));
    const existingNames = new Set(available.map(item => item.name));
    const combined = [...new Set([
      ...linkedFiles.filter(name => !existingNames.has(name)),
      ...matched
    ])];
    if (combined.length !== linkedFiles.length ||
        combined.some(name => !linkedFiles.includes(name))) {
      await persistChatLinks(combined, initialChatKey);
      linkedFiles = combined;
    }
    renderLibrary();
    setLibraryStatus(libraryFiles.length + ' archivo(s) Markdown encontrados.');
  }


  function splitSavedMarkdownDocument(raw) {
    const text = String(raw || '');
    const metaMatch = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
    if (!metaMatch) return { prefix: '', body: text.trimEnd() };
    let cursor = metaMatch[0].length;
    const titleMatch = /^title:\s*(.*)$/m.exec(metaMatch[1]);
    let title = null;
    if (titleMatch) {
      try { title = JSON.parse(titleMatch[1].trim()); }
      catch { title = titleMatch[1].trim(); }
    }
    if (/^\r?\n/.test(text.slice(cursor))) cursor += text.slice(cursor).match(/^\r?\n/)[0].length;
    const heading = /^# ([^\r\n]+)\r?\n(?:\r?\n)?/.exec(text.slice(cursor));
    if (heading && typeof title === 'string' && heading[1] === title) cursor += heading[0].length;
    return { prefix: text.slice(0,cursor), body: text.slice(cursor).trimEnd() };
  }

  function updateSavedMarkdownBody(raw, body) {
    const prefix = splitSavedMarkdownDocument(raw).prefix;
    const contents = String(body || '').trimEnd();
    return prefix + (contents ? contents + (raw.includes('\r\n') ? '\r\n' : '\n') : '');
  }

  async function openLibraryFile(filename) {
    const initialChatKey = activeChatKey;
    const initialDirectoryId = directoryId;
    const content = await readMarkdownFile(filename);
    if (initialChatKey !== activeChatKey || initialDirectoryId !== directoryId) return;
    const meta = parseMarkdownMetadata(content);
    selectedLibraryFile = {
      name: filename,
      content,
      originChatUrl: meta.originChatUrl
    };
    renderLibrary();
    setLibraryStatus('Vista de solo lectura. No modifica tu borrador.');
  }

  async function changeLibraryLink(add) {
    if (!selectedLibraryFile || !directoryHandle) return;
    const chatKey = activeChatKey;
    const dirId = directoryId;
    const chatUrl = validChatUrl(getChatUrl());
    if (!chatKey?.startsWith('chat:') || !chatUrl)
      throw new Error('Primero abre un chat guardado con una URL /c/ válida.');
    const allowed = await ensureWritePermission(directoryHandle);
    if (!allowed) throw new Error('Se necesita permiso de escritura para actualizar los vínculos.');

    const name = selectedLibraryFile.name;
    let original;
    try {
      original = await readMarkdownFile(name);
    } catch (error) {
      if (!add && error?.name === 'NotFoundError') {
        const next = linkedFiles.filter(x => x !== name);
        await persistChatLinks(next, chatKey);
        if (chatKey === activeChatKey && dirId === directoryId) linkedFiles = next;
        selectedLibraryFile = null;
        renderLibrary();
        setLibraryStatus('Referencia al archivo ausente eliminada del índice local.');
        return;
      }
      throw error;
    }
    if (chatKey !== activeChatKey || dirId !== directoryId)
      throw new Error('Cambió la conversación o carpeta. Repite la acción en el chat actual.');

    const updated = withLinkedChatUrl(original, chatUrl, add);
    await rewriteMetadata(name, original, updated);
    const next = add
      ? [...new Set([...linkedFiles, name])]
      : linkedFiles.filter(x => x !== name);
    // Keep the captured chat/directory key, even if SPA navigation happened
    // while the browser was writing the file.
    await idbSet(LINKS_STORE, dirId + ':' + chatKey, next);
    if (chatKey !== activeChatKey || dirId !== directoryId) return;
    linkedFiles = next;
    selectedLibraryFile = { name, content: updated, originChatUrl: parseMarkdownMetadata(updated).originChatUrl };
    renderLibrary();
    setLibraryStatus(add ? 'Documento vinculado al chat actual.' : 'Documento desvinculado; el archivo no fue eliminado.');
  }

  function renderHeader() {
    if (!panel) return;

    const filename = currentFilename();
    const filenameInput = panel.querySelector('.tmn-file-name');

    // No reemplazar texto mientras el usuario está escribiendo. El valor se
    // normaliza al perder el foco o justo antes de guardar.
    if (filenameInput && document.activeElement !== filenameInput) {
      filenameInput.value = filename;
    }
  }

  function renderModeSelector() {
    if (!panel || !activeState) return;

    for (const button of panel.querySelectorAll('.tmn-mode-switch button[data-mode]')) {
      const active = button.dataset.mode === activeState.noteMode;
      button.setAttribute('aria-selected', String(active));
    }
  }

  function renderCornellEditor() {
    if (!panel || !activeState?.cornell) return;

    const container = panel.querySelector('.tmn-cornell-blocks');
    const summary = panel.querySelector('.tmn-summary-editor');

    container.replaceChildren();

    if (activeState.cornell.blocks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'tmn-cornell-empty';
      empty.textContent = 'No hay bloques. Añade uno para comenzar.';
      container.appendChild(empty);
    }

    activeState.cornell.blocks.forEach((block, index) => {
      const article = document.createElement('article');
      article.className = 'tmn-cornell-block';
      article.dataset.blockId = block.id;

      const header = document.createElement('div');
      header.className = 'tmn-cornell-block-header';

      const title = document.createElement('div');
      title.className = 'tmn-cornell-block-title';
      title.textContent = `Bloque ${index + 1}`;

      const actions = document.createElement('div');
      actions.className = 'tmn-cornell-actions';

      const actionDefs = [
        ['up', '↑', `Mover bloque ${index + 1} arriba`, index === 0],
        ['down', '↓', `Mover bloque ${index + 1} abajo`, index === activeState.cornell.blocks.length - 1],
        ['addAfter', '+', `Añadir bloque después del bloque ${index + 1}`, false],
        ['delete', 'Eliminar', `Eliminar bloque ${index + 1}`, false]
      ];

      for (const [action, text, label, disabled] of actionDefs) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.action = action;
        button.dataset.blockId = block.id;
        button.textContent = text;
        button.setAttribute('aria-label', label);
        button.title = label;
        button.disabled = disabled;
        actions.appendChild(button);
      }

      header.append(title, actions);

      const grid = document.createElement('div');
      grid.className = 'tmn-cornell-grid';

      const cueField = document.createElement('div');
      cueField.className = 'tmn-cornell-field';

      const cueLabel = document.createElement('label');
      const cueId = `${APP}-cue-${block.id}`;
      cueLabel.htmlFor = cueId;
      cueLabel.textContent = 'Cue / Pregunta';

      const cue = document.createElement('textarea');
      cue.id = cueId;
      cue.className = 'tmn-cue-editor';
      cue.dataset.blockId = block.id;
      cue.dataset.field = 'cue';
      cue.value = block.cue;
      cue.spellcheck = false;
      cue.placeholder = 'Pregunta, concepto o palabra clave…';

      cueField.append(cueLabel, cue);

      const notesField = document.createElement('div');
      notesField.className = 'tmn-cornell-field';

      const notesLabel = document.createElement('label');
      const notesId = `${APP}-notes-${block.id}`;
      notesLabel.htmlFor = notesId;
      notesLabel.textContent = 'Notas';

      const notes = document.createElement('textarea');
      notes.id = notesId;
      notes.className = 'tmn-block-notes';
      notes.dataset.blockId = block.id;
      notes.dataset.field = 'notes';
      notes.value = block.notes;
      notes.spellcheck = false;
      notes.placeholder = 'Notas Markdown asociadas a este cue…';

      notesField.append(notesLabel, notes);
      grid.append(cueField, notesField);
      article.append(header, grid);
      container.appendChild(article);
    });

    if (summary.value !== activeState.cornell.summary) {
      summary.value = activeState.cornell.summary;
    }
  }

  function reviewableBlocks() {
    if (!activeState?.cornell) return [];

    return activeState.cornell.blocks.filter(block =>
      String(block.cue || '').trim() || String(block.notes || '').trim()
    );
  }

  function renderReview() {
    if (!panel || !activeState) return;

    const blocks = reviewableBlocks();
    const empty = panel.querySelector('.tmn-review-empty');
    const card = panel.querySelector('.tmn-review-card');

    if (blocks.length === 0) {
      empty.hidden = false;
      card.hidden = true;
      reviewIndex = 0;
      reviewRevealed = false;
      return;
    }

    empty.hidden = true;
    card.hidden = false;

    reviewIndex = Math.max(0, Math.min(reviewIndex, blocks.length - 1));

    const block = blocks[reviewIndex];
    const cue = String(block.cue || '').trim() || `Nota ${reviewIndex + 1}`;
    const notes = String(block.notes || '').trim() || 'Sin notas.';

    const progress = panel.querySelector('.tmn-review-progress');
    const cueEl = panel.querySelector('.tmn-review-cue');
    const notesEl = panel.querySelector('.tmn-review-notes');
    const reveal = panel.querySelector('.tmn-review-reveal');
    const prev = panel.querySelector('.tmn-review-prev');
    const next = panel.querySelector('.tmn-review-next');

    progress.textContent = `${reviewIndex + 1} de ${blocks.length}`;
    cueEl.textContent = cue;
    notesEl.textContent = notes;
    notesEl.hidden = !reviewRevealed;

    reveal.textContent = reviewRevealed ? 'Ocultar notas' : 'Revelar notas';
    reveal.setAttribute('aria-expanded', String(reviewRevealed));

    prev.disabled = reviewIndex === 0;
    next.disabled = reviewIndex === blocks.length - 1;
  }

  function renderEditor() {
    if (!panel || !activeState) return;

    renderMarkdownToolbar();
    renderCornellStructureAssistant();

    const editor = panel.querySelector('.tmn-editor');
    const cornell = panel.querySelector('.tmn-cornell-editor');
    const review = panel.querySelector('.tmn-review');

    const mode = activeState.noteMode;
    editor.hidden = mode !== 'freeform';
    cornell.hidden = mode !== 'cornell';
    review.hidden = mode !== 'review';

    if (mode === 'freeform') {
      if (editor.value !== activeState.body) {
        editor.value = activeState.body;
      }
      return;
    }

    if (mode === 'cornell') {
      renderCornellEditor();
      return;
    }

    renderReview();
  }

  function renderSaveButton() {
    if (!panel || !activeState) return;

    const button = panel.querySelector('.tmn-save');
    const canSave = hasManualFilename();

    if (!canSave) {
      button.textContent = 'Guardar nota';
    } else if (activeState.filename || activeState.lastSavedAt) {
      button.textContent = 'Guardar cambios';
    } else {
      button.textContent = 'Guardar nota';
    }

    button.disabled = saving || !canSave;
    button.title = canSave
      ? ''
      : 'Escribe un nombre de archivo antes de guardar.';
  }

  function setStatus(message, kind = '') {
    if (!panel) return;

    const el = panel.querySelector('.tmn-status');
    el.textContent = message;
    el.dataset.kind = kind;
  }

  function updateStatus() {
    if (!activeState || !panel) return;

    if (saving) {
      setStatus('Guardando cambios…');
      return;
    }

    if (!hasManualFilename()) {
      setStatus('Escribe un nombre de archivo para poder guardar.');
      return;
    }

    if (isDirty()) {
      setStatus('Cambios sin guardar · borrador persistido localmente');
      return;
    }

    if (activeState.lastSavedAt) {
      setStatus('Guardado', 'success');
      return;
    }

    if (activeState.body) {
      setStatus('Borrador persistido localmente');
      return;
    }

    setStatus('Borrador local');
  }

  function renderAll() {
    renderHeader();
    renderModeSelector();
    renderEditor();
    renderFolder();
    renderSaveButton();
    updateStatus();
    renderLibrary();
  }

  // ===========================================================================
  // Guardar archivo
  // ===========================================================================

  async function saveFile() {
    if (saving || !activeState) return;

    const targetFilename = currentFilename();

    if (!targetFilename) {
      setStatus('Escribe un nombre de archivo antes de guardar.', 'error');
      panel?.querySelector('.tmn-file-name')?.focus();
      return;
    }

    activeState.manualFilename = targetFilename;

    saving = true;
    renderHeader();
    renderSaveButton();
    updateStatus();

    try {
      if (!directoryHandle) {
        setStatus('Selecciona la carpeta donde guardar la nota…');
        await chooseDirectory();
      }

      const allowed = await ensureWritePermission(directoryHandle);

      if (!allowed) {
        throw new Error(
          'No se concedió permiso de escritura para la carpeta configurada.'
        );
      }

      if (!activeState.createdAt) {
        activeState.createdAt = localIsoTimestamp();
      }

      let existingText = null;
      try { existingText = await readMarkdownFile(targetFilename); }
      catch (error) { if (error?.name !== 'NotFoundError') throw error; }
      const previous = parseMarkdownMetadata(existingText);
      // The provenance already recorded on disk is authoritative. Never
      // replace it with the active conversation just because the file is edited.
      if (previous.originChatId) activeState.originChatId = previous.originChatId;
      else if (!activeState.originChatId) activeState.originChatId = getChatId();
      if (previous.originChatUrl) activeState.originChatUrl = previous.originChatUrl;
      else if (!activeState.originChatUrl && activeState.originChatId)
        activeState.originChatUrl = 'https://chatgpt.com/c/' + activeState.originChatId;
      renderHeader();
      setStatus(`Guardando cambios en ${targetFilename}…`);

      await writeMarkdownFile(
        directoryHandle,
        targetFilename,
        buildMarkdown(previous.linkedChatUrls)
      );

      // Sólo después de una escritura exitosa registramos el nombre del archivo
      // y el cuerpo canónico que realmente se escribió.
      activeState.filename = targetFilename;
      activeState.savedBody = activeState.body;
      activeState.lastSavedAt = localIsoTimestamp();

      await persistActiveState();

      setStatus('Guardado', 'success');
    } catch (error) {
      if (error?.name === 'AbortError') {
        updateStatus();
      } else {
        console.error('[ChatGPT Markdown Notes] Error al guardar:', error);
        setStatus(error?.message || String(error), 'error');
      }
    } finally {
      saving = false;
      renderSaveButton();
      updateStatus();
    }
  }

  // ===========================================================================
  // Cambio de conversación / SPA
  // ===========================================================================

  async function switchToChat(chatKey, previousChatKey = null) {
    clearTimeout(draftSaveTimer);

    if (previousChatKey && activeState) {
      try {
        await idbSet(DRAFT_STORE, previousChatKey, activeState);
      } catch (error) {
        console.warn('[ChatGPT Markdown Notes] No se pudo persistir el chat anterior:', error);
      }
    }

    // Si estábamos en un chat nuevo sin ID y ChatGPT acaba de asignar /c/<id>,
    // migramos el borrador temporal al ID definitivo cuando todavía no existe
    // estado para esa conversación.
    if (
      previousChatKey?.startsWith('new:') &&
      chatKey.startsWith('chat:')
    ) {
      const existing = await idbGet(DRAFT_STORE, chatKey);

      if (!existing) {
        const temporary = await idbGet(DRAFT_STORE, previousChatKey);

        if (temporary) {
          await idbSet(DRAFT_STORE, chatKey, temporary);
          await idbDelete(DRAFT_STORE, previousChatKey);
        }
      }

      sessionStorage.removeItem(NEW_CHAT_SESSION_KEY);
    }

    activeChatKey = chatKey;
    activeState = await loadState(chatKey);
    linkedFiles = await loadChatLinks(chatKey);
    selectedLibraryFile = null;
    renderAll();
    renderLibrary();
  }

  async function checkNavigation() {
    const currentKey = getCurrentChatKey();

    if (currentKey !== activeChatKey) {
      const previous = activeChatKey;
      await switchToChat(currentKey, previous);
      return;
    }

  }

  // ===========================================================================
  // Atajos
  // ===========================================================================

  function onGlobalKeyDown(event) {
    if (!panel || panel.hidden) return;

    const modifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    if (
      modifier &&
      !event.altKey &&
      isMarkdownTextarea(event.target) &&
      ['b', 'i', 'k'].includes(key)
    ) {
      event.preventDefault();
      event.stopPropagation();

      rememberMarkdownSelection(event.target);

      const action = key === 'b'
        ? 'bold'
        : key === 'i'
          ? 'italic'
          : 'link';

      applyMarkdownAction(action);
      return;
    }

    const isSave = modifier && key === 's';
    if (!isSave) return;

    const editor = panel.querySelector('.tmn-editor');
    const filenameInput = panel.querySelector('.tmn-file-name');
    const insideCornellEditor = event.target instanceof Element &&
      Boolean(event.target.closest('.tmn-cornell-editor'));

    if (event.target !== editor && event.target !== filenameInput && !insideCornellEditor) return;

    event.preventDefault();
    event.stopPropagation();

    saveFile();
  }

  // ===========================================================================
  // Bootstrap
  // ===========================================================================

  async function bootstrap() {
    addStyles();
    createLauncher();
    createPanel();
    restorePanelWidth();

    await loadSavedDirectoryHandle();

    activeChatKey = getCurrentChatKey();
    activeState = await loadState(activeChatKey);
    linkedFiles = await loadChatLinks(activeChatKey);

    renderAll();
    restorePanelState();

    document.addEventListener('keydown', onGlobalKeyDown, true);

    navigationTimer = window.setInterval(() => {
      checkNavigation().catch(error => {
        console.error('[ChatGPT Markdown Notes] Error al detectar navegación:', error);
      });
    }, 700);

    window.addEventListener('beforeunload', () => {
      if (!activeChatKey || !activeState) return;

      // IndexedDB es asíncrono y beforeunload no espera; el borrador normalmente
      // ya se guardó por debounce. Este intento sólo cubre cambios muy recientes.
      idbSet(DRAFT_STORE, activeChatKey, activeState).catch(() => {});
    });

    window.addEventListener('resize', () => {
      const currentWidth = parseFloat(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--tmn-notes-width')
      ) || DEFAULT_PANEL_WIDTH;

      setPanelWidth(currentWidth, false);
    });
    console.info('[ChatGPT Markdown Notes] v1.10.0 cargado');
  }

  bootstrap().catch(error => {
    console.error('[ChatGPT Markdown Notes] Error de inicialización:', error);
  });
})();