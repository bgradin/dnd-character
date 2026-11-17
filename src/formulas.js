const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const skillAbilities = {
  acrobatics: 'dexterity', 'animal-handling': 'wisdom', arcana: 'intelligence',
  athletics: 'strength', deception: 'charisma', history: 'intelligence',
  insight: 'wisdom', intimidation: 'charisma', investigation: 'intelligence',
  medicine: 'wisdom', nature: 'intelligence', perception: 'wisdom',
  performance: 'charisma', persuasion: 'charisma', religion: 'intelligence',
  'sleight-of-hand': 'dexterity', stealth: 'dexterity', survival: 'wisdom',
};

export function isProficiencyField(name) {
  return [...abilities, ...Object.keys(skillAbilities)].some(field => name === `${field}-proficiency`);
}

export function defaultFormulas() {
  return Object.fromEntries([
    ['speed', ['max', '(', { field: 'race.baseWalkingSpeed' }, ',', '0', ')']],
    ['hitpointsMax', [{ field: 'class.hitPointsAtFirstLevel' }, '+', '(',
      { field: 'class.hitPointsAtHigherLevels' }, '*', { field: 'level' }, '+',
      { field: 'constitution-modifier' }, ')']],
    ...abilities.map(ability => [`${ability}-modifier`,
      ['floor', '(', 'max', '(', '(', { field: `${ability}-score` }, '-', '10', ')', '/', '2', ',', '0', ')', ')']]),
    ...Object.entries(skillAbilities).map(([skill, ability]) => [`${skill}-score`,
      ['(', { field: 'proficiencyBonus' }, '*', { field: `${skill}-proficiency` }, ')', '+', { field: `${ability}-modifier` }]]),
  ]);
}

// A deliberately small grammar: numbers, field references, arithmetic, grouping and min/max/ceil/floor.
export function evaluateFormula(tokens, resolve) {
  let index = 0;
  function primary() {
    const token = tokens[index++];
    if (token === '+' || token === '-') return (token === '-' ? -1 : 1) * primary();
    if (token === 'min' || token === 'max' || token === 'ceil' || token === 'floor') {
      if (tokens[index++] !== '(') throw new Error(`Add parentheses after ${token}.`);
      const values = [expression()];
      while (tokens[index] === ',') {
        index++;
        values.push(expression());
      }
      if (tokens[index++] !== ')') throw new Error('Close each parenthesis.');
      if (token === 'ceil' || token === 'floor') {
        if (values.length !== 1) throw new Error(`${token} needs exactly one value.`);
        return token === 'ceil' ? Math.ceil(values[0]) : Math.floor(values[0]);
      }
      if (values.length < 2) throw new Error(`${token} needs at least two values separated by commas.`);
      return token === 'min' ? Math.min(...values) : Math.max(...values);
    }
    if (token === '(') {
      const value = expression();
      if (tokens[index++] !== ')') throw new Error('Close each parenthesis.');
      return value;
    }
    if (token && typeof token === 'object' && typeof token.field === 'string') return resolve(token.field);
    if (typeof token === 'string' && /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) return Number(token);
    throw new Error('Add a number or field between operators.');
  }
  function product() {
    let value = primary();
    while (tokens[index] === '*' || tokens[index] === '/') {
      const operator = tokens[index++], right = primary();
      if (operator === '/' && right === 0) throw new Error('Cannot divide by zero.');
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  }
  function expression() {
    let value = product();
    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index++], right = product();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }
  if (!Array.isArray(tokens) || !tokens.length || tokens.length > 200) throw new Error('Add a formula (up to 200 items).');
  const value = expression();
  if (index !== tokens.length) throw new Error('Add an operator between values.');
  if (!Number.isFinite(value)) throw new Error('The result must be a finite number.');
  return value;
}
