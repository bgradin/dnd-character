import { evaluateFormula, defaultFormulas, isProficiencyField } from './formulas';
let data = {};
const sheetsPath = '/api/dnd/v1';
const legacySheetId = '__legacy__';
let legacyBackend = false;
const sheetLists = new WeakMap();
const openedSheets = new WeakMap();
const preloadedSheets = new WeakMap();
let activeUser = null;

function loadSheet(user, id, legacy) {
  if (!preloadedSheets.has(user)) preloadedSheets.set(user, new Map());
  const pending = preloadedSheets.get(user);
  if (!pending.has(id)) {
    const loading = (legacy ? Promise.resolve(legacy) :
      request(`${sheetsPath}/${encodeURIComponent(id)}`)).catch(error => {
        pending.delete(id);
        throw error;
      });
    pending.set(id, loading);
  }
  return pending.get(id);
}

export async function preloadSheets(user) {
  const sheets = await listSheets(user);
  await Promise.all(sheets.map(sheet => loadSheet(user, sheet.sheetId, sheet.legacy && sheet)));
}

function updateSheetList(user, sheet) {
  const sheets = user && sheetLists.get(user);
  if (!sheets) return;
  const index = sheets.findIndex(item => item.sheetId === sheet.sheetId);
  sheetLists.set(user, index < 0 ? [...sheets, sheet] :
    sheets.map(item => item.sheetId === sheet.sheetId ? { ...item, ...sheet } : item));
}
let sheetId = null;
let collectionLoaded = false;
let revision = 0;
let dirty = false;
let saving = null;
let notify = () => {};
let timer;
let blocked = false;
let storageKey;
let lastEditedAt = 0;
let lastSavedAt = 0;
let leavingConfirmed = false;

export async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(path, {
      credentials: 'same-origin', signal: controller.signal, ...options,
      headers: { 'Content-Type': 'application/json', 'X-Site-Action': '1', ...options.headers }
    });
    if (!response.ok) {
      const error = new Error(response.status === 409
        ? 'This sheet changed in another tab. Copy your changes before reloading.'
        : response.status === 401 ? 'Your session expired. Sign in again to save.'
        : response.status === 404 ? 'This character sheet could not be found.' : 'Unable to save or load. Please try again.');
      error.status = response.status;
      throw error;
    }
    return response.status === 204 ? null : await response.json();
  } finally { clearTimeout(timeout); }
}


export async function listSheets(user) {
  if (user && sheetLists.has(user)) return sheetLists.get(user);
  const result = await request(sheetsPath);
  legacyBackend = Boolean(result && result.schemaVersion === 1 && result.data &&
    typeof result.data === 'object' && !Array.isArray(result.data) && !('sheets' in result));
  if (legacyBackend) {
    const sheets = [{ ...result, sheetId: legacySheetId, legacy: true }];
    if (user) sheetLists.set(user, sheets);
    return sheets;
  }
  if (!result || !Array.isArray(result.sheets) || result.sheets.some(sheet =>
    !sheet || typeof sheet.sheetId !== 'string' || !sheet.sheetId ||
    !sheet.data || typeof sheet.data !== 'object' || Array.isArray(sheet.data))) {
    throw new Error('Unable to load character sheets: the server returned an unexpected response. Please try again.');
  }
  if (user) sheetLists.set(user, result.sheets);
  return result.sheets;
}

export async function createSheet(user) {
  if (legacyBackend) throw new Error('Creating additional characters requires an updated server.');
  const sheet = await request(sheetsPath, {
    method: 'POST',
    body: JSON.stringify({ schemaVersion: 1, revision: 0, data: {
      playerName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      formulas: defaultFormulas()
    } })
  });
  updateSheetList(user, sheet);
  return sheet;
}

