import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { ChevronLeft } from 'lucide-react';
import { attackEntries, setAttackEntries, register, subscribeFields } from '../../../data';
import { referenceChoices, referenceChoiceDetails } from '../../../startupData';
import ReferenceDetails from '../../ui/HyperlinkChoiceField/ReferenceDetails';
import './CharacterAttacksSpellcasting.scss';

export default function CharacterAttacksSpellcasting() {
  const [, render] = useState(0);
  const [pages, setPages] = useState([]);
  const [direction, setDirection] = useState('forward');
  const page = pages[pages.length - 1];
  const pageRefs = useRef(new Map());
  const positions = useRef(new Map());
  const pageKey = page ? `${page.kind}:${page.collection || ''}:${page.name || ''}` : 'closed';
  if (!pageRefs.current.has(pageKey)) pageRefs.current.set(pageKey, React.createRef());
  const pageRef = pageRefs.current.get(pageKey);
  const [collection, setCollection] = useState('weapons');
  const [query, setQuery] = useState('');
  const dialog = useRef(null);
  const trigger = useRef(null);
  const addButton = useRef(null);
  const entries = attackEntries();
  useEffect(() => subscribeFields(() => render(value => value + 1)), []);

  function open(next, event) {
    trigger.current = event.currentTarget;
    setQuery('');
    positions.current.clear();
    setDirection('forward');
    setPages([next]);
  }
  function showDetails(name) {
    positions.current.set(pageKey, {
      scroll: pageRef.current.querySelector('.choice-page-body').scrollTop,
      trigger: `details:${name}`,
    });
    setDirection('forward');
    setPages(previous => [...previous, { kind: 'details', collection, name }]);
  }
  function back() {
    setDirection('back');
    setPages(previous => previous.slice(0, -1));
  }
  function preparePage() {
    const element = pageRef.current;
    if (!element) return;
    element.removeAttribute('aria-hidden');
    element.removeAttribute('inert');
    element.querySelector('.choice-page-body').scrollTop = positions.current.get(pageKey)?.scroll || 0;
  }
  function focusPage() {
    preparePage();
    const controls = Array.from(pageRef.current.querySelectorAll('button, input, select'));
    const previous = positions.current.get(pageKey)?.trigger;
    (controls.find(control => control.dataset.choiceKey === previous) || controls[0] || dialog.current.querySelector('button')).focus({ preventScroll: true });
  }
  function close() {
    setPages([]);
    const target = trigger.current;
    (target && target.isConnected ? target : addButton.current).focus();
  }
  useEffect(() => {
    if (!page) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    focusPage();
    function keydown(event) {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const controls = Array.from(dialog.current.querySelectorAll('button, input, select, [tabindex="0"]')).filter(control => !control.closest('[aria-hidden="true"]'));
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', keydown);
    };
  }, [Boolean(page)]);

  function add(name, selectedCollection = collection) {
    setAttackEntries([...attackEntries(), { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, collection: selectedCollection, name }]);
    close();
  }
  function remove(id) {
    setAttackEntries(entries.filter(entry => entry.id !== id));
    addButton.current.focus();
  }
  const details = page && page.kind === 'details' && !page.legacy ? referenceChoiceDetails(page.collection, page.name) : null;
  const choices = referenceChoices(collection).filter(name => name.toLowerCase().includes(query.toLowerCase()));

  return <div className="character-attack-spellcasting">
    <div className="attack-list-content">
      <h2 className="attack-list-title">Attacks &amp; Spellcasting</h2>
      {!entries.length && <p className="attack-list-empty">Add a weapon or spell.</p>}
      <ul className="attack-list">
        {entries.map(item => {
          const reference = item.legacy ? null : referenceChoiceDetails(item.collection, item.name);
          const entry = reference ? reference.entry : item;
          const weapon = item.collection === 'weapons';
          return <li key={item.id}>
            <div className="attack-list-heading">
              <button type="button" className="attack-link" onClick={event => open({ kind: 'details', ...item }, event)}>{item.name}</button>
              <button type="button" className="attack-link" aria-label={`Delete ${item.name}`} onClick={() => remove(item.id)}>Delete</button>
            </div>
            <dl className="attack-list-stats">
              {weapon ? <React.Fragment>
                <div><dt>Damage</dt><dd>{entry.damage || '—'}</dd></div>
                <div><dt>Damage type</dt><dd>{reference ? reference.enums.damageType?.[entry.damageType] || '—' : '—'}</dd></div>
                {entry.normalRange != null && <div><dt>Range</dt><dd>{entry.normalRange}{entry.maximumRange != null ? `/${entry.maximumRange}` : ''} feet</dd></div>}
                {item.legacy && item.bonus && <div><dt>Attack bonus</dt><dd>{item.bonus}</dd></div>}
              </React.Fragment> : <React.Fragment>
                <div><dt>Casting time</dt><dd>{entry.castingTime || '—'}</dd></div>
                <div><dt>Range</dt><dd>{entry.range || '—'}</dd></div>
                <div><dt>Duration</dt><dd>{entry.duration || '—'}</dd></div>
              </React.Fragment>}
            </dl>
          </li>;
        })}
      </ul>
      <label className="attack-notes-label" htmlFor="atkSpellNotes">Notes</label>
      <textarea className="character-attack-spellcasting__textarea" name="atkSpellNotes" id="atkSpellNotes" rows="3" ref={register} />
      <div className="attack-list-footer"><button type="button" className="standard-button" ref={addButton} onClick={event => open({ kind: 'add' }, event)}>Add weapon or spell</button></div>
    </div>
    {page && createPortal(<div className="formula-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
      <section className="formula-modal default-box choice-modal" role="dialog" aria-modal="true" aria-labelledby="attack-dialog-title" ref={dialog}>
        <div className="formula-heading">
          <h2 id="attack-dialog-title">{page.kind === 'add' ? 'Add weapon or spell' : page.name}</h2>
          <button type="button" className="formula-close" aria-label="Close weapon or spell dialog" onClick={close}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <TransitionGroup className="choice-pages" childFactory={child => React.cloneElement(child, { classNames: `choice-slide-${direction}` })}>
          <CSSTransition key={pageKey} nodeRef={pageRef} timeout={240} classNames={`choice-slide-${direction}`}
            onEnter={preparePage} onEntered={focusPage} onExit={() => {
              const element = pageRef.current;
              if (element) { element.setAttribute('aria-hidden', 'true'); element.setAttribute('inert', ''); }
            }}>
            <div className="choice-page" ref={pageRef}>
              {pages.length > 1 && <nav className="choice-page-navigation" aria-label="Weapon or spell navigation">
                <button type="button" className="choice-back" onClick={back}><ChevronLeft size={18} aria-hidden="true" /> Back</button>
                <button type="button" className="standard-button" aria-label={`Add ${page.name}`} onClick={() => add(page.name, page.collection)}>Add</button>
              </nav>}
              <div className="choice-page-body" tabIndex="0" aria-label={page.kind === 'details' ? `${page.name} details` : undefined}>
                {page.kind === 'details' ? <ReferenceDetails collection={page.collection} details={details || { entry: { name: page.name, damage: page.damage, attackBonus: page.bonus }, enums: {} }} /> : <React.Fragment>
                  <div className="attack-picker-controls">
                    <label>Type<select value={collection} onChange={event => setCollection(event.target.value)}><option value="weapons">Weapons</option><option value="spells">Spells</option></select></label>
                    <label>Search<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
                  </div>
                  <ul className="hyperlink-choice-options">{choices.map(name => <li key={name}>
                    <span className="choice-option-name">{name}</span>
                    <div className="choice-option-actions">
                      <button type="button" className="standard-button" data-choice-key={`details:${name}`} aria-label={`Details for ${name}`} onClick={() => showDetails(name)}>Details</button>
                      <button type="button" className="standard-button" aria-label={`Add ${name}`} onClick={() => add(name)}>Add</button>
                    </div>
                  </li>)}</ul>
                  {!choices.length && <p>No matching {collection}.</p>}
                </React.Fragment>}
              </div>
            </div>
          </CSSTransition>
        </TransitionGroup>
      </section>
    </div>, document.body)}
  </div>;
}
