import { request } from './request';
import { synchronizeData } from './startupData';

const bar = document.getElementById('startup-progress');
const errorText = document.getElementById('startup-error');
const parts = { app: 0, data: 0, assets: 0, session: 0 };
function progress(part, value) {
  parts[part] = value;
  bar.value = Object.values(parts).reduce((sum, n) => sum + n, 0) / 4 * 0.95;
}
async function loadAssets() {
  const base = new URL('assets/', document.baseURI);
  const response = await fetch(new URL('app-assets.json', base), { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load the application asset list. Reload to try again.');
  const assets = await response.json();
  let cursor = 0;
  let completed = 0;
  async function worker() {
    while (cursor < assets.length) {
      const path = assets[cursor++];
      const response = await fetch(new URL(path, base), { cache: 'force-cache' });
      if (!response.ok) throw new Error('Unable to load application artwork. Reload to try again.');
      await response.arrayBuffer();
      progress('assets', ++completed / assets.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, assets.length) }, worker));
  progress('assets', 1);
}
async function start() {
  const [app, , , session] = await Promise.all([
    import(/* webpackChunkName: "app" */ './mountApp').then(app => { progress('app', 1); return app; }),
    synchronizeData(value => progress('data', value)),
    loadAssets(),
    request('/api/v1/site/session').catch(error => {
      if (error.status === 401) return { user: null };
      throw new Error('Unable to check your session. Reload to try again.');
    }).then(result => { progress('session', 1); return result; }),
  ]);
  const user = session.user || null;
  const sheets = await app.prepare(user);
  if (document.fonts) {
    await Promise.all([
      document.fonts.load('600 32px Cinzel'),
      document.fonts.load('300 32px "Open Sans Condensed"'),
    ]);
  }
  const params = new URLSearchParams(window.location.search);
  params.delete('action');
  const search = params.toString();
  window.history.replaceState(null, '', window.location.pathname + (search ? `?${search}` : ''));
  bar.value = 1;
  app.mount(user, sheets);
}
start().catch(error => {
  errorText.textContent = error.message || 'Unable to load the application. Reload to try again.';
  errorText.hidden = false;
});
