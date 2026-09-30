import type { PlanPoint } from '../domain/points';

export const subtractPoints = (minuend: PlanPoint, subtrahend: PlanPoint): PlanPoint => ({
  x: minuend.x - subtrahend.x,
  y: minuend.y - subtrahend.y,
});

export const addPoints = (firstPoint: PlanPoint, secondPoint: PlanPoint): PlanPoint => ({
  x: firstPoint.x + secondPoint.x,
  y: firstPoint.y + secondPoint.y,
});

export const scaleVector = (vector: PlanPoint, factor: number): PlanPoint => ({
  x: vector.x * factor,
  y: vector.y * factor,
});

export const dotProduct = (firstVector: PlanPoint, secondVector: PlanPoint): number =>
  firstVector.x * secondVector.x + firstVector.y * secondVector.y;

export const crossProduct = (firstVector: PlanPoint, secondVector: PlanPoint): number =>
  firstVector.x * secondVector.y - firstVector.y * secondVector.x;

export const negateVector = (vector: PlanPoint): PlanPoint => ({
  x: -vector.x,
  y: -vector.y,
});

export const normalizeVector = (vector: PlanPoint): PlanPoint => {
  const length = Math.hypot(vector.x, vector.y);

  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return scaleVector(vector, 1 / length);
};

export const translatePoint = (origin: PlanPoint, direction: PlanPoint, distance: number): PlanPoint =>
  addPoints(origin, scaleVector(direction, distance));
