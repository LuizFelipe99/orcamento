import type { PlanPoint, PlanSegment } from '../domain/points';
import type { ConfiguredRoofPlane } from '../domain/roofPlane';
import { listPolygonEdges } from './planMeasurements';
import { interiorUnitNormal } from './roofPlaneGeometry';
import { addPoints, dotProduct, normalizeVector, scaleVector, subtractPoints } from './vectorMath';

const END_MEMBER_MINIMUM_GAP_IN_METERS = 0.05;
const SPACING_ROUNDING_TOLERANCE = 1e-9;
const BOUNDARY_SAMPLING_INSET_IN_METERS = 1e-6;

export type PlaneAxes = {
  alongEave: PlanPoint;
  upSlope: PlanPoint;
};

export type ScanDirection = {
  spacingAxis: PlanPoint;
  memberAxis: PlanPoint;
};

export type OffsetRange = {
  minimumOffset: number;
  maximumOffset: number;
};

export type PlanMemberSegment = {
  segment: PlanSegment;
  planLengthInMeters: number;
};

export const resolvePlaneAxes = (roofPlane: ConfiguredRoofPlane): PlaneAxes => ({
  alongEave: normalizeVector(subtractPoints(roofPlane.eave.end, roofPlane.eave.start)),
  upSlope: interiorUnitNormal(roofPlane.outline, roofPlane.eave),
});

export const measureOffsetRange = (footprint: PlanPoint[], axis: PlanPoint): OffsetRange => {
  const offsets = footprint.map((vertex) => dotProduct(vertex, axis));

  return { minimumOffset: Math.min(...offsets), maximumOffset: Math.max(...offsets) };
};

export const listEvenlySpacedOffsets = (minimumOffset: number, maximumOffset: number, spacingInMeters: number): number[] => {
  const regularCount = Math.floor((maximumOffset - minimumOffset) / spacingInMeters + SPACING_ROUNDING_TOLERANCE) + 1;
  const regularOffsets = Array.from({ length: regularCount }, (_, offsetIndex) => minimumOffset + offsetIndex * spacingInMeters);
  const lastRegularOffset = regularOffsets.at(-1) ?? minimumOffset;

  if (maximumOffset - lastRegularOffset <= END_MEMBER_MINIMUM_GAP_IN_METERS) {
    return regularOffsets;
  }

  return [...regularOffsets, maximumOffset];
};

const findMemberAxisCrossings = (footprint: PlanPoint[], scanDirection: ScanDirection, spacingOffset: number): number[] =>
  listPolygonEdges(footprint)
    .flatMap((edge) => {
      const startSide = dotProduct(edge.start, scanDirection.spacingAxis) - spacingOffset;
      const endSide = dotProduct(edge.end, scanDirection.spacingAxis) - spacingOffset;

      if (startSide > 0 === endSide > 0) {
        return [];
      }

      const crossingRatio = startSide / (startSide - endSide);
      const crossingPoint = addPoints(edge.start, scaleVector(subtractPoints(edge.end, edge.start), crossingRatio));

      return [dotProduct(crossingPoint, scanDirection.memberAxis)];
    })
    .sort((firstCrossing, secondCrossing) => firstCrossing - secondCrossing);

const pairCrossings = (sortedCrossings: number[]): Array<[number, number]> =>
  sortedCrossings.flatMap((crossing, crossingIndex) =>
    crossingIndex % 2 === 0 && crossingIndex + 1 < sortedCrossings.length
      ? [[crossing, sortedCrossings[crossingIndex + 1]] as [number, number]]
      : [],
  );

const pointFromScanDirection = (scanDirection: ScanDirection, spacingOffset: number, memberOffset: number): PlanPoint =>
  addPoints(scaleVector(scanDirection.spacingAxis, spacingOffset), scaleVector(scanDirection.memberAxis, memberOffset));

export const layoutParallelSegments = (
  footprint: PlanPoint[],
  scanDirection: ScanDirection,
  spacingOffsets: number[],
  minimumPlanLengthInMeters: number,
): PlanMemberSegment[] => {
  const { minimumOffset, maximumOffset } = measureOffsetRange(footprint, scanDirection.spacingAxis);
  const sampleInsideFootprint = (spacingOffset: number): number =>
    Math.min(
      Math.max(spacingOffset, minimumOffset + BOUNDARY_SAMPLING_INSET_IN_METERS),
      maximumOffset - BOUNDARY_SAMPLING_INSET_IN_METERS,
    );

  return spacingOffsets.flatMap((spacingOffset) =>
    pairCrossings(findMemberAxisCrossings(footprint, scanDirection, sampleInsideFootprint(spacingOffset)))
      .map(([lowerOffset, upperOffset]) => ({
        segment: {
          start: pointFromScanDirection(scanDirection, spacingOffset, lowerOffset),
          end: pointFromScanDirection(scanDirection, spacingOffset, upperOffset),
        },
        planLengthInMeters: upperOffset - lowerOffset,
      }))
      .filter(({ planLengthInMeters }) => planLengthInMeters >= minimumPlanLengthInMeters),
  );
};
