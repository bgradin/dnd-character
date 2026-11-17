// Cache responses at their normal URLs so reference-data readers can reuse them.
export const DATA_CACHE = 'dnd-reference-data-v1';
const memory = new Map();
const formulaDocuments = new Map();
export function referenceChoices(collection) {
  const names = new Set();
  for (const document of formulaDocuments.values()) {
    for (const entry of document[collection] || []) {
      names.add(entry.name);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}
export function referenceChoiceDetails(collection, name, subclass) {
  const enums = {};
  for (const document of formulaDocuments.values()) Object.assign(enums, document.enums);
  for (const document of formulaDocuments.values()) {
    for (const entry of document[collection] || []) {
      if (entry.name === name) {
        if (subclass) {
          if (!(entry.subclasses || []).includes(subclass)) return null;
          return { entry: { name: subclass, class: name,
            features: (entry.features || []).filter(feature => feature.subclass === subclass),
            notes: (entry.notes || []).filter(note => note.subclass === subclass),
          }, source: document.source, enums };
        }
        return { entry, source: document.source, enums };
      }
      if (collection === 'races') {
        const subrace = (entry.subraces || []).find(item => item.name === name);
        if (subrace) return { entry: subrace, parent: entry, source: document.source, enums };
      }
    }
  }
  return null;
}
export const referenceFormulaFields = [
  { name: 'race.baseWalkingSpeed', label: 'Walking speed' },
  { name: 'class.hitPointsAtFirstLevel', label: 'Class hit points at first level' },
  { name: 'class.hitPointsAtHigherLevels', label: 'Class hit points at higher levels' },
];
export function referenceFormulaValue(name, resolve) {
  if (!referenceFormulaFields.some(field => field.name === name)) return undefined;
  const raceField = name.startsWith('race.');
  const selected = String(resolve(raceField ? 'race' : 'class') || '').trim().toLowerCase();
  for (const document of formulaDocuments.values()) {
    for (const entry of (document && document[raceField ? 'races' : 'classes']) || []) {
      let match = entry;
      if (raceField && entry.name.toLowerCase() !== selected) {
        const subrace = (entry.subraces || []).find(item => item.name.toLowerCase() === selected);
        if (!subrace) continue;
        const override = (subrace.traits || []).find(trait => trait.rules && trait.rules.baseWalkingSpeed !== undefined);
        match = { ...entry, ...subrace, ...(override ? { baseWalkingSpeed: override.rules.baseWalkingSpeed } : {}) };
      } else if (entry.name.toLowerCase() !== selected) continue;
      const value = raceField ? match.baseWalkingSpeed : name.endsWith('FirstLevel')
        ? match.hitPointsAtFirstLevel && match.hitPointsAtFirstLevel.base
        : match.hitPointsAtHigherLevels && match.hitPointsAtHigherLevels.average;
      if (Number.isFinite(value)) return value;
    }
  }
  return 0;
}
export async function readReferenceData(path) {
  const url = new URL(`data/${path.split('/').map(encodeURIComponent).join('/')}`, document.baseURI).href;
  const cache = await openDataCache();
  const response = memory.get(url) || (cache && await cache.match(url));
  if (!response) throw new Error(`Reference data is not loaded: ${path}`);
  return response.clone().json();
}
async function openDataCache() {
  try { return await caches.open(DATA_CACHE); }
  catch (_) { return null; } // Private browsing can disable persistent storage.
}
export async function synchronizeData(progress) {
  const base = new URL('data/', document.baseURI);
  const response = await fetch(new URL('manifest.json', base), { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load the data manifest. Reload to try again.');
  const manifest = await response.json();
  if (manifest.schemaVersion !== 1 || !manifest.files || typeof manifest.files !== 'object' || Array.isArray(manifest.files)) {
    throw new Error('The data manifest is invalid.');
  }
  const entries = Object.entries(manifest.files);
  for (const [path, entry] of entries) {
    if (path.split('/').some(part => !part || part === '.' || part === '..') || /[\\?#:]/.test(path) ||
        !entry || !/^[a-f0-9]{64}$/.test(entry.sha256) || !Number.isSafeInteger(entry.size) || entry.size < 0) {
      throw new Error('The data manifest contains an invalid file.');
    }
  }
  const cache = await openDataCache();
  const retained = new Set();
  const total = entries.reduce((sum, [, entry]) => sum + Math.max(1, entry.size), 0);
  let completed = 0;
  let cursor = 0;
  async function worker() {
    while (cursor < entries.length) {
      const [path, entry] = entries[cursor++];
      const url = new URL(path.split('/').map(encodeURIComponent).join('/'), base).href;
      retained.add(url);
      const cached = memory.get(url) || (cache && await cache.match(url));
      if (!cached || cached.headers.get('X-Data-SHA256') !== entry.sha256) {
        const download = await fetch(url, { cache: 'reload' });
        if (!download.ok) throw new Error(`Unable to download ${path}. Reload to try again.`);
        const bytes = await download.arrayBuffer();
        if (bytes.byteLength !== entry.size) throw new Error(`Incomplete download: ${path}.`);
        if (globalThis.crypto && crypto.subtle) {
          const digest = await crypto.subtle.digest('SHA-256', bytes);
          const hash = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
          if (hash !== entry.sha256) throw new Error(`Data verification failed: ${path}.`);
        }
        const headers = new Headers(download.headers);
        headers.set('X-Data-SHA256', entry.sha256);
        const saved = new Response(bytes, { headers });
        // A quota failure should still allow this session to use the downloaded file.
        memory.set(url, saved.clone());
        if (cache) {
          try { await cache.put(url, saved); } catch (_) { /* Memory fallback above. */ }
        }
      }
      if (path.toLowerCase().endsWith('.json')) {
        const loaded = memory.get(url) || (cache && await cache.match(url));
        formulaDocuments.set(url, await loaded.clone().json());
      }
      completed += Math.max(1, entry.size);
      progress(total ? completed / total : 1);
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, entries.length) }, worker));
  if (cache) {
    for (const key of await cache.keys()) if (!retained.has(key.url)) await cache.delete(key);
  }
  for (const url of memory.keys()) if (!retained.has(url)) memory.delete(url);
  for (const url of formulaDocuments.keys()) if (!retained.has(url)) formulaDocuments.delete(url);
  progress(1);
}
