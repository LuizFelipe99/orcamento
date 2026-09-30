import type { PlanPoint } from '../domain/points';
import { distanceBetween, listPolygonEdges } from './planMeasurements';
import { closestPointOnSegment } from './segmentGeometry';

const findNearestPointWithinTolerance = (
  referencePoint: PlanPoint,
  candidatePoints: PlanPoint[],
  toleranceInMeters: number,
): PlanPoint | null => {
  const nearestCandidate = candidatePoints
    .map((candidatePoint) => ({ candidatePoint, distanceInMeters: distanceBetween(referencePoint, candidatePoint) }))
    .filter(({ distanceInMeters }) => distanceInMeters <= toleranceInMeters)
    .sort((firstCandidate, secondCandidate) => firstCandidate.distanceInMeters - secondCandidate.distanceInMeters)
    .at(0);

  if (!nearestCandidate) {
    return null;
  }

  return nearestCandidate.candidatePoint;
};

export const findBoundarySnapPoint = (
  cursorPoint: PlanPoint,
  boundaryOutlines: PlanPoint[][],
  toleranceInMeters: number,
): PlanPoint | null => {
  const boundaryVertices = boundaryOutlines.flat();
  const nearestVertex = findNearestPointWithinTolerance(cursorPoint, boundaryVertices, toleranceInMeters);

  if (nearestVertex) {
    return nearestVertex;
  }

  const projectionsOnEdges = boundaryOutlines
    .flatMap(listPolygonEdges)
    .map((edge) => closestPointOnSegment(cursorPoint, edge));

  return findNearestPointWithinTolerance(cursorPoint, projectionsOnEdges, toleranceInMeters);
};
