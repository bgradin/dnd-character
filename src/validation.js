export function validateInteger(value) {
  if (!(value instanceof Number) || value !== Math.round(value)) {
    throw new Error(`Invalid value: ${value}`);
  }
}
