const toBrazilianDecimal = (value: number, fractionDigits: number): string =>
  value.toFixed(fractionDigits).replace('.', ',');

export const formatMeters = (valueInMeters: number): string => `${toBrazilianDecimal(valueInMeters, 2)} m`;

export const formatSquareMeters = (valueInSquareMeters: number): string =>
  `${toBrazilianDecimal(valueInSquareMeters, 2)} m²`;

export const formatPercent = (valueInPercent: number): string => {
  const fractionDigits = Number.isInteger(valueInPercent) ? 0 : 1;
  return `${toBrazilianDecimal(valueInPercent, fractionDigits)}%`;
};

export const formatDegrees = (valueInDegrees: number): string => `${toBrazilianDecimal(valueInDegrees, 1)}°`;
