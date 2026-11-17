import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { TextPen, ChevronLeft } from 'lucide-react';
import { referenceChoiceDetails } from '../../../startupData';
import { register, setClassChoice, subscribeFields, sheetFields } from '../../../data';
import ReferenceDetails from './ReferenceDetails';

export default function HyperlinkChoiceField({ name, label, choices = [], collection }) {
  const rootPage = { key: 'choices', kind: 'list', title: `Choose ${label.toLowerCase()}` };
  const [open, setOpen] = useState(false);
  const [pages, setPages] = useState([rootPage]);
  const [direction, setDirection] = useState('forward');
  const [, rerender] = useState(0);
  const pageRefs = useRef(new Map());
  const positions = useRef(new Map());
  const input = useRef(null);
  const modal = useRef(null);
  const current = pages[pages.length - 1];
  if (!pageRefs.current.has(current.key)) pageRefs.current.set(current.key, React.createRef());
  const pageRef = pageRefs.current.get(current.key);
  const isClass = collection === 'classes';
  const isSubclass = collection === 'subclasses';
  const isRace = collection === 'races';
  const selectedClass = isSubclass ? sheetFields().find(field => field.name === 'class')?.value : undefined;
  const availableChoices = current.kind === 'subraces'
    ? (referenceChoiceDetails('races', current.race)?.entry.subraces || []).map(subrace => subrace.name)
    : isSubclass
    ? referenceChoiceDetails('classes', selectedClass)?.entry.subclasses || []
    : choices;

  useEffect(() => {
    if (!isSubclass) return;
    const unsubscribe = subscribeFields(() => rerender(value => value + 1));
    rerender(value => value + 1);
    return unsubscribe;
  }, [isSubclass]);

  function show() {
    positions.current.clear();
    setPages([rootPage]);
    setDirection('forward');
    setOpen(true);
  }
  function close() {
    setOpen(false);
    input.current.focus({ preventScroll: true });
  }
  function save(value, trigger = `select:${value}`) {
    if (isRace) {
      const race = referenceChoiceDetails('races', value);
      if (!race?.parent && race?.entry.subraces?.length) {
        push({ key: `subraces:${value}`, kind: 'subraces', title: `Choose ${value} subrace`, race: value }, trigger);
        return;
      }
    }
    if (isClass) {
      const subclass = input.current.value === value ? sheetFields().find(field => field.name === 'subclass')?.value || '' : '';
      setClassChoice(value, subclass);
    } else if (isSubclass) setClassChoice(selectedClass, value);
    else {
      input.current.value = value;
      input.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
    close();
  }
  function push(page, trigger) {
    positions.current.set(current.key, {
      scroll: pageRef.current.querySelector('.choice-page-body').scrollTop,
      trigger,
    });
    setDirection('forward');
    setPages(previous => [...previous, page]);
  }
  function details(value, trigger) {
    push({ key: `details:${value}`, kind: 'details', title: value, value }, trigger);
  }
  function back() {
    setDirection('back');
    setPages(previous => previous.length > 1 ? previous.slice(0, -1) : previous);
  }
  function preparePage() {
    const page = pageRef.current;
    if (!page) return;
    page.removeAttribute('aria-hidden');
    page.removeAttribute('inert');
    page.querySelector('.choice-page-body').scrollTop = positions.current.get(current.key)?.scroll || 0;
  }
  function focusPage() {
    preparePage();
    const buttons = Array.from(pageRef.current.querySelectorAll('button'));
    const trigger = positions.current.get(current.key)?.trigger;
    const previous = trigger && buttons.find(button => button.dataset.choiceKey === trigger);
    (previous || buttons.find(button => button.getAttribute('aria-pressed') === 'true') || buttons[0] || modal.current.querySelector('button')).focus({ preventScroll: true });
  }
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    focusPage();
    function keydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'Tab') {
        const buttons = Array.from(modal.current.querySelectorAll('button:not(:disabled), [tabindex="0"]')).filter(button => !button.closest('[aria-hidden="true"]'));
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    }
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', keydown);
    };
  }, [open]);

  function choiceList(values) {
    return <ul className="hyperlink-choice-options">
      {values.map(value => {
        const selected = input.current.value === value || (isRace && current.kind === 'list'
          && referenceChoiceDetails('races', input.current.value)?.parent?.name === value);
        return <li key={value}>
          <span className="choice-option-name">{value}{selected && <small>Current selection</small>}</span>
          <div className="choice-option-actions">
            <button type="button" className="standard-button" data-choice-key={`details:${value}`}
              aria-label={`Details for ${value}`} onClick={() => details(value, `details:${value}`)}>Details</button>
            <button type="button" className="standard-button" data-choice-key={`select:${value}`}
              aria-label={`Select ${value}`} aria-pressed={selected}
              onClick={() => save(value)}>Select</button>
          </div>
        </li>;
      })}
    </ul>;
  }
  return <React.Fragment>
    <div className="hyperlink-choice-field">
      <input id={name} name={name} type="text" className="form-input" data-hyperlink-choice="true" readOnly role="button"
        aria-label={`Choose ${label.toLowerCase()}`} aria-haspopup="dialog" aria-expanded={open}
        aria-controls={open ? `${name}-choice-dialog` : undefined}
        ref={element => { input.current = element; register(element); }} onClick={show}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(); }
        }} />
      <TextPen className="hyperlink-choice-field__icon" aria-hidden="true" />
    </div>
    {open && createPortal(
      <div className="formula-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
        <section id={`${name}-choice-dialog`} className="formula-modal default-box choice-modal" role="dialog"
          aria-modal="true" aria-labelledby={`${name}-choice-title`} ref={modal}>
          <div className="formula-heading">
            <h2 id={`${name}-choice-title`}>{current.title}</h2>
            <button className="formula-close" type="button" onClick={close} aria-label={`Close ${label.toLowerCase()} selection`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <TransitionGroup className="choice-pages" childFactory={child => React.cloneElement(child, { classNames: `choice-slide-${direction}` })}>
            <CSSTransition key={current.key} nodeRef={pageRef} timeout={240} classNames={`choice-slide-${direction}`}
              onEnter={preparePage} onEntered={focusPage} onExit={() => {
                const page = pageRef.current;
                if (page) { page.setAttribute('aria-hidden', 'true'); page.setAttribute('inert', ''); }
              }}>
              <div className="choice-page" ref={pageRef}>
                {current.kind !== 'list' && <nav className="choice-page-navigation" aria-label={`${label} navigation`}>
                  <button type="button" className="choice-back" onClick={back}><ChevronLeft size={18} aria-hidden="true" /> Back</button>
                  {current.kind === 'details' && <button type="button" className="standard-button" data-choice-key="details-select"
                    aria-label={`Select ${current.value}`} onClick={() => save(current.value, 'details-select')}>Select</button>}
                </nav>}
                <div className="choice-page-body" tabIndex={current.kind === 'details' ? '0' : undefined}
                  aria-label={current.kind === 'details' ? `${current.title} details` : undefined}>
                  {current.kind === 'details' ? <ReferenceDetails collection={collection} details={isSubclass
                    ? referenceChoiceDetails('classes', selectedClass, current.value)
                    : referenceChoiceDetails(collection, current.value)} />
                    : <React.Fragment>
                      {current.kind === 'subraces' && <p>Choose a subrace for {current.race}.</p>}
                      {isSubclass && selectedClass && <React.Fragment>
                        <p>Choose a subclass for {selectedClass}.</p>
                        <button type="button" className="standard-button" aria-pressed={!input.current.value}
                          onClick={() => save('')}>No subclass</button>
                      </React.Fragment>}
                      {choiceList(availableChoices)}
                      {!availableChoices.length && <p>{isSubclass && !selectedClass ? 'Choose a class first to see its subclasses.' : 'No choices are available.'}</p>}
                    </React.Fragment>}
                </div>
              </div>
            </CSSTransition>
          </TransitionGroup>
        </section>
      </div>, document.body
    )}
  </React.Fragment>;
}
