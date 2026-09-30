import type { PlanPoint, PlanSegment } from '../domain/points';
import { arePointsCoincident, distanceBetween } from './planMeasurements';

const ORIENTATION_TOLERANCE = 1e-9;

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

export const closestPointOnSegment = (point: PlanPoint, segment: PlanSegment): PlanPoint => {
  const deltaX = segment.end.x - segment.start.x;
  const deltaY = segment.end.y - segment.start.y;
  const squaredLength = deltaX * deltaX + deltaY * deltaY;

  if (squaredLength === 0) {
    return segment.start;
  }

  const projectionRatio = clamp(
    ((point.x - segment.start.x) * deltaX + (point.y - segment.start.y) * deltaY) / squaredLength,
    0,
    1,
  );

  return {
    x: segment.start.x + projectionRatio * deltaX,
    y: segment.start.y + projectionRatio * deltaY,
  };
};

export const distanceToSegment = (point: PlanPoint, segment: PlanSegment): number =>
  distanceBetween(point, closestPointOnSegment(point, segment));

export const isPointOnSegment = (point: PlanPoint, segment: PlanSegment, toleranceInMeters: number): boolean =>
  distanceToSegment(point, segment) <= toleranceInMeters;

export const isPointInsideSegmentInterior = (
  point: PlanPoint,
  segment: PlanSegment,
  toleranceInMeters: number,
): boolean => {
  if (arePointsCoincident(point, segment.start) || arePointsCoincident(point, segment.end)) {
    return false;
  }

  return isPointOnSegment(point, segment, toleranceInMeters);
};

export const isSegmentContainedIn = (
  innerSegment: PlanSegment,
  outerSegment: PlanSegment,
  toleranceInMeters: number,
): boolean =>
  isPointOnSegment(innerSegment.start, outerSegment, toleranceInMeters) &&
  isPointOnSegment(innerSegment.end, outerSegment, toleranceInMeters);

export const areSegmentsCoincident = (firstSegment: PlanSegment, secondSegment: PlanSegment): boolean => {
  const haveSameDirection =
    arePointsCoincident(firstSegment.start, secondSegment.start) &&
    arePointsCoincident(firstSegment.end, secondSegment.end);

  if (haveSameDirection) {
    return true;
  }

  return (
    arePointsCoincident(firstSegment.start, secondSegment.end) &&
    arePointsCoincident(firstSegment.end, secondSegment.start)
  );
};

const orientationSign = (origin: PlanPoint, firstPoint: PlanPoint, secondPoint: PlanPoint): number => {
  const crossProduct =
    (firstPoint.x - origin.x) * (secondPoint.y - origin.y) - (firstPoint.y - origin.y) * (secondPoint.x - origin.x);

  if (Math.abs(crossProduct) < ORIENTATION_TOLERANCE) {
    return 0;
  }

  return Math.sign(crossProduct);
};

export const doSegmentsProperlyIntersect = (firstSegment: PlanSegment, secondSegment: PlanSegment): boolean => {
  const secondStartSide = orientationSign(firstSegment.start, firstSegment.end, secondSegment.start);
  const secondEndSide = orientationSign(firstSegment.start, firstSegment.end, secondSegment.end);
  const firstStartSide = orientationSign(secondSegment.start, secondSegment.end, firstSegment.start);
  const firstEndSide = orientationSign(secondSegment.start, secondSegment.end, firstSegment.end);

  return secondStartSide * secondEndSide < 0 && firstStartSide * firstEndSide < 0;
};
