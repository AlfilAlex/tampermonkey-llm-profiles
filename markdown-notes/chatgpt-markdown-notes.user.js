// ==UserScript==
// @name         ChatGPT Markdown Notes
// @namespace    https://chatgpt.com/
// @version      1.2.1
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
      title === 'chat'
    );
  }

  function isFallbackNoteTitle(value) {
    return normalizeTitle(value).toLowerCase() === FALLBACK_NOTE_TITLE.toLowerCase();
  }

  function titleFromSidebarLink() {
    const currentPath = location.pathname;

    for (const anchor of document.querySelectorAll('a[href]')) {
      try {
        const url = new URL(anchor.href, location.href);
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

  function createEmptyState() {
    return {
      body: '',
      savedBody: '',
      noteTitle: null,
      filename: null,
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

    // v1.2.0 podía persistir el fallback "Nota de ChatGPT" como si fuera el
    // título real. Lo tratamos como no resuelto para que pueda autocorregirse
    // cuando ChatGPT exponga el título verdadero.
    const noteTitle = storedTitle && !isFallbackNoteTitle(storedTitle)
      ? storedTitle
      : null;

    return {
      body: typeof value.body === 'string' ? value.body : '',
      savedBody: typeof value.savedBody === 'string' ? value.savedBody : '',
      noteTitle,
      filename: typeof value.filename === 'string' && value.filename.trim()
        ? value.filename
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
    return Boolean(activeState && activeState.body !== activeState.savedBody);
  }

  function currentNoteTitle() {
    return activeState?.noteTitle || getDetectedChatTitle() || FALLBACK_NOTE_TITLE;
  }

  function provisionalFilename() {
    const chatId = getChatId();
    const rawIdentity = chatId || activeChatKey?.replace(/^new:/, '') || 'nuevo';
    const identity = String(rawIdentity)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 12) || 'nuevo';

    return `nota-chatgpt-${identity}.md`;
  }

  function currentFilename() {
    if (activeState?.noteTitle) {
      return activeState.filename || `${slugify(activeState.noteTitle)}.md`;
    }

    const detectedTitle = getDetectedChatTitle();
    if (detectedTitle) return `${slugify(detectedTitle)}.md`;

    if (activeState?.filename) return activeState.filename;
    return provisionalFilename();
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

    const created = activeState.createdAt || localIsoTimestamp();
    const updated = localIsoTimestamp();

    const lines = [
      '---',
      `title: ${yamlString(title)}`,
      `created: ${yamlString(created)}`,
      `updated: ${yamlString(updated)}`,
      `source: ${yamlString('ChatGPT')}`,
      chatId ? `chat_id: ${yamlString(chatId)}` : 'chat_id: null',
      `chat_url: ${yamlString(chatUrl)}`,
      '---',
      '',
      `# ${title}`,
      ''
    ];

    const body = String(activeState.body || '').trim();

    if (body) {
      lines.push(body, '');
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
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        opacity: .58;
        font: 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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

      #${APP}-panel .tmn-editor-wrap {
        min-height: 0;
        flex: 1;
        display: flex;
        padding: 10px;
      }

      #${APP}-panel textarea {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        min-height: 180px;
        resize: none;
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
          <div class="tmn-file-name">nota-chatgpt.md</div>
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

      <div class="tmn-editor-wrap">
        <textarea
          class="tmn-editor"
          spellcheck="false"
          placeholder="Escribe aquí tus notas en Markdown…"
        ></textarea>
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
      panel?.querySelector('.tmn-editor')?.focus();
    }
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

    const title = currentNoteTitle();
    const filename = currentFilename();

    panel.querySelector('.tmn-chat-title').textContent = title;
    panel.querySelector('.tmn-file-name').textContent = filename;
  }

  function renderEditor() {
    if (!panel || !activeState) return;

    const editor = panel.querySelector('.tmn-editor');

    if (editor.value !== activeState.body) {
      editor.value = activeState.body;
    }
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

    if (activeState.body) {
      setStatus('Borrador persistido localmente');
      return;
    }

    setStatus('Borrador local');
  }

  function renderAll() {
    renderHeader();
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

      // Sólo fijamos la identidad definitiva cuando existe un título real.
      // Si ChatGPT todavía no lo expone, guardamos con un nombre provisional
      // único por chat sin congelar el fallback visual como noteTitle.
      if (!activeState.noteTitle) {
        const detectedTitle = getDetectedChatTitle();

        if (detectedTitle) {
          activeState.noteTitle = detectedTitle;
          activeState.filename = `${slugify(detectedTitle)}.md`;
        }
      }

      if (!activeState.filename) {
        activeState.filename = activeState.noteTitle
          ? `${slugify(activeState.noteTitle)}.md`
          : provisionalFilename();
      }

      if (!activeState.createdAt) {
        activeState.createdAt = localIsoTimestamp();
      }

      renderHeader();
      setStatus(`Guardando cambios en ${activeState.filename}…`);

      await writeMarkdownFile(
        directoryHandle,
        activeState.filename,
        buildMarkdown()
      );

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

    if (event.target !== editor) return;

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

    console.info('[ChatGPT Markdown Notes] v1.2.1 cargado');
  }

  bootstrap().catch(error => {
    console.error('[ChatGPT Markdown Notes] Error de inicialización:', error);
  });
})();