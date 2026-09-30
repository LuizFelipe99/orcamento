import type { PlanPoint } from '../domain/points';
import { findBoundarySnapPoint } from './boundarySnapping';
import { removeFloatingNoise } from './numericPrecision';
import { arePointsCoincident, distanceBetween } from './planMeasurements';

const ANGLE_LOCK_STEP_IN_RADIANS = Math.PI / 4;

export const MINIMUM_VERTICES_TO_CLOSE_OUTLINE = 3;

export type DraftSnapKind = 'free' | 'closingVertex' | 'boundary';

export type DraftTarget = {
  targetPoint: PlanPoint;
  snapKind: DraftSnapKind;
};

export type DraftSnapOptions = {
  snapToleranceInMeters: number;
  gridStepInMeters: number | null;
  isAngleLockActive: boolean;
};

export type DraftSnapCandidates = {
  closingVertex: PlanPoint | null;
  boundaryOutlines: PlanPoint[][];
};

const snapValueToStep = (value: number, stepInMeters: number | null): number => {
  if (!stepInMeters) {
    return value;
  }

  return Math.round(value / stepInMeters) * stepInMeters;
};

export const snapPointToGrid = (point: PlanPoint, gridStepInMeters: number | null): PlanPoint => ({
  x: removeFloatingNoise(snapValueToStep(point.x, gridStepInMeters)),
  y: removeFloatingNoise(snapValueToStep(point.y, gridStepInMeters)),
});

const pointAtDistance = (origin: PlanPoint, angleInRadians: number, distanceInMeters: number): PlanPoint => ({
  x: removeFloatingNoise(origin.x + Math.cos(angleInRadians) * distanceInMeters),
  y: removeFloatingNoise(origin.y + Math.sin(angleInRadians) * distanceInMeters),
});

export const constrainToAngleLock = (
  origin: PlanPoint,
  cursorPoint: PlanPoint,
  lengthStepInMeters: number | null,
): PlanPoint => {
  const deltaX = cursorPoint.x - origin.x;
  const deltaY = cursorPoint.y - origin.y;
  const cursorAngle = Math.atan2(deltaY, deltaX);
  const lockedAngle = Math.round(cursorAngle / ANGLE_LOCK_STEP_IN_RADIANS) * ANGLE_LOCK_STEP_IN_RADIANS;
  const projectedLength = deltaX * Math.cos(lockedAngle) + deltaY * Math.sin(lockedAngle);

  return pointAtDistance(origin, lockedAngle, snapValueToStep(projectedLength, lengthStepInMeters));
};

export const pointAtDistanceTowards = (
  origin: PlanPoint,
  directionPoint: PlanPoint,
  distanceInMeters: number,
): PlanPoint | null => {
  const deltaX = directionPoint.x - origin.x;
  const deltaY = directionPoint.y - origin.y;

  if (deltaX === 0 && deltaY === 0) {
    return null;
  }

  return pointAtDistance(origin, Math.atan2(deltaY, deltaX), distanceInMeters);
};

export const resolveDraftTarget = (
  cursorPoint: PlanPoint,
  lastDraftVertex: PlanPoint | null,
  snapOptions: DraftSnapOptions,
  snapCandidates: DraftSnapCandidates,
): DraftTarget => {
  const { closingVertex, boundaryOutlines } = snapCandidates;
  const { snapToleranceInMeters, gridStepInMeters, isAngleLockActive } = snapOptions;

  if (closingVertex && distanceBetween(cursorPoint, closingVertex) <= snapToleranceInMeters) {
    return { targetPoint: closingVertex, snapKind: 'closingVertex' };
  }

  const boundarySnapPoint = findBoundarySnapPoint(cursorPoint, boundaryOutlines, snapToleranceInMeters);

  if (boundarySnapPoint) {
    return { targetPoint: boundarySnapPoint, snapKind: 'boundary' };
  }

  if (lastDraftVertex && isAngleLockActive) {
    return {
      targetPoint: constrainToAngleLock(lastDraftVertex, cursorPoint, gridStepInMeters),
      snapKind: 'free',
    };
  }

  return { targetPoint: snapPointToGrid(cursorPoint, gridStepInMeters), snapKind: 'free' };
};

export const isDegenerateSegment = (
  segmentStart: PlanPoint,
  segmentEnd: PlanPoint,
  toleranceInMeters: number,
): boolean => distanceBetween(segmentStart, segmentEnd) <= toleranceInMeters;

export const removeClosingDuplicateVertex = (vertices: PlanPoint[]): PlanPoint[] => {
  const [firstVertex] = vertices;
  const lastVertex = vertices.at(-1);

  if (!firstVertex || !lastVertex || vertices.length < 2) {
    return vertices;
  }

  if (!arePointsCoincident(firstVertex, lastVertex)) {
    return vertices;
  }

  return vertices.slice(0, -1);
};
