import type { PlanPoint, PlanSegment } from '../domain/points';
import { BOUNDARY_TOLERANCE_IN_METERS } from './numericPrecision';
import { listPolygonEdges, listSegments, midpointBetween, polygonArea } from './planMeasurements';
import { findVertexIndex, isPointStrictlyInsidePolygon } from './polygonQueries';
import { doSegmentsProperlyIntersect, isPointInsideSegmentInterior } from './segmentGeometry';

const MINIMUM_SPLIT_PART_AREA_IN_SQUARE_METERS = 0.01;

export type PolygonSplitResult = [PlanPoint[], PlanPoint[]];

const collectRingVertices = (ring: PlanPoint[], fromIndex: number, toIndex: number): PlanPoint[] => {
  const stepCount = (toIndex - fromIndex + ring.length) % ring.length;

  return Array.from({ length: stepCount + 1 }, (_, offset) => ring[(fromIndex + offset) % ring.length]);
};

const isSegmentInsidePolygon = (segment: PlanSegment, outline: PlanPoint[]): boolean => {
  const segmentMidpoint = midpointBetween(segment.start, segment.end);

  if (!isPointStrictlyInsidePolygon(segmentMidpoint, outline)) {
    return false;
  }

  const crossesAnyEdge = listPolygonEdges(outline).some((edge) => doSegmentsProperlyIntersect(segment, edge));

  if (crossesAnyEdge) {
    return false;
  }

  return !outline.some((vertex) => isPointInsideSegmentInterior(vertex, segment, BOUNDARY_TOLERANCE_IN_METERS));
};

const isPolylineInsidePolygon = (polyline: PlanPoint[], outline: PlanPoint[]): boolean => {
  const interiorPoints = polyline.slice(1, -1);
  const areInteriorPointsInside = interiorPoints.every((point) => isPointStrictlyInsidePolygon(point, outline));

  if (!areInteriorPointsInside) {
    return false;
  }

  return listSegments(polyline, false).every((segment) => isSegmentInsidePolygon(segment, outline));
};

export const splitPolygonByPolyline = (
  outline: PlanPoint[],
  divisionPolyline: PlanPoint[],
): PolygonSplitResult | null => {
  const polylineStart = divisionPolyline[0];
  const polylineEnd = divisionPolyline.at(-1);

  if (!polylineStart || !polylineEnd || divisionPolyline.length < 2) {
    return null;
  }

  const startIndex = findVertexIndex(outline, polylineStart);
  const endIndex = findVertexIndex(outline, polylineEnd);

  if (startIndex === -1 || endIndex === -1 || startIndex === endIndex) {
    return null;
  }

  if (!isPolylineInsidePolygon(divisionPolyline, outline)) {
    return null;
  }

  const interiorPoints = divisionPolyline.slice(1, -1);
  const firstOutline = [...collectRingVertices(outline, startIndex, endIndex), ...[...interiorPoints].reverse()];
  const secondOutline = [...collectRingVertices(outline, endIndex, startIndex), ...interiorPoints];

  const hasDegeneratePart = [firstOutline, secondOutline].some(
    (partOutline) => polygonArea(partOutline) < MINIMUM_SPLIT_PART_AREA_IN_SQUARE_METERS,
  );

  if (hasDegeneratePart) {
    return null;
  }

  return [firstOutline, secondOutline];
};
