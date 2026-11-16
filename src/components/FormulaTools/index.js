import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  sheetFields,
  subscribeFields,
  fieldFormula,
  setFormula,
  previewFormula,
} from "../../data";

import { isProficiencyField } from "../../formulas";

const excluded =
  ".character-header, .character-equipment, .character-proficiency-other";
function applicable(input) {
  return (
    input &&
    input.name &&
    input.type !== "checkbox" &&
    input.matches("input,textarea") &&
    (!input.closest(excluded) || input.name === "level") &&
    input.name !== "deathSaves" &&
    !input.name.startsWith("atkSpell")
  );
}
export function fieldLabel(input) {
  const explicit =
    input.id && document.querySelector(`label[for="${input.id}"]`);
  return (
    (explicit && explicit.textContent.trim()) ||
    input.name
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
export default function FormulaTools() {
  const [target, setTarget] = useState(null),
    [position, setPosition] = useState(null);
  const [editing, setEditing] = useState(null),
    [tokens, setTokens] = useState([]);
  const [number, setNumber] = useState(""),
    [reference, setReference] = useState("");
  const [, rerender] = useState(0);
  const modal = useRef(null);
  const dragged = useRef(null);
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState([]);
  function insert(token) {
    setTokens([...tokens.slice(0, cursor), token, ...tokens.slice(cursor)]);
    setSelected(selected.map((index) => index >= cursor ? index + 1 : index));
    setCursor(cursor + 1);
  }
  function removeSelected() {
    setTokens(tokens.filter((_, index) => !selected.includes(index)));
    setCursor(cursor - selected.filter((index) => index < cursor).length);
    setSelected([]);
  }
  function dropPosition(event) {
    const token = event.target.closest("[data-token-index]");
    if (!token) return tokens.length;
    const rect = token.getBoundingClientRect();
    return Number(token.dataset.tokenIndex) + (event.clientX >= rect.left + rect.width / 2 ? 1 : 0);
  }
  function moveToken(destination) {
    if (dragged.current === null) return;
    const from = dragged.current;
    const next = tokens.filter((_, index) => index !== from);
    const to = destination - (from < destination ? 1 : 0);
    next.splice(to, 0, tokens[from]);
    setTokens(next);
    setSelected([]);
    setCursor(to + 1);
    dragged.current = null;
  }
  function groupSelection(functionName) {
    const start = selected.length ? Math.min(...selected) : cursor;
    const group = tokens.filter((_, index) => selected.includes(index));
    const remaining = tokens.filter((_, index) => !selected.includes(index));
    const prefix = functionName ? [functionName, "("] : ["("];
    remaining.splice(start, 0, ...prefix, ...group, ")");
    setTokens(remaining);
    setSelected([]);
    setCursor(start + group.length + prefix.length);
  }
  useEffect(() => {
    const focus = (event) => {
      if (applicable(event.target)) setTarget(event.target);
      else if (!event.target.closest(".formula-trigger, .formula-modal"))
        setTarget(null);
    };
    const blur = (event) => {
      if (
        (applicable(event.target) ||
          event.target.closest(".formula-trigger")) &&
        !event.relatedTarget?.closest(".formula-trigger, .formula-modal")
      ) {
        setTarget(null);
      }
    };
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", blur);
    const unsubscribe = subscribeFields(() => rerender((value) => value + 1));
    return () => {
      document.removeEventListener("focusin", focus);
      document.removeEventListener("focusout", blur);
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!target) {
      setPosition(null);
      return;
    }
    const move = () => {
      const rect = target.getBoundingClientRect();
      setPosition({ left: rect.right - 17, top: rect.bottom - 12 });
    };
    move();
    window.addEventListener("scroll", move, true);
    window.addEventListener("resize", move);
    return () => {
      window.removeEventListener("scroll", move, true);
      window.removeEventListener("resize", move);
    };
  }, [target]);
  function close() {
    setEditing(null);
    if (target) target.focus();
  }
  useEffect(() => {
    if (!editing) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.current.querySelector("button").focus();
    function key(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key === "Tab") {
        const focusable = Array.from(
          modal.current.querySelectorAll(
            'button:not(:disabled),input,select,[tabindex="0"]',
          ),
        );
        const first = focusable[0],
          last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
    };
  }, [editing]);
  let result, error;
  if (editing) {
    try {
      result = previewFormula(editing.name, tokens);
    } catch (failure) {
      error = failure.message;
    }
  }
  const fields = sheetFields().filter(
    (input) => (applicable(input) || (input.type === "checkbox" && isProficiencyField(input.name))) &&
      input.name !== (editing && editing.name),
  );
  const labels = Object.fromEntries(
    sheetFields().map((input) => [input.name, fieldLabel(input)]),
  );
  return createPortal(
    <React.Fragment>
      {target && position && !editing && (
        <button
          className={`formula-trigger ${fieldFormula(target.name) ? "is-on" : ""}`}
          style={position}
          aria-label={`Edit formula for ${fieldLabel(target)}`}
          title="Edit formula"
          aria-haspopup="dialog"
          onClick={() => {
            const initial = fieldFormula(target.name) || [];
            setTokens(initial);
            setCursor(initial.length);
            setSelected([]);
            setNumber("");
            setReference("");
            setEditing(target);
          }}
        >
          ƒx
        </button>
      )}
      {editing && (
        <div
          className="formula-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            className="formula-modal default-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="formula-title"
            ref={modal}
          >
            <div className="formula-heading">
              <h2 id="formula-title">Formula · {fieldLabel(editing)}</h2>
              <button
                className="formula-close"
                type="button"
                onClick={close}
                aria-label="Close formula editor"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <p className="formula-hint" id="formula-expression-help">
              Click items to select them. Click between items to place the cursor,
              or drag items to reorder them. New items are added at the cursor.
              Proficiency fields use 1 when checked and 0 when unchecked.
              Use min or max with two or more values separated by commas.
              Use ceil or floor with one value to round up or down to an integer.
            </p>
            <div
              className="formula-expression"
              aria-label="Formula expression"
              aria-describedby="formula-expression-help"
              tabIndex="0"
              onClick={(event) => {
                if (event.target === event.currentTarget) setCursor(tokens.length);
              }}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                  event.preventDefault();
                  setCursor(event.key === "Home" ? 0 : event.key === "End" ? tokens.length :
                    Math.max(0, Math.min(tokens.length, cursor + (event.key === "ArrowLeft" ? -1 : 1))));
                }
              }}
              onDragOver={(event) => {
                if (dragged.current === null) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setCursor(dropPosition(event));
              }}
              onDrop={(event) => {
                event.preventDefault();
                moveToken(dropPosition(event));
              }}
            >
              {Array.from({ length: tokens.length + 1 }, (_, index) => (
                <React.Fragment key={index}>
                  <button
                    type="button"
                    className={`formula-cursor ${cursor === index ? "is-active" : ""}`}
                    aria-label={`Insert at position ${index + 1}`}
                    aria-pressed={cursor === index}
                    onClick={() => setCursor(index)}
                    onDragOver={(event) => {
                      if (dragged.current === null) return;
                      event.preventDefault();
                      event.stopPropagation();
                      setCursor(index);
                    }}
                    onDrop={(event) => {
                      event.stopPropagation();
                      event.preventDefault();
                      moveToken(index);
                    }}
                  />
                  {index < tokens.length && (
                    <button
                      type="button"
                      data-token-index={index}
                      className={`formula-token ${typeof tokens[index] === "object" ? "field-token" : ""} ${selected.includes(index) ? "is-selected" : ""}`}
                      draggable
                      onDragStart={(event) => {
                        dragged.current = index;
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", String(index));
                      }}
                      onDragEnd={() => { dragged.current = null; }}
                      onClick={() => setSelected(selected.includes(index)
                        ? selected.filter((item) => item !== index) : [...selected, index])}
                      aria-pressed={selected.includes(index)}
                    >
                      {typeof tokens[index] === "object"
                        ? labels[tokens[index].field] || tokens[index].field
                        : { "*": "×", "/": "÷", "-": "−" }[tokens[index]] || tokens[index]}
                    </button>
                  )}
                </React.Fragment>
              ))}
              {!tokens.length && <span className="formula-placeholder">Add numbers or fields below…</span>}
            </div>
            <div className="formula-inserters">
              <div className="formula-builder-row">
                <label htmlFor="formula-field">Sheet field</label>
                <select
                  id="formula-field"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                >
                  <option value="">Choose a field</option>
                  {fields.map((input) => (
                    <option key={input.name} value={input.name}>
                      {labels[input.name]}
                    </option>
                  ))}
                </select>
                <button
                  className="standard-button"
                  disabled={!reference}
                  onClick={() => insert({ field: reference })}
                >
                  Insert
                </button>
              </div>
              <div className="formula-builder-row">
                <label htmlFor="formula-number">Number</label>
                <input
                  id="formula-number"
                  inputMode="decimal"
                  value={number}
                  onChange={(event) => setNumber(event.target.value)}
                />
                <button
                  className="standard-button"
                  disabled={!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(number)}
                  onClick={() => {
                    insert(number);
                    setNumber("");
                  }}
                >
                  Insert
                </button>
              </div>
            </div>
            <div className="formula-operations">
              <button
                className="standard-button"
                disabled={!selected.length}
                onClick={removeSelected}
              >
                Remove selected{selected.length ? ` (${selected.length})` : ""}
              </button>
              {["+", "-", "*", "/", ","].map((operator) => (
                <button
                  className="standard-button"
                  key={operator}
                  onClick={() => insert(operator)}
                >
                  {{ "*": "×", "/": "÷", "-": "−" }[operator] || operator}
                </button>
              ))}
              <button
                className="standard-button"
                onClick={() => groupSelection()}
                aria-label="Surround selected items with parentheses"
                title="Group selected items in parentheses"
              >
                ( )
              </button>
              {["min", "max", "ceil", "floor"].map((name) => (
                <button
                  className="standard-button"
                  key={name}
                  onClick={() => groupSelection(name)}
                  title={`Wrap selected items in ${name}`}
                >
                  {name}( )
                </button>
              ))}
              <button
                className="standard-button"
                disabled={!tokens.length}
                onClick={() => {
                  setTokens(tokens.slice(0, -1));
                  setCursor(Math.min(cursor, tokens.length - 1));
                  setSelected(selected.filter((index) => index < tokens.length - 1));
                }}
              >
                Undo
              </button>
              <button
                className="standard-button"
                disabled={!tokens.length}
                onClick={() => {
                  setTokens([]);
                  setCursor(0);
                  setSelected([]);
                }}
              >
                Clear
              </button>
            </div>
            <p
              className={error ? "formula-error" : "formula-preview"}
              role="status"
            >
              {error || `Result: ${Number(result.toFixed(8))}`}
            </p>
            <div className="formula-actions">
              <button
                className="standard-button"
                disabled={!fieldFormula(editing.name)}
                onClick={() => {
                  setFormula(editing.name, null);
                  close();
                }}
              >
                Remove formula
              </button>
              <button
                className="standard-button primary-button"
                disabled={Boolean(error)}
                onClick={() => {
                  setFormula(editing.name, tokens);
                  close();
                }}
              >
                Save
              </button>
            </div>
          </section>
        </div>
      )}
    </React.Fragment>,
    document.body,
  );
}
