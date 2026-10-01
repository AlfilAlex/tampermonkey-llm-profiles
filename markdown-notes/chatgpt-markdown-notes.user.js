// ==UserScript==
// @name         ChatGPT Markdown Notes
// @namespace    https://chatgpt.com/
// @version      1.5.0
// @description  Panel lateral acoplado y redimensionable para notas Markdown persistentes por conversación.
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const APP = 'tm-chatgpt-markdown-notes';
  const DB_NAME = `${APP}-db`;
  const DB_VERSION = 2;

  const HANDLE_STORE = 'handles';
  const DRAFT_STORE = 'drafts';
  const DIRECTORY_KEY = 'notes-directory';

  const PANEL_OPEN_KEY = `${APP}:panel-open`;
  const PANEL_WIDTH_KEY = `${APP}:panel-width`;
  const DEFAULT_PANEL_WIDTH = 430;
  const MIN_PANEL_WIDTH = 300;
  const MAX_PANEL_WIDTH = 760;
  const NEW_CHAT_SESSION_KEY = `${APP}:new-chat-session-key`;
  const FALLBACK_NOTE_TITLE = 'Nota de ChatGPT';

  let directoryHandle = null;
  let panel = null;
  let launcher = null;

  let activeChatKey = null;
  let activeState = null;

  let saving = false;
  let draftSaveTimer = null;
  let navigationTimer = null;
  let titleTimer = null;
  let resizing = false;

  let reviewIndex = 0;
  let reviewRevealed = false;

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
  // Conversación y título
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

  function normalizeTitle(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .replace(/\s*[-|·]\s*ChatGPT\s*$/i, '')
      .trim();
  }

  function isGenericTitle(value) {
    const title = normalizeTitle(value).toLowerCase();

    return (
      !title ||
      title === 'chatgpt' ||
      title === 'nuevo chat' ||
      title === 'new chat' ||
      title === 'chat' ||
      title === 'saltar al contenido' ||
      title === 'saltar al contenido principal' ||
      title === 'ir al contenido' ||
      title === 'skip to content' ||
      title === 'skip to main content'
    );
  }

  function isFallbackNoteTitle(value) {
    return normalizeTitle(value).toLowerCase() === FALLBACK_NOTE_TITLE.toLowerCase();
  }

  function titleFromSidebarLink() {
    const currentPath = location.pathname;
    const chatId = getChatId();

    // Un chat nuevo sin /c/<id> no tiene todavía un enlace de conversación
    // estable en el sidebar. Evitamos considerar navegación de la propia página.
    if (!chatId) return '';

    for (const anchor of document.querySelectorAll('a[href]')) {
      try {
        const rawHref = anchor.getAttribute('href') || '';
        const url = new URL(rawHref, location.href);

        // Enlaces de accesibilidad como href="#main" heredan el pathname
        // actual, por lo que comparar solo pathname produce falsos positivos.
        if (url.hash) continue;
        if (url.pathname !== currentPath) continue;

        // ChatGPT cambia con frecuencia la estructura del sidebar. Preferimos
        // nodos que suelen contener únicamente el nombre de la conversación y
        // dejamos textContent completo como último fallback.
        const candidates = [
          anchor.querySelector('[data-testid*="title"]')?.textContent,
          anchor.querySelector('[dir="auto"]')?.textContent,
          anchor.querySelector('.truncate')?.textContent,
          anchor.getAttribute('title'),
          anchor.getAttribute('aria-label'),
          anchor.textContent
        ];

        for (const candidate of candidates) {
          const text = normalizeTitle(candidate);
          if (!isGenericTitle(text)) return text;
        }
      } catch {
        // Ignorar href inválido.
      }
    }

    return '';
  }

  function titleFromHeading() {
    const selectors = [
      '[data-testid="conversation-title"]',
      '[data-testid="chat-title"]',
      'main h1'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const text = normalizeTitle(el?.textContent);

      if (!isGenericTitle(text)) return text;
    }

    return '';
  }

  function getDetectedChatTitle() {
    const candidates = [
      titleFromSidebarLink(),
      titleFromHeading(),
      normalizeTitle(document.title)
    ];

    for (const candidate of candidates) {
      if (!isGenericTitle(candidate)) return candidate;
    }

    // Importante: una ausencia de título no debe convertirse en un título real.
    // El fallback visual se aplica en currentNoteTitle(), pero no se persiste.
    return '';
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

    blocks.forEach((block, index) => {
      const cue = String(block.cue || '')
        .replace(/\s+/g, ' ')
        .trim();
      const notes = String(block.notes || '').trim();
      const heading = cue || 'Nota';

      lines.push(`### ${index + 1}. ${heading}`, '');

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
    let summaryIndex = -1;
    const blockIndexes = [];

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

      if (summaryIndex < 0 && trimmed === '## Summary') {
        summaryIndex = index;
        continue;
      }

      if (
        summaryIndex < 0 &&
        /^###\s+\d+\.\s+.+\s*$/.test(line)
      ) {
        blockIndexes.push(index);
      }
    }

    return { startIndex, summaryIndex, blockIndexes };
  }

  function parseCornellBody(value) {
    const body = String(value || '').replace(/\r\n?/g, '\n');
    const lines = body.split('\n');
    const { startIndex, summaryIndex, blockIndexes } = findCornellStructure(lines);

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

      const heading = lines[absoluteStart].match(/^###\s+\d+\.\s+(.+?)\s*$/);
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

  function createEmptyState() {
    return {
      body: '',
      savedBody: '',
      noteTitle: null,
      manualFilename: null,
      filename: null,
      filenameFallbackId: null,
      filenameFallbackAt: null,
      noteMode: 'freeform',
      savedNoteMode: null,
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

    const storedTitle = typeof value.noteTitle === 'string' && value.noteTitle.trim()
      ? value.noteTitle.trim()
      : null;

    const noteTitle = storedTitle &&
      !isFallbackNoteTitle(storedTitle) &&
      !isGenericTitle(storedTitle)
      ? storedTitle
      : null;

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
      body,
      savedBody: typeof value.savedBody === 'string' ? value.savedBody : '',
      noteTitle,
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
    return normalizeState(await idbGet(DRAFT_STORE, chatKey));
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
    const filenameChanged = Boolean(activeState.filename) &&
      currentFilename() !== activeState.filename;

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

    const block = activeState.cornell.blocks[index];
    const hasContent = String(block.cue || '').trim() || String(block.notes || '').trim();

    if (
      hasContent &&
      !window.confirm('¿Eliminar este bloque Cornell? Esta acción elimina el bloque del borrador local.')
    ) {
      return;
    }

    activeState.cornell.blocks.splice(index, 1);
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

  function adoptDetectedTitle() {
    if (!activeState || activeState.noteTitle) return false;

    const detectedTitle = getDetectedChatTitle();
    if (!detectedTitle) return false;

    activeState.noteTitle = detectedTitle;

    // Persistimos el título en cuanto aparece. ChatGPT puede desmontar o
    // re-renderizar temporalmente el sidebar; después de adoptarlo no queremos
    // volver al fallback por una lectura transitoria del DOM.
    scheduleDraftPersistence();
    return true;
  }

  function currentNoteTitle() {
    return activeState?.noteTitle || getDetectedChatTitle() || FALLBACK_NOTE_TITLE;
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

  function shortFallbackId() {
    const browserCrypto = globalThis.crypto;

    if (typeof browserCrypto?.randomUUID === 'function') {
      return browserCrypto.randomUUID().replaceAll('-', '').slice(0, 8).toLowerCase();
    }

    if (typeof browserCrypto?.getRandomValues === 'function') {
      const bytes = new Uint8Array(4);
      browserCrypto.getRandomValues(bytes);

      return Array.from(bytes, byte =>
        byte.toString(16).padStart(2, '0')
      ).join('');
    }

    return Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, '0')
      .slice(0, 8);
  }

  function ensureGeneratedFilenameIdentity() {
    if (!activeState) {
      return {
        id: shortFallbackId(),
        at: new Date().toISOString()
      };
    }

    const validId = typeof activeState.filenameFallbackId === 'string' &&
      /^[a-f0-9]{8}$/i.test(activeState.filenameFallbackId);

    const validAt = typeof activeState.filenameFallbackAt === 'string' &&
      !Number.isNaN(new Date(activeState.filenameFallbackAt).getTime());

    if (!validId) {
      // Migración desde el fallback anterior: ID y fecha nacen juntos bajo la
      // nueva regla. No reutilizamos un timestamp legacy aislado.
      activeState.filenameFallbackId = shortFallbackId();
      activeState.filenameFallbackAt = new Date().toISOString();
      scheduleDraftPersistence();
    } else if (!validAt) {
      activeState.filenameFallbackAt = new Date().toISOString();
      scheduleDraftPersistence();
    }

    return {
      id: activeState.filenameFallbackId,
      at: activeState.filenameFallbackAt
    };
  }

  function generatedFallbackFilename() {
    const identity = ensureGeneratedFilenameIdentity();
    let date = new Date(identity.at);

    if (Number.isNaN(date.getTime())) {
      date = new Date();
    }

    return (
      `${identity.id}_` +
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_` +
      `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}.md`
    );
  }

  function automaticFilename() {
    const title = activeState?.noteTitle || getDetectedChatTitle();
    if (title) return `${slugify(title)}.md`;

    return generatedFallbackFilename();
  }

  function currentFilename() {
    const manual = normalizeFilename(activeState?.manualFilename);
    return manual || automaticFilename();
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

    directoryHandle = handle;
    await idbSet(HANDLE_STORE, DIRECTORY_KEY, handle);
    renderFolder();

    return handle;
  }

  async function forgetDirectory() {
    directoryHandle = null;
    await idbDelete(HANDLE_STORE, DIRECTORY_KEY);
    renderFolder();
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

  function slugify(value) {
    let slug = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' y ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-')
      .slice(0, 120)
      .replace(/-+$/g, '');

    if (!slug) slug = 'nota-chatgpt';

    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(slug)) {
      slug = `nota-${slug}`;
    }

    return slug;
  }

  function buildMarkdown() {
    const title = currentNoteTitle();
    const chatId = getChatId();
    const chatUrl = getChatUrl();
    const outputMode = activeOutputMode();

    const created = activeState.createdAt || localIsoTimestamp();
    const updated = localIsoTimestamp();

    const lines = [
      '---',
      `title: ${yamlString(title)}`,
      `created: ${yamlString(created)}`,
      `updated: ${yamlString(updated)}`,
      `source: ${yamlString('ChatGPT')}`
    ];

    if (outputMode === 'cornell') {
      lines.push(`note_method: ${yamlString('cornell')}`);
    }

    lines.push(
      chatId ? `chat_id: ${yamlString(chatId)}` : 'chat_id: null',
      `chat_url: ${yamlString(chatUrl)}`,
      '---',
      '',
      `# ${title}`,
      ''
    );

    if (outputMode === 'freeform') {
      const body = String(activeState.body || '').trim();

      if (body) {
        lines.push(body, '');
      }

      return lines.join('\n');
    }

    lines.push('## Cornell Notes', '');

    const blocks = activeState.cornell.blocks.filter(block =>
      String(block.cue || '').trim() || String(block.notes || '').trim()
    );

    blocks.forEach((block, index) => {
      const cue = String(block.cue || '')
        .replace(/\s+/g, ' ')
        .trim();
      const notes = String(block.notes || '').trim();
      const heading = cue || 'Nota';

      lines.push(`### ${index + 1}. ${heading}`, '');

      if (notes) {
        lines.push(notes, '');
      }
    });

    lines.push('## Summary', '');

    const summary = String(activeState.cornell.summary || '').trim();
    if (summary) {
      lines.push(summary, '');
    }

    return lines.join('\n');
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

      #${APP}-panel .tmn-chat-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
        font-weight: 700;
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
          <div class="tmn-chat-title">${FALLBACK_NOTE_TITLE}</div>
          <input
            class="tmn-file-name"
            type="text"
            aria-label="Nombre del archivo Markdown"
            title="Editable. Vacíalo para volver al nombre automático."
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

      <div class="tmn-mode-switch" role="tablist" aria-label="Modo de notas">
        <button type="button" role="tab" data-mode="freeform">Libre</button>
        <button type="button" role="tab" data-mode="cornell">Cornell</button>
        <button type="button" role="tab" data-mode="review">Repaso</button>
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

    panel.querySelector('.tmn-save').addEventListener('click', saveFile);

    panel.querySelector('.tmn-mode-switch').addEventListener('click', event => {
      const button = event.target instanceof Element
        ? event.target.closest('button[data-mode]')
        : null;

      if (!button) return;
      setNoteMode(button.dataset.mode);
    });

    panel.querySelector('.tmn-add-block').addEventListener('click', addCornellBlock);

    panel.querySelector('.tmn-cornell-blocks').addEventListener('input', event => {
      if (!activeState?.cornell || !(event.target instanceof HTMLTextAreaElement)) return;

      const blockId = event.target.dataset.blockId;
      const field = event.target.dataset.field;
      const block = activeState.cornell.blocks.find(item => item.id === blockId);

      if (!block || !['cue', 'notes'].includes(field)) return;

      block[field] = event.target.value;
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
      else if (button.dataset.action === 'delete') deleteCornellBlock(blockId);
    });

    panel.querySelector('.tmn-summary-editor').addEventListener('input', event => {
      if (!activeState?.cornell) return;

      activeState.cornell.summary = event.target.value;
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
      requestAnimationFrame(focusActiveEditor);
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

  function renderHeader() {
    if (!panel) return;

    adoptDetectedTitle();

    const title = currentNoteTitle();
    const filename = currentFilename();
    const filenameInput = panel.querySelector('.tmn-file-name');

    panel.querySelector('.tmn-chat-title').textContent = title;

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

    if (activeState.filename || activeState.lastSavedAt) {
      button.textContent = 'Guardar cambios';
    } else {
      button.textContent = 'Guardar nota';
    }

    button.disabled = saving;
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

    if (isDirty()) {
      setStatus('Cambios sin guardar · borrador persistido localmente');
      return;
    }

    if (activeState.lastSavedAt) {
      setStatus('Guardado', 'success');
      return;
    }

    if (activeState.body || hasCornellContent()) {
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
  }

  // ===========================================================================
  // Guardar archivo
  // ===========================================================================

  async function saveFile() {
    if (saving || !activeState) return;

    saving = true;
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

      // Si el título ya apareció, lo adoptamos para metadatos y para el nombre
      // automático. Un nombre manual siempre tiene prioridad.
      adoptDetectedTitle();

      if (activeState.manualFilename) {
        activeState.manualFilename = normalizeFilename(activeState.manualFilename) || null;
      }

      const targetFilename = currentFilename();

      if (!activeState.createdAt) {
        activeState.createdAt = localIsoTimestamp();
      }

      renderHeader();
      setStatus(`Guardando cambios en ${targetFilename}…`);

      await writeMarkdownFile(
        directoryHandle,
        targetFilename,
        buildMarkdown()
      );

      // Sólo después de una escritura exitosa registramos el nombre del archivo
      // que realmente existe en disco y el snapshot correspondiente al modo
      // que produjo el archivo.
      activeState.filename = targetFilename;

      const outputMode = activeOutputMode();
      activeState.savedNoteMode = outputMode;

      if (outputMode === 'freeform') {
        activeState.savedBody = activeState.body;
      } else {
        activeState.savedCornellSnapshot = cornellSnapshot(activeState.cornell);
      }

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

    renderAll();
  }

  async function checkNavigation() {
    const currentKey = getCurrentChatKey();

    if (currentKey !== activeChatKey) {
      const previous = activeChatKey;
      await switchToChat(currentKey, previous);
      return;
    }

    // Antes del primer guardado seguimos el título actual de ChatGPT para que
    // el nombre del archivo se actualice cuando ChatGPT genere/renombre el chat.
    if (activeState && !activeState.noteTitle) {
      renderHeader();    }
  }

  // ===========================================================================
  // Atajos
  // ===========================================================================

  function onGlobalKeyDown(event) {
    const isSave = (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === 's';

    if (!isSave || !panel || panel.hidden) return;

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

    renderAll();
    restorePanelState();

    document.addEventListener('keydown', onGlobalKeyDown, true);

    navigationTimer = window.setInterval(() => {
      checkNavigation().catch(error => {
        console.error('[ChatGPT Markdown Notes] Error al detectar navegación:', error);
      });
    }, 700);

    titleTimer = window.setInterval(() => {
      if (activeState && !activeState.noteTitle) {
        renderHeader();
      }
    }, 1200);

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

    console.info('[ChatGPT Markdown Notes] v1.4.2 cargado');
  }

  bootstrap().catch(error => {
    console.error('[ChatGPT Markdown Notes] Error de inicialización:', error);
  });
})();