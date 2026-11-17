import React, { useEffect, useState } from "react";
import "./scss/main.scss";
import CharacterSheet from "./components/Character/CharacterSheet";
import {
  initialize,
  request,
  prepareToLeave,
  listSheets,
  createSheet,
  deleteSheet,
  preloadSheets,
} from "./data";
import { CloudCheck, CloudOff, RefreshCw } from "lucide-react";
import { accountUrl } from "./sso";
import FormulaTools from "./components/FormulaTools";
import dragonHead from "./img/dragonHead.svg";
import "./scss/redesign.scss";

const Brand = () => (
  <a className="app-brand" href="#">
    <img src={dragonHead} alt="" />
    <span>DND Character Sheet</span>
  </a>
);
const clearHash = () =>
  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
function requestedSheet() {
  const match = /^#\/sheets\/([^/]+)$/.exec(window.location.hash);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch (_) {
    return null;
  }
}

export default function App({ initialSession = null, initialSheets = [] } = {}) {
  const [session, setSession] = useState(initialSession);
  const [ready, setReady] = useState(Boolean(initialSession));
  const [status, setStatus] = useState("Loading…");
  const [busy, setBusy] = useState(false);
  const [sheets, setSheets] = useState(initialSheets);
  const [activeSheet, setActiveSheet] = useState(null);
  const [routeError, setRouteError] = useState("");
  const [reload, setReload] = useState(0);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  useEffect(() => {
    if (session) {
      preloadSheets(session).catch(() => {});
    }
  }, [session]);
  useEffect(() => {
    if (!session) {
      const removeSheetHash = () => {
        clearHash();
      };
      window.addEventListener("hashchange", removeSheetHash);
      return () => window.removeEventListener("hashchange", removeSheetHash);
    }
    let disposed = false;
    let current = null;
    let queue = Promise.resolve();
    async function route() {
      if (disposed) return;
      const next = requestedSheet();
      if (current && !(await prepareToLeave())) {
        window.history.replaceState(
          null,
          "",
          `#/sheets/${encodeURIComponent(current)}`,
        );
        return;
      }
      if (disposed) return;
      if (next || current) setReady(false);
      setRouteError("");
      setStatus("Loading…");
      setActiveSheet(next);
      try {
        if (next)
          await initialize(
            (value) => {
              if (!disposed) setStatus(value);
            },
            session,
            next,
          );
        else {
          const result = await listSheets(session);
          if (!disposed) setSheets(result);
        }
        if (!disposed) {
          current = next;
          setReady(true);
        }
      } catch (error) {
        if (!disposed) {
          current = null;
          setRouteError(error.message);
          setStatus(error.message);
          if (error.status === 401) {
            clearHash();
            setSession(null);
          }
        }
      }
    }
    const change = () => {
      queue = queue.then(route);
    };
    change();
    window.addEventListener("hashchange", change);
    return () => {
      disposed = true;
      window.removeEventListener("hashchange", change);
    };
  }, [session, reload]);
  async function create() {
    setCreating(true);
    setBusy(true);
    setRouteError("");
    try {
      const sheet = await createSheet(session);
      window.location.hash = `/sheets/${encodeURIComponent(sheet.sheetId)}`;
    } catch (error) {
      setRouteError(error.message);
    } finally {
      setBusy(false);
      setCreating(false);
    }
  }
  async function remove(sheet) {
    const name = sheet.data["character-name"] || "Unnamed character";
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusy(true);
    setDeleting(sheet.sheetId);
    setRouteError("");
    try {
      await deleteSheet(sheet.sheetId, session);
      setSheets((current) =>
        current.filter((item) => item.sheetId !== sheet.sheetId),
      );
    } catch (error) {
      setRouteError(error.message);
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      if (!(await prepareToLeave())) return;
      await request("/api/v1/site/logout", { method: "POST" });
      clearHash();
      setReady(false);
      setSession(null);
      setStatus("Signed out");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }
  const SyncIcon =
    status === "Synced"
      ? CloudCheck
      : ["Pending", "Syncing"].includes(status)
        ? RefreshCw
        : CloudOff;
  if (session && !ready && !routeError) return null;

  if (!session)
    return (
      <main className="app signed-out">
        <section className="signed-out__panel" aria-labelledby="sheet-heading">
          <h1 id="sheet-heading">
            <Brand />
          </h1>
          <nav className="signed-out__actions" aria-label="Account">
            <a className="standard-button" href={accountUrl("/login/")}>
              Log in
            </a>
            <a className="standard-button" href={accountUrl("/register/")}>
              Register
            </a>
          </nav>
        </section>
      </main>
    );

  return (
    <div className="app">
      <nav className="main-navigation" aria-label="Main">
        <div className="main-navigation__container">
          <Brand />
          <div className="navigation-account">
            {session ? (
              <div className="navigation-session">
                {activeSheet && (
                  <React.Fragment>
                    <span
                      role="status"
                      aria-label={status}
                      title={status}
                      className="sync-status"
                    >
                      <SyncIcon size={20} aria-hidden="true" />
                    </span>
                    <a className="standard-button" href="#">
                      Character sheets
                    </a>
                  </React.Fragment>
                )}
                <button
                  className="standard-button"
                  disabled={busy}
                  onClick={logout}
                >
                  Log out
                </button>
              </div>
            ) : (
              <React.Fragment>
                <a className="standard-button" href={accountUrl("/login/")}>
                  Log in
                </a>
                <a className="standard-button" href={accountUrl("/register/")}>
                  Register
                </a>
              </React.Fragment>
            )}
            {!ready && (
              <p role="status" aria-live="polite">
                {status}
              </p>
            )}
            {!ready && routeError && (
              <button
                className="standard-button"
                onClick={() =>
                  setReload((value) => value + 1)
                }
              >
                Retry loading
              </button>
            )}
          </div>
        </div>
      </nav>
      {session && !activeSheet && ready && (
        <main className="container" aria-labelledby="sheets-heading">
          <section className="sheet-selection">
            <div className="sheet-selection__heading">
              <div>
                <h1 id="sheets-heading">Choose a character</h1>
              </div>
              {!sheets.some((sheet) => sheet.legacy) && (
                <button
                  className="standard-button"
                  disabled={busy}
                  onClick={create}
                >
                  {creating ? "Creating…" : "New"}
                </button>
              )}
            </div>
            {routeError && <p role="alert">{routeError}</p>}
            {sheets.length ? (
              <ul className="sheet-selection__list">
                {sheets.map((sheet) => (
                  <li key={sheet.sheetId} className="sheet-selection__item">
                    <div className="sheet-card">
                      <h2
                        style={{
                          marginBottom:
                            !sheet.data.race &&
                            !sheet.data.class &&
                            !sheet.data.level &&
                            !sheet.data.classAndLevel
                              ? "0"
                              : "",
                        }}
                      >
                        {sheet.data["character-name"] || "Unnamed character"}
                      </h2>
                      {(sheet.data.race ||
                        sheet.data.class ||
                        sheet.data.level ||
                        sheet.data.classAndLevel) && (
                        <p>
                          {[
                            sheet.data.race,
                            sheet.data.class !== undefined
                              ? sheet.data.class
                              : sheet.data.classAndLevel,
                            sheet.data.level && `Level ${sheet.data.level}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="sheet-card__actions">
                      <a
                        href={`#/sheets/${encodeURIComponent(sheet.sheetId)}`}
                        className="standard-button"
                        aria-label={`Open ${sheet.data["character-name"] || "Unnamed character"}`}
                      >
                        Open
                      </a>
                      {!sheet.legacy && (
                        <button
                          className="standard-button sheet-delete"
                          disabled={busy}
                          onClick={() => remove(sheet)}
                          aria-label={`Delete ${sheet.data["character-name"] || "Unnamed character"}`}
                        >
                          {deleting === sheet.sheetId ? "Deleting…" : "Delete"}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sheet-selection__empty">
                Create your first character to get started.
              </p>
            )}
          </section>
        </main>
      )}
      {activeSheet && (
        <div className="unsupported-size">
          Unsupported size. Please view this site on a larger screen.
        </div>
      )}
      {ready && activeSheet && (
        <div className="container" key={activeSheet}>
          <fieldset
            disabled={busy}
            style={{ border: 0, padding: 0, margin: 0 }}
          >
            <CharacterSheet />
            <FormulaTools />
          </fieldset>
        </div>
      )}
    </div>
  );
}
