export type TileSpecification = {
  tilesPerSquareMeter: number | null;
  ridgeTilesPerLinearMeter: number | null;
  wastePercent: number | null;
};

export type TileEstimate = {
  roofTileCount: number | null;
  ridgeTileCount: number | null;
};

const PERCENT_DIVISOR = 100;
const QUANTITY_ROUNDING_TOLERANCE = 1e-9;

const applyWaste = (quantity: number, wastePercent: number | null): number =>
  quantity * (1 + (wastePercent ?? 0) / PERCENT_DIVISOR);

const roundUpToWholePieces = (quantity: number): number => Math.ceil(quantity - QUANTITY_ROUNDING_TOLERANCE);

const estimatePieces = (measure: number, piecesPerUnit: number | null, wastePercent: number | null): number | null => {
  if (piecesPerUnit === null) {
    return null;
  }

  return roundUpToWholePieces(applyWaste(measure * piecesPerUnit, wastePercent));
};

export const estimateTiles = (
  realRoofAreaInSquareMeters: number,
  cappedLineLengthInMeters: number,
  tileSpecification: TileSpecification,
): TileEstimate => ({
  roofTileCount: estimatePieces(
    realRoofAreaInSquareMeters,
    tileSpecification.tilesPerSquareMeter,
    tileSpecification.wastePercent,
  ),
  ridgeTileCount: estimatePieces(
    cappedLineLengthInMeters,
    tileSpecification.ridgeTilesPerLinearMeter,
    tileSpecification.wastePercent,
  ),
});
