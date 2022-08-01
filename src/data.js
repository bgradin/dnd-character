const DATA_KEY = "character-sheet-data";
const APPROVED_CLASSES = [ HTMLInputElement, HTMLTextAreaElement ];

if (!localStorage.getItem(DATA_KEY)) {
  localStorage.setItem(DATA_KEY, JSON.stringify({}));
}

function load(key) {
  return JSON.parse(localStorage.getItem(DATA_KEY))[key];
}

function store(key, value) {
  const data = JSON.parse(localStorage.getItem(DATA_KEY));
  data[key] = value;
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function register(input) {
  if (APPROVED_CLASSES.every(x => !(input instanceof x))) {
    return;
  }

  window.addEventListener("DOMContentLoaded", () => {
    const value = load(input.name);
    if (input instanceof HTMLInputElement && input.type === "checkbox") {
      input.checked = value;
    } else if (value) {
      input.value = value;
    }
  });

  function handleInputChange() {
    const value = input instanceof HTMLInputElement && input.type === "checkbox"
      ? input.checked
      : input.value;
    store(input.name, value);
  }

  input.addEventListener("change", handleInputChange);
  input.addEventListener("keydown", handleInputChange)
}
