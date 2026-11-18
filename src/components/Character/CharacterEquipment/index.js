import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { ChevronLeft, GripVertical } from "lucide-react";
import {
  equipmentEntries,
  setEquipmentEntries,
  register,
  subscribeFields,
} from "../../../data";
import { referenceChoices, referenceChoiceDetails } from "../../../startupData";
import useListReorder from "../../../hooks/useListReorder";
import ReferenceDetails from "../../ui/HyperlinkChoiceField/ReferenceDetails";
import "../CharacterAttacksSpellcasting/CharacterAttacksSpellcasting.scss";
import "./CharacterEquipment.scss";

const equipmentTypes = [
  ["gear", "Adventuring gear"],
  ["armor", "Armor"],
  ["weapons", "Weapons"],
  ["tools", "Tools"],
  ["mountsVehicles", "Mounts and vehicles"],
];
function customFields() {
  return [
    ["name", "Name"],
    ["cost", "Cost (CP)"],
    ["weight", "Weight (lb.)"],
    ["description", "Description"],
  ];
}

export default function CharacterEquipment() {
  const [, render] = useState(0);
  const [pages, setPages] = useState([]);
  const [direction, setDirection] = useState("forward");
  const page = pages[pages.length - 1];
  const pageRefs = useRef(new Map());
  const positions = useRef(new Map());
  const pageKey = page
    ? `${page.kind}:${page.collection || ""}:${page.name || ""}`
    : "closed";
  if (!pageRefs.current.has(pageKey))
    pageRefs.current.set(pageKey, React.createRef());
  const pageRef = pageRefs.current.get(pageKey);
  const [collection, setCollection] = useState("gear");
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState({});
  const dialog = useRef(null);
  const trigger = useRef(null);
  const addButton = useRef(null);
  const entries = equipmentEntries();
  const reorder = useListReorder(equipmentEntries, setEquipmentEntries);
  useEffect(() => subscribeFields(() => render((value) => value + 1)), []);

  function open(next, event) {
    trigger.current = event.currentTarget;
    setQuery("");
    positions.current.clear();
    setDirection("forward");
    setPages([next]);
  }
  function showDetails(name) {
    positions.current.set(pageKey, {
      scroll: pageRef.current.querySelector(".choice-page-body").scrollTop,
      trigger: `details:${name}`,
    });
    setDirection("forward");
    setPages((previous) => [
      ...previous,
      { kind: "details", collection, name },
    ]);
  }
  function showCustom() {
    positions.current.set(pageKey, {
      scroll: pageRef.current.querySelector(".choice-page-body").scrollTop,
      trigger: "custom",
    });
    setCustom({ collection, name: "" });
    setDirection("forward");
    setPages((previous) => [...previous, { kind: "custom" }]);
  }
  function addCustom(event) {
    event.preventDefault();
    if (!custom.name.trim()) return;
    const fields = customFields(custom.collection);
    const entry = { collection: custom.collection, custom: true };
    fields.forEach(([key]) => {
      if (custom[key]?.trim()) entry[key] = custom[key].trim();
    });
    setEquipmentEntries([
      ...equipmentEntries(),
      { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
    ]);
    close();
  }
  function back() {
    setDirection("back");
    setPages((previous) => previous.slice(0, -1));
  }
  function preparePage() {
    const element = pageRef.current;
    if (!element) return;
    element.removeAttribute("aria-hidden");
    element.removeAttribute("inert");
    element.querySelector(".choice-page-body").scrollTop =
      positions.current.get(pageKey)?.scroll || 0;
  }
  function focusPage() {
    preparePage();
    const controls = Array.from(
      pageRef.current.querySelectorAll("button, input, select, textarea"),
    );
    const previous = positions.current.get(pageKey)?.trigger;
    (
      controls.find((control) => control.dataset.choiceKey === previous) ||
      controls[0] ||
      dialog.current.querySelector("button")
    ).focus({ preventScroll: true });
  }
  function close() {
    setPages([]);
    const target = trigger.current;
    (target && target.isConnected ? target : addButton.current).focus();
  }
  useEffect(() => {
    if (!page) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    focusPage();
    function keydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key === "Tab") {
        const controls = Array.from(
          dialog.current.querySelectorAll(
            'button, input, select, textarea, [tabindex="0"]',
          ),
        ).filter((control) => !control.closest('[aria-hidden="true"]'));
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", keydown);
    };
  }, [Boolean(page)]);

  function add(name, selectedCollection = collection) {
    setEquipmentEntries([
      ...equipmentEntries(),
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        collection: selectedCollection,
        name,
      },
    ]);
    close();
  }
  function remove(id) {
    setEquipmentEntries(entries.filter((entry) => entry.id !== id));
    addButton.current.focus();
  }
  const details =
    page && page.kind === "details" && !page.legacy && !page.custom
      ? referenceChoiceDetails(page.collection, page.name)
      : null;
  const choices = referenceChoices(collection).filter((name) =>
    name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="character-equipment">
      <div className="attack-list-content">
        <h2 className="attack-list-title">Equipment</h2>
        <div className="character-equipment-wrap">
          <div
            className="character-equipment__stats"
            role="group"
            aria-label="Gold"
          >
            {["cp", "sp", "ep", "gp", "pp"].map((currency) => (
              <label className="character-equipment__stats-item" key={currency}>
                <span className="character-equipment__stats-item-text">
                  {currency.toUpperCase()}
                </span>
                <input
                  name={currency}
                  type="text"
                  className="character-equipment__stats-item-input"
                  ref={register}
                />
              </label>
            ))}
            <span className="equipment-gold-label">Gold</span>
          </div>
          <div className="equipment-list-content">
            {!entries.length && (
              <p className="attack-list-empty">Add equipment.</p>
            )}
            <ul className="attack-list">
              {entries.map((item) => {
                const reference =
                  item.legacy || item.custom
                    ? null
                    : referenceChoiceDetails(item.collection, item.name);
                const entry = reference ? reference.entry : item;
                return (
                  <li key={item.id} {...reorder.itemProps(item.id)}>
                    <div className="attack-list-heading">
                      <button
                        type="button"
                        className="attack-link"
                        onClick={(event) =>
                          open({ kind: "details", ...item }, event)
                        }
                      >
                        {item.name}
                      </button>
                    </div>
                    <dl className="attack-list-stats">
                      {entry.cost != null && (
                        <div>
                          <dt>Cost</dt>
                          <dd>{entry.cost} CP</dd>
                        </div>
                      )}
                      {entry.weight != null && (
                        <div>
                          <dt>Weight</dt>
                          <dd>{entry.weight} lb.</dd>
                        </div>
                      )}
                    </dl>
                    <div className="attack-list-actions">
                      <button
                        type="button"
                        className="attack-link"
                        aria-label={`Delete ${item.name}`}
                        onClick={() => remove(item.id)}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="attack-drag-handle"
                        {...reorder.handleProps(item)}
                      >
                        <GripVertical size={20} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <label className="attack-notes-label" htmlFor="equipment">
              Additional Notes
            </label>
            <textarea
              className="character-attack-spellcasting__textarea"
              name="equipment"
              id="equipment"
              rows="3"
              ref={register}
            />
            <div className="attack-list-footer">
              <button
                type="button"
                className="standard-button"
                ref={addButton}
                onClick={(event) => open({ kind: "add" }, event)}
              >
                Add equipment
              </button>
            </div>
          </div>
        </div>
      </div>
      {page &&
        createPortal(
          <div
            className="formula-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) close();
            }}
          >
            <section
              className="formula-modal default-box choice-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="equipment-dialog-title"
              ref={dialog}
            >
              <div className="formula-heading">
                <h2 id="equipment-dialog-title">
                  {page.kind === "add"
                    ? "Add equipment"
                    : page.kind === "custom"
                      ? "Custom equipment"
                      : page.name}
                </h2>
                <button
                  type="button"
                  className="formula-close"
                  aria-label="Close equipment dialog"
                  onClick={close}
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
              <TransitionGroup
                className="choice-pages"
                childFactory={(child) =>
                  React.cloneElement(child, {
                    classNames: `choice-slide-${direction}`,
                  })
                }
              >
                <CSSTransition
                  key={pageKey}
                  nodeRef={pageRef}
                  timeout={240}
                  classNames={`choice-slide-${direction}`}
                  onEnter={preparePage}
                  onEntered={focusPage}
                  onExit={() => {
                    const element = pageRef.current;
                    if (element) {
                      element.setAttribute("aria-hidden", "true");
                      element.setAttribute("inert", "");
                    }
                  }}
                >
                  <div className="choice-page" ref={pageRef}>
                    {pages.length > 1 && (
                      <nav
                        className="choice-page-navigation"
                        aria-label="Equipment navigation"
                      >
                        <button
                          type="button"
                          className="choice-back"
                          onClick={back}
                        >
                          <ChevronLeft size={18} aria-hidden="true" /> Back
                        </button>
                        {page.kind === "details" && (
                          <button
                            type="button"
                            className="standard-button"
                            aria-label={`Add ${page.name}`}
                            onClick={() => add(page.name, page.collection)}
                          >
                            Add
                          </button>
                        )}
                      </nav>
                    )}
                    <div
                      className="choice-page-body"
                      tabIndex="0"
                      aria-label={
                        page.kind === "details"
                          ? `${page.name} details`
                          : undefined
                      }
                    >
                      {page.kind === "details" ? (
                        <ReferenceDetails
                          collection={page.collection}
                          details={
                            details || {
                              entry: Object.fromEntries(
                                customFields()
                                  .filter(([key]) => page[key] != null)
                                  .map(([key]) => [key, page[key]]),
                              ),
                              enums: {},
                            }
                          }
                        />
                      ) : page.kind === "custom" ? (
                        <form
                          className="attack-custom-form"
                          onSubmit={addCustom}
                        >
                          <label>
                            Type
                            <select
                              value={custom.collection}
                              onChange={(event) =>
                                setCustom({
                                  ...custom,
                                  collection: event.target.value,
                                })
                              }
                            >
                              {equipmentTypes.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </label>
                          {customFields(custom.collection).map(
                            ([key, label]) => (
                              <label key={key}>
                                {label}
                                {key === "description" ? (
                                  <textarea
                                    rows="4"
                                    value={custom[key] || ""}
                                    onChange={(event) =>
                                      setCustom({
                                        ...custom,
                                        [key]: event.target.value,
                                      })
                                    }
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    required={key === "name"}
                                    value={custom[key] || ""}
                                    onChange={(event) =>
                                      setCustom({
                                        ...custom,
                                        [key]: event.target.value,
                                      })
                                    }
                                  />
                                )}
                              </label>
                            ),
                          )}
                          <div className="attack-custom-submit">
                            <button type="submit" className="standard-button">
                              Add custom equipment
                            </button>
                          </div>
                        </form>
                      ) : (
                        <React.Fragment>
                          <div className="attack-picker-controls">
                            <label>
                              Type
                              <select
                                value={collection}
                                onChange={(event) =>
                                  setCollection(event.target.value)
                                }
                              >
                                {equipmentTypes.map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Search
                              <input
                                type="search"
                                value={query}
                                onChange={(event) =>
                                  setQuery(event.target.value)
                                }
                              />
                            </label>
                            <button
                              type="button"
                              className="standard-button"
                              data-choice-key="custom"
                              onClick={showCustom}
                            >
                              Custom
                            </button>
                          </div>
                          <ul className="hyperlink-choice-options">
                            {choices.map((name) => (
                              <li key={name}>
                                <span className="choice-option-name">
                                  {name}
                                </span>
                                <div className="choice-option-actions">
                                  <button
                                    type="button"
                                    className="standard-button"
                                    data-choice-key={`details:${name}`}
                                    aria-label={`Details for ${name}`}
                                    onClick={() => showDetails(name)}
                                  >
                                    Details
                                  </button>
                                  <button
                                    type="button"
                                    className="standard-button"
                                    aria-label={`Add ${name}`}
                                    onClick={() => add(name)}
                                  >
                                    Add
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                          {!choices.length && <p>No matching {collection}.</p>}
                        </React.Fragment>
                      )}
                    </div>
                  </div>
                </CSSTransition>
              </TransitionGroup>
            </section>
          </div>,
          document.body,
        )}
    </div>
  );
}
