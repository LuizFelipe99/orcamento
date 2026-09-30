import type { PlanPoint, PlanSegment } from '../domain/points';
import type { ConfiguredRoofPlane } from '../domain/roofPlane';
import { BOUNDARY_TOLERANCE_IN_METERS } from './numericPrecision';
import { polygonArea, segmentLength } from './planMeasurements';
import { isSegmentContainedIn } from './segmentGeometry';
import { dotProduct, negateVector, subtractPoints } from './vectorMath';

const PERCENT_DIVISOR = 100;

export const slopeRatio = (slopePercent: number): number => slopePercent / PERCENT_DIVISOR;

export const slopeAngleInDegrees = (slopePercent: number): number =>
  (Math.atan(slopeRatio(slopePercent)) * 180) / Math.PI;

export const slopeLengthFactor = (slopePercent: number): number => Math.sqrt(1 + slopeRatio(slopePercent) ** 2);

export const realSurfaceArea = (outline: PlanPoint[], slopePercent: number): number =>
  polygonArea(outline) * slopeLengthFactor(slopePercent);

const unitLeftNormal = (segment: PlanSegment): PlanPoint => {
  const length = segmentLength(segment);

  return {
    x: -(segment.end.y - segment.start.y) / length,
    y: (segment.end.x - segment.start.x) / length,
  };
};

export const interiorUnitNormal = (outline: PlanPoint[], eave: PlanSegment): PlanPoint => {
  const leftNormal = unitLeftNormal(eave);
  const sideBalance = outline.reduce(
    (accumulatedBalance, vertex) => accumulatedBalance + dotProduct(subtractPoints(vertex, eave.start), leftNormal),
    0,
  );

  if (sideBalance >= 0) {
    return leftNormal;
  }

  return negateVector(leftNormal);
};

export const distanceFromEaveLine = (outline: PlanPoint[], eave: PlanSegment, point: PlanPoint): number =>
  dotProduct(subtractPoints(point, eave.start), interiorUnitNormal(outline, eave));

export const downhillDirection = (roofPlane: ConfiguredRoofPlane): PlanPoint =>
  negateVector(interiorUnitNormal(roofPlane.outline, roofPlane.eave));

export const heightAtPoint = (roofPlane: ConfiguredRoofPlane, point: PlanPoint): number =>
  distanceFromEaveLine(roofPlane.outline, roofPlane.eave, point) * slopeRatio(roofPlane.slopePercent);

export const isEdgeOnEave = (edge: PlanSegment, eave: PlanSegment): boolean =>
  isSegmentContainedIn(edge, eave, BOUNDARY_TOLERANCE_IN_METERS);
