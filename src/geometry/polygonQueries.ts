import type { PlanPoint, PlanSegment } from '../domain/points';
import { BOUNDARY_TOLERANCE_IN_METERS } from './numericPrecision';
import { arePointsCoincident, listPolygonEdges } from './planMeasurements';
import { distanceToSegment, isPointOnSegment } from './segmentGeometry';

export const isPointInsidePolygon = (point: PlanPoint, outline: PlanPoint[]): boolean =>
  listPolygonEdges(outline).reduce((isInside, edge) => {
    const crossesHorizontalRay = edge.start.y > point.y !== edge.end.y > point.y;

    if (!crossesHorizontalRay) {
      return isInside;
    }

    const intersectionX =
      edge.start.x + ((point.y - edge.start.y) / (edge.end.y - edge.start.y)) * (edge.end.x - edge.start.x);

    return point.x < intersectionX ? !isInside : isInside;
  }, false);

export const distanceToPolygonBoundary = (point: PlanPoint, outline: PlanPoint[]): number =>
  Math.min(...listPolygonEdges(outline).map((edge) => distanceToSegment(point, edge)));

export const isPointOnPolygonBoundary = (point: PlanPoint, outline: PlanPoint[], toleranceInMeters: number): boolean =>
  distanceToPolygonBoundary(point, outline) <= toleranceInMeters;

export const isPointStrictlyInsidePolygon = (point: PlanPoint, outline: PlanPoint[]): boolean => {
  if (!isPointInsidePolygon(point, outline)) {
    return false;
  }

  return distanceToPolygonBoundary(point, outline) > BOUNDARY_TOLERANCE_IN_METERS;
};

export const findVertexIndex = (outline: PlanPoint[], point: PlanPoint): number =>
  outline.findIndex((vertex) => arePointsCoincident(vertex, point));

export const insertPointIntoPolygonBoundary = (outline: PlanPoint[], point: PlanPoint): PlanPoint[] => {
  if (findVertexIndex(outline, point) !== -1) {
    return outline;
  }

  const containingEdgeIndex = listPolygonEdges(outline).findIndex((edge) =>
    isPointOnSegment(point, edge, BOUNDARY_TOLERANCE_IN_METERS),
  );

  if (containingEdgeIndex === -1) {
    return outline;
  }

  return [...outline.slice(0, containingEdgeIndex + 1), point, ...outline.slice(containingEdgeIndex + 1)];
};

export const findNearestEdge = (
  outline: PlanPoint[],
  point: PlanPoint,
  toleranceInMeters: number,
): PlanSegment | null => {
  const edgesWithinTolerance = listPolygonEdges(outline)
    .map((edge) => ({ edge, distanceInMeters: distanceToSegment(point, edge) }))
    .filter(({ distanceInMeters }) => distanceInMeters <= toleranceInMeters)
    .sort((firstCandidate, secondCandidate) => firstCandidate.distanceInMeters - secondCandidate.distanceInMeters);

  const [nearestCandidate] = edgesWithinTolerance;

  if (!nearestCandidate) {
    return null;
  }

  return nearestCandidate.edge;
};
