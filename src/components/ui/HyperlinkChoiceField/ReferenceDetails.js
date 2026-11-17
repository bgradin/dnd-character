import React from "react";

const enumFields = {
  ability: "ability",
  fromAbilities: "ability",
  savingThrows: "ability",
  spellcastingAbility: "ability",
  size: "size",
  armorProficiencies: "armorType",
  armorTypes: "armorType",
  types: "weaponType",
  toolTypes: "toolType",
  damageResistance: "damageType",
  damageType: "damageType",
  languages: "language",
  skill: "skill",
  skills: "skill",
  fromSkills: "skill",
  typicalAlignments: "alignment",
  recharge: "restType",
};
const labels = {
  hitPointsAtFirstLevel: "Hit points at 1st level",
  hitPointsAtHigherLevels: "Hit points at higher levels",
  fromSkills: "Available skills",
  baseWalkingSpeed: "Walking speed (feet)",
  ability: "Ability",
  page: "Page",
  types: "Weapon types",
};
function label(key) {
  return (
    labels[key] ||
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (c) => c.toUpperCase())
  );
}

// Render reference prose as React elements, allowing formatting but no scripts or attributes.
function Prose({ text }) {
  const parsed = new DOMParser().parseFromString(text, "text/html");
  const tags = new Set([
    "p",
    "em",
    "strong",
    "b",
    "i",
    "ul",
    "ol",
    "li",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "blockquote",
  ]);
  function render(node, index) {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return null;
    const tag = node.tagName.toLowerCase();
    if (["script", "style", "iframe", "object"].includes(tag)) return null;
    if (tag === "br") return " ";
    const children = Array.from(node.childNodes).map(render);
    return React.createElement(
      tags.has(tag) ? tag : "span",
      { key: index },
      children,
    );
  }
  return (
    <div className="choice-reference-prose">
      {Array.from(parsed.body.childNodes).map(render)}
    </div>
  );
}
function Value({ value, field, enums, headingLevel }) {
  const Heading = `h${Math.min(headingLevel, 6)}`;
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    if (!value.length) return <span>None</span>;
    if (value.every((item) => typeof item !== "object")) {
      return (
        <span>
          {value
            .map((item) => enums[enumFields[field]]?.[item] ?? String(item))
            .join(", ")}
        </span>
      );
    }
    if (field === "equipment" || field === "features") {
      return (
        <div className="choice-reference-entries">
          {value.map((item, index) => (
            <section key={index}>
              <Value value={item} field={field} enums={enums} headingLevel={headingLevel} />
            </section>
          ))}
        </div>
      );
    }
    return (
      <ul>
        {value.map((item, index) => (
          <li key={index}>
            <Value value={item} field={field} enums={enums} headingLevel={headingLevel} />
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    if (
      field === "hitPointsAtFirstLevel" ||
      field === "hitPointsAtHigherLevels"
    ) {
      const base =
        field === "hitPointsAtFirstLevel"
          ? value.base
          : `${value.dice} (or ${value.average}) per level after 1st`;
      const ability = enums.ability?.[value.ability];
      return (
        <span>
          {base}
          {ability ? ` + your ${ability} modifier` : ""}
        </span>
      );
    }
    const { name, description, ...rest } = value;
    if (field === "toolProficiencies" && rest.types) {
      rest.toolTypes = rest.types;
      delete rest.types;
    }
    return (
      <React.Fragment>
        {name && <Heading>{name}</Heading>}
        {description && <Prose text={description} />}
        <Fields entry={rest} enums={enums} headingLevel={headingLevel + (name ? 1 : 0)} />
      </React.Fragment>
    );
  }
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value === "string" && /<[^>]+>/.test(value))
    return <Prose text={value} />;
  return <span>{enums[enumFields[field]]?.[value] ?? String(value)}</span>;
}
function Fields({ entry, enums, exclude = [], headingLevel = 3 }) {
  const Heading = `h${Math.min(headingLevel, 6)}`;
  return (
    <div className="choice-reference-fields">
      {Object.entries(entry)
        .filter(
          ([key, value]) =>
            !exclude.includes(key) && value !== null && value !== undefined,
        )
        .map(([key, value]) => (
          <section key={key}>
            <Heading>{label(key)}</Heading>
            <div className="choice-reference-value">
              <Value value={value} field={key} enums={enums} headingLevel={headingLevel + 1} />
            </div>
          </section>
        ))}
    </div>
  );
}
export default function ReferenceDetails({ details }) {
  if (!details)
    return <p>No reference details are available for this choice.</p>;
  const { entry, parent, source, enums } = details;
  return (
    <article className="choice-reference">
      {source && (
        <p className="choice-reference-source">
          {[source.name, source.edition, entry.page && `Page ${entry.page}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      {parent && (
        <section>
          <h3>Inherited from {parent.name}</h3>
          <Fields
            entry={parent}
            enums={enums}
            headingLevel={4}
            exclude={["name", "page", "subraces", "variants"]}
          />
          <h3>{entry.name} traits</h3>
        </section>
      )}
      <Fields entry={entry} enums={enums} headingLevel={parent ? 4 : 3} exclude={["name", "page"]} />
    </article>
  );
}
