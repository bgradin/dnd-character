// Cache responses at their normal URLs so reference-data readers can reuse them.
export const DATA_CACHE = 'dnd-reference-data-v1';
const memory = new Map();
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
      completed += Math.max(1, entry.size);
      progress(total ? completed / total : 1);
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, entries.length) }, worker));
  if (cache) {
    for (const key of await cache.keys()) if (!retained.has(key.url)) await cache.delete(key);
  }
  for (const url of memory.keys()) if (!retained.has(url)) memory.delete(url);
  progress(1);
}
