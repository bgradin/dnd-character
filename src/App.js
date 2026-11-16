import React, { useEffect, useState } from 'react';
import './scss/main.scss';
import CharacterSheet from './components/Character/CharacterSheet';
import { initialize, request, prepareToLeave } from './data';
import { CloudCheck, CloudOff, RefreshCw } from 'lucide-react';
import { accountUrl } from './sso';

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [status, setStatus] = useState('Loading…');
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      const result = await request('/api/v1/site/session');
      setSession(result.user);
      setSessionChecked(true);
      if (!result.user) return;
      await initialize(setStatus, result.user);
      setReady(true);
    } catch (error) {
      if (error.status === 401) {
        setSession(null);
        setReady(false);
        setSessionChecked(true);
      } else {
        setStatus(error.message);
      }
    }
  }
  useEffect(() => { load(); }, []);
  async function logout() {
    setBusy(true);
    try {
      if (!await prepareToLeave()) return;
      await request('/api/v1/site/logout', { method: 'POST' });
      setReady(false);
      setSession(null);
      setStatus('Signed out');
    } catch (error) { setStatus(error.message); }
    finally { setBusy(false); }
  }
  const SyncIcon = status === 'Synced' ? CloudCheck : ['Pending', 'Syncing'].includes(status) ? RefreshCw : CloudOff;
  if (sessionChecked && !session) return <main className="app signed-out">
    <section className="signed-out__panel" aria-labelledby="sheet-heading">
      <h1 id="sheet-heading">DND Character Sheet</h1>
      <nav className="signed-out__actions" aria-label="Account">
        <a href={accountUrl('/login/')}>Log in</a>
        <a href={accountUrl('/register/')}>Register</a>
      </nav>
    </section>
  </main>;

  return <div className="app">
    <nav aria-label="Account" style={{ padding: '1rem' }}>
      {session ? <React.Fragment>
        <span>{session.firstName} </span>
        <span role="status" aria-label={status} title={status} style={{ display: 'inline-flex', verticalAlign: 'middle' }}><SyncIcon size={20} aria-hidden="true" /></span>{' '}
        <button disabled={busy} onClick={logout}>Log out</button>
      </React.Fragment> : <React.Fragment>
        <a href={accountUrl('/login/')}>Log in</a>{' · '}
        <a href={accountUrl('/register/')}>Register</a>
      </React.Fragment>}
      {(!ready || !['Synced', 'Pending', 'Syncing', 'Disconnected'].includes(status)) && <p role="status" aria-live="polite">{status}</p>}
      {!ready && <button onClick={load}>Retry loading</button>}
    </nav>
    <div className="unsupported-size">Unsupported size. Please view this site on a larger screen.</div>
    {ready && <div className="container"><fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}><CharacterSheet /></fieldset></div>}
  </div>;
}