export async function deleteSheet(id, user) {
  if (legacyBackend && id === legacySheetId) throw new Error('Deleting characters requires an updated server.');
  await request(`${sheetsPath}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const opened = openedSheets.get(user);
  if (opened) opened.delete(id);
  const preloaded = preloadedSheets.get(user);
  if (preloaded) preloaded.delete(id);
  const sheets = sheetLists.get(user);
  if (sheets) sheetLists.set(user, sheets.filter(sheet => sheet.sheetId !== id));
  const identity = user.id || user.userId || user.email;
  if (identity == null) return;
  try {
    const key = `dnd-character:v1:${identity}`;
    localStorage.removeItem(`${key}:${encodeURIComponent(id)}`);
    const legacy = JSON.parse(localStorage.getItem(key));
    if (legacy && legacy.sheetId === id) localStorage.removeItem(key);
  } catch (_) { /* Storage availability must not prevent server deletion. */ }
}

function persist() {
  cacheOpenedSheet();
  if (sheetId) updateSheetList(activeUser, { sheetId, data: { ...data }, revision, schemaVersion: 1 });
  if (!storageKey) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify({ schemaVersion: 1, sheetId, data, revision, lastEditedAt, lastSavedAt }));
  } catch (_) { /* Autosave still works when browser storage is unavailable. */ }
}

function cacheOpenedSheet() {
  if (!activeUser || !sheetId) return;
  if (!openedSheets.has(activeUser)) openedSheets.set(activeUser, new Map());
  openedSheets.get(activeUser).set(sheetId, {
    data, revision, lastEditedAt, lastSavedAt, dirty, blocked,
    collectionLoaded, legacyBackend,
  });
}

function schedule(delay = 600) {
  clearTimeout(timer);
  timer = setTimeout(() => save().catch(() => {}), delay);
}

export async function initialize(onStatus, user, selectedSheetId) {
  activeUser = user;
  fields.clear();
  notify = onStatus;
  clearTimeout(timer);
  // Never share a recovery copy between signed-in accounts.
  const identity = user.id || user.userId || user.email;
  storageKey = identity == null ? null : `dnd-character:v1:${identity}${selectedSheetId ? `:${encodeURIComponent(selectedSheetId)}` : ''}`;
  const opened = openedSheets.get(user);
  const previous = selectedSheetId && opened && opened.get(selectedSheetId);
  if (previous) {
    sheetId = selectedSheetId;
    ({ data, revision, lastEditedAt, lastSavedAt, dirty, blocked,
      collectionLoaded, legacyBackend } = previous);
    notify(blocked || !collectionLoaded ? 'Disconnected' : dirty ? 'Pending' : 'Synced');
    if (dirty && !blocked) schedule(0);
    return;
  }
  let cached;
  try {
    cached = JSON.parse(localStorage.getItem(storageKey));
    if (!cached && selectedSheetId && identity != null) {
      const legacy = JSON.parse(localStorage.getItem(`dnd-character:v1:${identity}`));
      if (legacy && (legacy.sheetId === selectedSheetId ||
        (selectedSheetId === legacySheetId && !legacy.sheetId))) cached = legacy;
    }
    if (!cached || cached.schemaVersion !== 1 || !cached.data || typeof cached.data !== 'object' || Array.isArray(cached.data)) cached = null;
  } catch (_) { cached = null; }
  blocked = false;
  dirty = false;
  sheetId = selectedSheetId || cached && cached.sheetId || null;
  collectionLoaded = false;
  let document;
  try {
    const preloaded = preloadedSheets.get(user);
    if (selectedSheetId && preloaded && preloaded.has(selectedSheetId)) {
      document = await preloaded.get(selectedSheetId);
      legacyBackend = selectedSheetId === legacySheetId;
    } else if (selectedSheetId && selectedSheetId !== legacySheetId) {
      legacyBackend = false;
      document = await loadSheet(user, selectedSheetId);
    } else {
      const sheets = await listSheets();
      document = sheets.find(sheet => sheet.sheetId === sheetId) || (!selectedSheetId && sheets[0]);
      if (selectedSheetId && !document) throw new Error('This character sheet could not be found.');
    }
    collectionLoaded = true;
  }
  catch (error) {
    if (!cached || error.status) throw error;
  }
  if (document && document.schemaVersion !== 1) throw new Error('This sheet needs a newer application version.');
  // The API has no edit timestamps; recover pending edits only for the selected sheet.
  const recover = cached && (!cached.sheetId || cached.sheetId === (document && document.sheetId) || !collectionLoaded)
    && (!document || cached.lastEditedAt > cached.lastSavedAt);
  sheetId = document ? document.sheetId : collectionLoaded ? null : sheetId;
  data = recover ? cached.data : document ? document.data : {};
  revision = document ? document.revision : collectionLoaded ? 0 : cached.revision;
  lastEditedAt = recover ? cached.lastEditedAt : 0;
  lastSavedAt = recover ? cached.lastSavedAt : Date.now();
  dirty = Boolean((collectionLoaded && !document) || (recover && lastEditedAt > lastSavedAt));
  if (Object.keys(data).length === 0) {
    data.formulas = defaultFormulas();
    lastEditedAt = Math.max(Date.now(), lastSavedAt + 1);
    dirty = true;
  }
  if (data.class === undefined && typeof data.classAndLevel === 'string') {
    // Split simple legacy values such as "Wizard 5"; preserve other text verbatim.
    const match = data.classAndLevel.trim().match(/^(.*?)\s+(?:level\s+)?(\d+)$/i);
    data.class = match ? match[1] : data.classAndLevel;
    if (data.level === undefined && match) data.level = match[2];
    lastEditedAt = Math.max(Date.now(), lastSavedAt + 1);
    dirty = true;
  }
  if (data.playerName === undefined) {
    data.playerName = [user.firstName, user.lastName].filter(Boolean).join(' ');
    lastEditedAt = Math.max(Date.now(), lastSavedAt + 1);
    dirty = true;
  }
  persist();
  notify(!collectionLoaded ? 'Disconnected' : dirty ? 'Pending' : 'Synced');
  if (dirty) schedule(0);
}

export async function save() {
  clearTimeout(timer);
  if (saving) { await saving; return save(); }
  if (!dirty) return;
  if (blocked) throw new Error('Reload the sheet before saving again. Copy your changes first.');
  persist();
  const snapshot = JSON.stringify(data);
  const editedAt = lastEditedAt;
  notify('Syncing');
  saving = (async () => {
    if (!collectionLoaded && !sheetId) {
      const sheets = await listSheets();
      const existing = sheets[0];
      sheetId = existing ? existing.sheetId : null;
      revision = existing ? existing.revision : 0;
      collectionLoaded = true;
    }
    return request(sheetId && !(legacyBackend && sheetId === legacySheetId) ? `${sheetsPath}/${encodeURIComponent(sheetId)}` : sheetsPath, {
      method: sheetId ? 'PUT' : 'POST', keepalive: true,
      body: JSON.stringify({ schemaVersion: 1, revision: sheetId ? revision : 0, data: JSON.parse(snapshot) })
    });
  })().then(result => {
    sheetId = legacyBackend ? legacySheetId : result.sheetId;
    revision = result.revision;
    dirty = lastEditedAt !== editedAt;
    // An edit made during this request must remain newer than the saved marker.
    lastSavedAt = dirty ? editedAt : Math.max(Date.now(), editedAt);
    persist();
    notify(dirty ? 'Pending' : 'Synced');
  }).catch(error => {
    blocked = error.status === 409 || error.status === 401;
    cacheOpenedSheet();
    notify('Disconnected');
    if (!blocked) schedule(5000);
    throw error;
  }).finally(() => { saving = null; });
  await saving;
  if (dirty) return save();
}

export async function prepareToLeave() {
  try { await save(); return true; }
  catch (_) { return window.confirm('Your latest changes have not been saved to the server. Leave without saving?'); }
}

window.addEventListener('beforeunload', event => {
  if (leavingConfirmed) { leavingConfirmed = false; return; }
  if (dirty) {
    persist();
    save().catch(() => {});
    event.preventDefault();
    event.returnValue = '';
  }
});
window.addEventListener('online', () => {
  if (dirty && !blocked) schedule(0);
  else if (!dirty) notify('Synced');
});
window.addEventListener('offline', () => notify('Disconnected'));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && dirty) save().catch(() => {});
});
document.addEventListener('click', async event => {
  const link = event.target.closest && event.target.closest('a[href]');
  if (!dirty || event.defaultPrevented || !link || link.hasAttribute('download') || (link.target && link.target !== '_self') || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = new URL(link.href, window.location.href);
  if (target.href === window.location.href || (target.origin === window.location.origin && target.pathname === window.location.pathname && target.search === window.location.search && target.hash)) return;
  event.preventDefault();
  if (await prepareToLeave()) {
    leavingConfirmed = true;
    window.location.assign(link.href);
  }
});

const registered = new WeakSet();
const fields = new Map();
const listeners = new Set();
export const subscribeFields = callback => { listeners.add(callback); return () => listeners.delete(callback); };
export const sheetFields = () => Array.from(fields.values()).filter(input => input.isConnected !== false);
export const fieldFormula = name => (data.formulas || {})[name];
export function formulaValue(name, formulas = data.formulas || {}, visiting = new Set()) {
  if (visiting.has(name)) throw new Error('This formula creates a circular reference.');
  if (!formulas[name]) {
    const raw = data[name];
    if (isProficiencyField(name)) return raw === true ? 1 : 0;
    if (raw === true) return 1;
    if (raw === false) return 0;
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  }
  visiting.add(name);
  const value = evaluateFormula(formulas[name], reference => formulaValue(reference, formulas, visiting));
  visiting.delete(name);
  return value;
}
export function previewFormula(name, tokens) {
  return formulaValue(name, { ...data.formulas, [name]: tokens });
}
function refreshFormulas() {
  fields.forEach((input, name) => {
    if (input.isConnected === false) return;
    const active = input.type !== 'checkbox' && Boolean(fieldFormula(name));
    input.readOnly = active;
    if (input.classList) input.classList.toggle('formula-active', active);
    if (!active) return;
    try {
      const result = formulaValue(name);
      data[name] = String(Number(result.toFixed(8)));
      input.value = data[name];
      input.title = 'Calculated automatically · Edit formula';
    } catch (error) {
      input.value = ''; data[name] = '';
      input.title = error.message;
    }
  });
  listeners.forEach(callback => callback());
}
function changed() {
  refreshFormulas();
  lastEditedAt = Math.max(Date.now(), lastEditedAt + 1, lastSavedAt + 1);
  dirty = true;
  persist();
  notify(navigator.onLine === false ? 'Disconnected' : 'Pending');
  schedule();
}
export function setFormula(name, tokens) {
  if (tokens && name.startsWith('atkSpell')) throw new Error('Attacks & Spellcasting fields do not support formulas.');
  if (tokens && fields.get(name) && fields.get(name).type === 'checkbox') throw new Error('Checkboxes do not support formulas.');
  if (tokens) previewFormula(name, tokens);
  data.formulas = { ...data.formulas };
  if (tokens) data.formulas[name] = tokens;
  else delete data.formulas[name];
  changed();
}
export function register(input) {
  if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) || registered.has(input)) return;
  registered.add(input);
  fields.set(input.name, input);
  const checkbox = input instanceof HTMLInputElement && input.type === 'checkbox';
  if ((checkbox || input.name.startsWith('atkSpell')) && fieldFormula(input.name)) {
    delete data.formulas[input.name];
    // Persist migration after React has finished mounting the field.
    Promise.resolve().then(changed);
  }
  if (checkbox) input.checked = data[input.name] === true;
  else input.value = data[input.name] === undefined ? '' : data[input.name];
  refreshFormulas();
  input.addEventListener('input', () => {
    if (fieldFormula(input.name)) { refreshFormulas(); return; }
    data[input.name] = checkbox ? input.checked : input.value;
    changed();
  });
}
