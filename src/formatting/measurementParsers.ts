const parseDecimalInput = (rawInput: string): number | null => {
  const trimmedInput = rawInput.trim();

  if (trimmedInput === '') {
    return null;
  }

  const parsedValue = Number(trimmedInput.replace(',', '.'));

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return parsedValue;
};

export const parsePositiveNumber = (rawInput: string): number | null => {
  const parsedValue = parseDecimalInput(rawInput);

  if (parsedValue === null || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
};

export const parseNonNegativeNumber = (rawInput: string): number | null => {
  const parsedValue = parseDecimalInput(rawInput);

  if (parsedValue === null || parsedValue < 0) {
    return null;
  }

  return parsedValue;
};

export const parseLengthInMeters = parsePositiveNumber;

export const parseNonNegativeLengthInMeters = parseNonNegativeNumber;

export const parseSlopePercent = (rawInput: string): number | null => {
  const parsedSlope = parseDecimalInput(rawInput);

  if (parsedSlope === null || parsedSlope <= 0) {
    return null;
  }

  return parsedSlope;
};
