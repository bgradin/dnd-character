let data = {};
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
        : response.status === 401 ? 'Your session expired. Sign in again to save.' : 'Unable to save or load. Please try again.');
      error.status = response.status;
      throw error;
    }
    return response.status === 204 ? null : await response.json();
  } finally { clearTimeout(timeout); }
}

function persist() {
  if (!storageKey) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify({ schemaVersion: 1, data, revision, lastEditedAt, lastSavedAt }));
  } catch (_) { /* Autosave still works when browser storage is unavailable. */ }
}

function schedule(delay = 600) {
  clearTimeout(timer);
  timer = setTimeout(() => save().catch(() => {}), delay);
}

export async function initialize(onStatus, user) {
  notify = onStatus;
  clearTimeout(timer);
  // Never share a recovery copy between signed-in accounts.
  const identity = user.id || user.userId || user.email;
  storageKey = identity == null ? null : `dnd-character:v1:${identity}`;
  let cached;
  try {
    cached = JSON.parse(localStorage.getItem(storageKey));
    if (!cached || cached.schemaVersion !== 1 || !cached.data || typeof cached.data !== 'object' || Array.isArray(cached.data)) cached = null;
  } catch (_) { cached = null; }
  blocked = false;
  dirty = false;
  let document;
  try { document = await request('/api/dnd/v1'); }
  catch (error) {
    if (!cached || error.status) throw error;
  }
  if (document && document.schemaVersion !== 1) throw new Error('This sheet needs a newer application version.');
  const serverEditedAt = document ? Date.parse(document.updatedAt || document.lastEditedAt || '') || 0 : 0;
  const recover = cached && (!document || (cached.lastEditedAt > cached.lastSavedAt && cached.lastEditedAt > serverEditedAt));
  data = recover ? cached.data : document.data;
  revision = document ? document.revision : cached.revision;
  lastEditedAt = recover ? cached.lastEditedAt : serverEditedAt;
  lastSavedAt = recover ? cached.lastSavedAt : Date.now();
  dirty = Boolean(recover && lastEditedAt > lastSavedAt);
  if (data.playerName === undefined) {
    data.playerName = [user.firstName, user.lastName].filter(Boolean).join(' ');
    lastEditedAt = Math.max(Date.now(), lastSavedAt + 1);
    dirty = true;
  }
  persist();
  notify(!document ? 'Disconnected' : dirty ? 'Pending' : 'Synced');
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
  saving = request('/api/dnd/v1', {
    method: 'PUT', keepalive: true,
    body: JSON.stringify({ schemaVersion: 1, revision, data: JSON.parse(snapshot) })
  }).then(result => {
    revision = result.revision;
    dirty = lastEditedAt !== editedAt;
    // An edit made during this request must remain newer than the saved marker.
    lastSavedAt = dirty ? editedAt : Math.max(Date.now(), editedAt);
    persist();
    notify(dirty ? 'Pending' : 'Synced');
  }).catch(error => {
    blocked = error.status === 409 || error.status === 401;
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
export function register(input) {
  if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) || registered.has(input)) return;
  registered.add(input);
  const checkbox = input instanceof HTMLInputElement && input.type === 'checkbox';
  if (checkbox) input.checked = data[input.name] === true;
  else input.value = data[input.name] === undefined ? '' : data[input.name];
  input.addEventListener('input', () => {
    data[input.name] = checkbox ? input.checked : input.value;
    lastEditedAt = Math.max(Date.now(), lastEditedAt + 1, lastSavedAt + 1);
    dirty = true;
    persist();
    notify(navigator.onLine === false ? 'Disconnected' : 'Pending');
    schedule();
  });
}
