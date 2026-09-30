import { applyPercentIncrease, roundUpToWholeUnits } from './safetyMargin';

export type TileSpecification = {
  tilesPerSquareMeter: number | null;
  ridgeTilesPerLinearMeter: number | null;
  wastePercent: number | null;
};

export type TileEstimate = {
  roofTileCount: number | null;
  ridgeTileCount: number | null;
};

const estimatePieces = (measure: number, piecesPerUnit: number | null, wastePercent: number | null): number | null => {
  if (piecesPerUnit === null) {
    return null;
  }

  return roundUpToWholeUnits(applyPercentIncrease(measure * piecesPerUnit, wastePercent));
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
