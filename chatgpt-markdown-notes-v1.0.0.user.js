// ==UserScript==
// @name         ChatGPT Markdown Notes
// @namespace    https://chatgpt.com/
// @version      1.0.0
// @description  Crea notas Markdown manuales y las guarda como archivos .md en una carpeta local elegida por el usuario.
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const APP = 'tm-chatgpt-markdown-notes';
  const DB_NAME = `${APP}-db`;
  const DB_VERSION = 1;
  const STORE_NAME = 'handles';
  const DIRECTORY_KEY = 'notes-directory';

  let directoryHandle = null;
  let modal = null;
  let widget = null;
  let saving = false;

  // ---------------------------------------------------------------------------
  // IndexedDB: persiste el FileSystemDirectoryHandle entre recargas.
  // @grant none es intencional: mantiene acceso directo a las Web APIs de la
  // página, incluido showDirectoryPicker() en navegadores Chromium compatibles.
  // ---------------------------------------------------------------------------

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function idbGet(key) {
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  }

  async function idbSet(key, value) {
    const db = await openDb();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(value, key);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Transacción IndexedDB abortada'));
      });
    } finally {
      db.close();
    }
  }

  async function idbDelete(key) {
    const db = await openDb();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(key);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Transacción IndexedDB abortada'));
      });
    } finally {
      db.close();
    }
  }

  async function loadSavedDirectoryHandle() {
    try {
      const saved = await idbGet(DIRECTORY_KEY);
      if (saved && saved.kind === 'directory') {
        directoryHandle = saved;
      }
    } catch (error) {
      console.warn('[ChatGPT Markdown Notes] No se pudo recuperar la carpeta guardada:', error);
    }

    updateFolderUi();
  }

  // ---------------------------------------------------------------------------
  // File System Access API
  // ---------------------------------------------------------------------------

  function supportsFileSystemAccess() {
    return typeof window.showDirectoryPicker === 'function';
  }

  async function chooseDirectory() {
    if (!supportsFileSystemAccess()) {
      throw new Error(
        'Este navegador no expone showDirectoryPicker(). Usa Chrome/Edge u otro navegador Chromium compatible.'
      );
    }

    // call(window, ...) evita problemas de "Illegal invocation" en algunos
    // entornos donde la función pierde su receptor Window.
    const handle = await window.showDirectoryPicker.call(window, {
      id: 'chatgpt-markdown-notes',
      mode: 'readwrite',
      startIn: 'documents'
    });

    directoryHandle = handle;
    await idbSet(DIRECTORY_KEY, handle);
    updateFolderUi();

    return handle;
  }

  async function ensureWritePermission(handle) {
    if (!handle) return false;

    const options = { mode: 'readwrite' };

    // requestPermission() se ejecuta directamente desde el click/atajo del
    // usuario. Si el permiso ya estaba concedido, normalmente retorna
    // "granted" sin volver a preguntar.
    if (typeof handle.requestPermission === 'function') {
      const state = await handle.requestPermission(options);
      return state === 'granted';
    }

    if (typeof handle.queryPermission === 'function') {
      return (await handle.queryPermission(options)) === 'granted';
    }

    // Navegadores antiguos: dejamos que la escritura determine si hay permiso.
    return true;
  }

  async function forgetDirectory() {
    directoryHandle = null;
    await idbDelete(DIRECTORY_KEY);
    updateFolderUi();
  }

  async function fileExists(dir, filename) {
    try {
      await dir.getFileHandle(filename);
      return true;
    } catch (error) {
      if (error?.name === 'NotFoundError') return false;
      throw error;
    }
  }

  async function uniqueFilename(dir, desiredFilename) {
    if (!(await fileExists(dir, desiredFilename))) return desiredFilename;

    const dot = desiredFilename.toLowerCase().endsWith('.md') ? desiredFilename.length - 3 : -1;
    const base = dot >= 0 ? desiredFilename.slice(0, dot) : desiredFilename;
    const ext = dot >= 0 ? '.md' : '';

    for (let i = 2; i < 10000; i += 1) {
      const candidate = `${base}-${i}${ext}`;
      if (!(await fileExists(dir, candidate))) return candidate;
    }

    throw new Error('No se pudo generar un nombre de archivo único.');
  }

  async function writeTextFile(dir, filename, text) {
    const fileHandle = await dir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();

    try {
      await writable.write(text);
    } finally {
      await writable.close();
    }
  }

  // ---------------------------------------------------------------------------
  // Markdown / metadata
  // ---------------------------------------------------------------------------

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

    if (!slug) slug = 'nota';

    // Nombres reservados comunes de Windows, por portabilidad.
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(slug)) {
      slug = `nota-${slug}`;
    }

    return slug;
  }

  function getChatContext() {
    const match = location.pathname.match(/\/c\/([^/?#]+)/);
    const chatId = match ? match[1] : null;
    const chatUrl = chatId
      ? `${location.origin}/c/${chatId}`
      : `${location.origin}${location.pathname}`;

    return { chatId, chatUrl };
  }

  function buildMarkdown(title, body) {
    const { chatId, chatUrl } = getChatContext();
    const created = localIsoTimestamp();

    const metadata = [
      '---',
      `title: ${yamlString(title)}`,
      `created: ${yamlString(created)}`,
      `source: ${yamlString('ChatGPT')}`,
      chatId ? `chat_id: ${yamlString(chatId)}` : 'chat_id: null',
      `chat_url: ${yamlString(chatUrl)}`,
      '---',
      '',
      `# ${title.trim()}`,
      ''
    ];

    const cleanBody = String(body || '').trim();
    if (cleanBody) metadata.push(cleanBody, '');

    return metadata.join('\n');
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  function addStyles() {
    const style = document.createElement('style');
    style.id = `${APP}-styles`;
    style.textContent = `
      #${APP}-widget {
        position: fixed;
        right: 16px;
        bottom: 62px;
        z-index: 2147482999;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #${APP}-widget button {
        min-height: 34px;
        border: 1px solid rgba(127,127,127,.28);
        border-radius: 10px;
        padding: 0 11px;
        background: rgba(30,30,30,.94);
        color: #fff;
        box-shadow: 0 8px 28px rgba(0,0,0,.22);
        backdrop-filter: blur(10px);
        cursor: pointer;
        font: 600 12px/1 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #${APP}-modal[hidden] {
        display: none !important;
      }

      #${APP}-modal {
        position: fixed;
        inset: 0;
        z-index: 2147483641;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #${APP}-modal .tmn-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,.56);
      }

      #${APP}-modal .tmn-dialog {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(860px, calc(100vw - 32px));
        max-height: min(860px, calc(100vh - 32px));
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(127,127,127,.32);
        border-radius: 14px;
        background: #202123;
        color: #f5f5f5;
        box-shadow: 0 30px 90px rgba(0,0,0,.45);
      }

      #${APP}-modal .tmn-header,
      #${APP}-modal .tmn-footer {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
      }

      #${APP}-modal .tmn-header {
        border-bottom: 1px solid rgba(127,127,127,.24);
      }

      #${APP}-modal .tmn-footer {
        border-top: 1px solid rgba(127,127,127,.24);
      }

      #${APP}-modal .tmn-body {
        overflow: auto;
        padding: 16px;
      }

      #${APP}-modal .tmn-header strong {
        font-size: 15px;
      }

      #${APP}-modal .tmn-close {
        margin-left: auto;
      }

      #${APP}-modal label {
        display: block;
        margin-bottom: 14px;
      }

      #${APP}-modal label > span,
      #${APP}-modal .tmn-label {
        display: block;
        margin-bottom: 7px;
        font-size: 12px;
        font-weight: 700;
      }

      #${APP}-modal input,
      #${APP}-modal textarea {
        box-sizing: border-box;
        width: 100%;
        border: 1px solid rgba(127,127,127,.32);
        border-radius: 9px;
        padding: 10px;
        background: #151617;
        color: #f5f5f5;
      }

      #${APP}-modal input {
        min-height: 38px;
        font: 13px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #${APP}-modal textarea {
        min-height: 320px;
        resize: vertical;
        font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }

      #${APP}-modal .tmn-meta-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }

      #${APP}-modal .tmn-meta-box {
        min-width: 0;
        flex: 1;
        border: 1px solid rgba(127,127,127,.25);
        border-radius: 9px;
        padding: 9px 10px;
        background: rgba(255,255,255,.035);
      }

      #${APP}-modal .tmn-meta-title {
        font-size: 11px;
        opacity: .62;
        margin-bottom: 3px;
      }

      #${APP}-modal .tmn-meta-value {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font: 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }

      #${APP}-modal button {
        min-height: 34px;
        border: 1px solid rgba(127,127,127,.32);
        border-radius: 8px;
        padding: 0 12px;
        background: #2f3033;
        color: #f5f5f5;
        cursor: pointer;
      }

      #${APP}-modal button:disabled {
        opacity: .45;
        cursor: not-allowed;
      }

      #${APP}-modal .tmn-folder-actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      #${APP}-modal .tmn-status {
        min-width: 0;
        flex: 1;
        font-size: 11px;
        opacity: .72;
      }

      #${APP}-modal .tmn-status[data-kind="error"] {
        color: #ffb4b4;
        opacity: 1;
      }

      #${APP}-modal .tmn-status[data-kind="success"] {
        color: #b7f5c4;
        opacity: 1;
      }

      #${APP}-modal .tmn-save {
        font-weight: 700;
        background: #f5f5f5;
        color: #111;
      }

      #${APP}-toast {
        position: fixed;
        right: 16px;
        bottom: 108px;
        z-index: 2147483642;
        max-width: min(420px, calc(100vw - 32px));
        border: 1px solid rgba(127,127,127,.3);
        border-radius: 10px;
        padding: 10px 12px;
        background: #202123;
        color: #f5f5f5;
        box-shadow: 0 12px 38px rgba(0,0,0,.3);
        font: 12px/1.4 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      @media (max-width: 700px) {
        #${APP}-widget {
          right: 10px;
          bottom: 58px;
        }

        #${APP}-modal .tmn-dialog {
          width: calc(100vw - 16px);
          max-height: calc(100vh - 16px);
        }

        #${APP}-modal .tmn-meta-row {
          align-items: stretch;
          flex-direction: column;
        }

        #${APP}-modal textarea {
          min-height: 240px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createWidget() {
    if (document.getElementById(`${APP}-widget`)) return;

    widget = document.createElement('div');
    widget.id = `${APP}-widget`;
    widget.innerHTML = `<button type="button" title="Crear una nota Markdown">📝 Nota</button>`;
    document.body.appendChild(widget);

    widget.querySelector('button').addEventListener('click', openNoteEditor);
  }

  function createModal() {
    if (modal) return;

    modal = document.createElement('div');
    modal.id = `${APP}-modal`;
    modal.hidden = true;

    modal.innerHTML = `
      <div class="tmn-backdrop"></div>
      <div class="tmn-dialog" role="dialog" aria-modal="true" aria-label="Nueva nota Markdown">
        <div class="tmn-header">
          <div>
            <strong>Nueva nota Markdown</strong>
            <div style="margin-top:3px;opacity:.62;font-size:11px">
              Un archivo .md por nota. El contenido lo escribes manualmente.
            </div>
          </div>
          <button class="tmn-close" type="button" title="Cerrar">✕</button>
        </div>

        <div class="tmn-body">
          <label>
            <span>Título</span>
            <input class="tmn-title" type="text" autocomplete="off" placeholder="Ej. WireGuard host route /32">
          </label>

          <div class="tmn-meta-row">
            <div class="tmn-meta-box">
              <div class="tmn-meta-title">Archivo</div>
              <div class="tmn-meta-value tmn-filename">nota.md</div>
            </div>

            <div class="tmn-meta-box">
              <div class="tmn-meta-title">Carpeta</div>
              <div class="tmn-meta-value tmn-folder">No seleccionada</div>
            </div>

            <div class="tmn-folder-actions">
              <button class="tmn-choose-folder" type="button">Elegir carpeta</button>
              <button class="tmn-forget-folder" type="button">Olvidar</button>
            </div>
          </div>

          <label>
            <span>Contenido Markdown</span>
            <textarea class="tmn-content" spellcheck="false" placeholder="Escribe aquí tu nota..."></textarea>
          </label>
        </div>

        <div class="tmn-footer">
          <div class="tmn-status">⌘/Ctrl + S para guardar</div>
          <button class="tmn-cancel" type="button">Cancelar</button>
          <button class="tmn-save" type="button">Guardar .md</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const title = modal.querySelector('.tmn-title');
    title.addEventListener('input', updateFilenamePreview);

    modal.querySelector('.tmn-backdrop').addEventListener('click', closeNoteEditor);
    modal.querySelector('.tmn-close').addEventListener('click', closeNoteEditor);
    modal.querySelector('.tmn-cancel').addEventListener('click', closeNoteEditor);
    modal.querySelector('.tmn-save').addEventListener('click', saveCurrentNote);

    modal.querySelector('.tmn-choose-folder').addEventListener('click', async () => {
      setStatus('Abriendo selector de carpeta…');
      try {
        await chooseDirectory();
        setStatus(`Carpeta seleccionada: ${directoryHandle.name}`, 'success');
      } catch (error) {
        if (error?.name === 'AbortError') {
          setStatus('Selección de carpeta cancelada.');
        } else {
          console.error('[ChatGPT Markdown Notes] Error al seleccionar carpeta:', error);
          setStatus(error?.message || String(error), 'error');
        }
      }
    });

    modal.querySelector('.tmn-forget-folder').addEventListener('click', async () => {
      try {
        await forgetDirectory();
        setStatus('Carpeta olvidada.');
      } catch (error) {
        console.error('[ChatGPT Markdown Notes] Error al olvidar carpeta:', error);
        setStatus(error?.message || String(error), 'error');
      }
    });
  }

  function updateFilenamePreview() {
    if (!modal) return;
    const title = modal.querySelector('.tmn-title')?.value || '';
    const el = modal.querySelector('.tmn-filename');
    if (el) el.textContent = `${slugify(title)}.md`;
  }

  function updateFolderUi() {
    if (!modal) return;

    const folder = modal.querySelector('.tmn-folder');
    const forget = modal.querySelector('.tmn-forget-folder');

    if (folder) folder.textContent = directoryHandle?.name || 'No seleccionada';
    if (forget) forget.disabled = !directoryHandle;
  }

  function setStatus(message, kind = '') {
    if (!modal) return;

    const status = modal.querySelector('.tmn-status');
    if (!status) return;

    status.textContent = message;
    status.dataset.kind = kind;
  }

  async function openNoteEditor() {
    createModal();

    if (!directoryHandle) {
      await loadSavedDirectoryHandle();
    }

    const title = modal.querySelector('.tmn-title');
    const content = modal.querySelector('.tmn-content');

    title.value = '';
    content.value = '';
    updateFilenamePreview();
    updateFolderUi();
    setStatus('⌘/Ctrl + S para guardar');

    modal.hidden = false;
    requestAnimationFrame(() => title.focus());
  }

  function closeNoteEditor() {
    if (saving) return;
    if (modal) modal.hidden = true;
  }

  function showToast(message) {
    document.getElementById(`${APP}-toast`)?.remove();

    const toast = document.createElement('div');
    toast.id = `${APP}-toast`;
    toast.textContent = message;
    document.body.appendChild(toast);

    window.setTimeout(() => toast.remove(), 3500);
  }

  async function saveCurrentNote() {
    if (saving || !modal || modal.hidden) return;

    const titleEl = modal.querySelector('.tmn-title');
    const bodyEl = modal.querySelector('.tmn-content');
    const saveButton = modal.querySelector('.tmn-save');

    const title = titleEl.value.trim();
    const body = bodyEl.value;

    if (!title) {
      setStatus('Escribe un título antes de guardar.', 'error');
      titleEl.focus();
      return;
    }

    saving = true;
    saveButton.disabled = true;
    setStatus('Preparando guardado…');

    try {
      // Si todavía no hay carpeta, el click actual en Guardar sirve como gesto
      // del usuario para abrir el selector nativo.
      if (!directoryHandle) {
        setStatus('Selecciona la carpeta donde guardar tus notas…');
        await chooseDirectory();
      }

      setStatus('Validando permiso de escritura…');
      const allowed = await ensureWritePermission(directoryHandle);
      if (!allowed) {
        throw new Error('No se concedió permiso de escritura para la carpeta seleccionada.');
      }

      const desired = `${slugify(title)}.md`;
      const filename = await uniqueFilename(directoryHandle, desired);
      const markdown = buildMarkdown(title, body);

      setStatus(`Guardando ${filename}…`);
      await writeTextFile(directoryHandle, filename, markdown);

      setStatus(`Guardado: ${filename}`, 'success');
      showToast(`Nota guardada: ${filename}`);

      window.setTimeout(() => {
        if (modal) modal.hidden = true;
      }, 350);
    } catch (error) {
      if (error?.name === 'AbortError') {
        setStatus('Guardado cancelado.', '');
      } else {
        console.error('[ChatGPT Markdown Notes] Error al guardar:', error);
        setStatus(error?.message || String(error), 'error');
      }
    } finally {
      saving = false;
      saveButton.disabled = false;
    }
  }

  function onGlobalKeyDown(event) {
    if (!modal || modal.hidden) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeNoteEditor();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      event.stopPropagation();
      saveCurrentNote();
    }
  }

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------

  addStyles();
  createWidget();
  createModal();
  loadSavedDirectoryHandle();

  document.addEventListener('keydown', onGlobalKeyDown, true);

  console.info('[ChatGPT Markdown Notes] cargado');
})();
