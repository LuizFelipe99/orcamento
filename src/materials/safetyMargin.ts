const PERCENT_DIVISOR = 100;
const QUANTITY_ROUNDING_TOLERANCE = 1e-9;

export const applyPercentIncrease = (amount: number, increasePercent: number | null): number =>
  amount * (1 + (increasePercent ?? 0) / PERCENT_DIVISOR);

export const roundUpToWholeUnits = (amount: number): number => Math.ceil(amount - QUANTITY_ROUNDING_TOLERANCE);

export const addPieceMargin = (exactQuantity: number, marginPercent: number | null): number =>
  roundUpToWholeUnits(applyPercentIncrease(exactQuantity, marginPercent));

export const addLengthMargin = (exactLengthInMeters: number, marginPercent: number | null): number =>
  roundUpToWholeUnits(applyPercentIncrease(exactLengthInMeters, marginPercent));
