import type { PlanPoint, PlanSegment } from '../domain/points';
import { COINCIDENT_POINT_TOLERANCE_IN_METERS } from './numericPrecision';

const MINIMUM_POLYGON_VERTICES = 3;
const DEGENERATE_AREA_TOLERANCE = 1e-12;

export const distanceBetween = (firstPoint: PlanPoint, secondPoint: PlanPoint): number =>
  Math.hypot(secondPoint.x - firstPoint.x, secondPoint.y - firstPoint.y);

export const arePointsCoincident = (firstPoint: PlanPoint, secondPoint: PlanPoint): boolean =>
  distanceBetween(firstPoint, secondPoint) <= COINCIDENT_POINT_TOLERANCE_IN_METERS;

export const midpointBetween = (firstPoint: PlanPoint, secondPoint: PlanPoint): PlanPoint => ({
  x: (firstPoint.x + secondPoint.x) / 2,
  y: (firstPoint.y + secondPoint.y) / 2,
});

export const listSegments = (vertices: PlanPoint[], isClosed: boolean): PlanSegment[] => {
  const openSegments = vertices.slice(1).map((segmentEnd, index) => ({
    start: vertices[index],
    end: segmentEnd,
  }));

  if (!isClosed || vertices.length < MINIMUM_POLYGON_VERTICES) {
    return openSegments;
  }

  return [...openSegments, { start: vertices[vertices.length - 1], end: vertices[0] }];
};

export const listPolygonEdges = (outline: PlanPoint[]): PlanSegment[] => listSegments(outline, true);

export const segmentLength = (segment: PlanSegment): number => distanceBetween(segment.start, segment.end);

export const doubledSignedPolygonArea = (vertices: PlanPoint[]): number =>
  vertices.reduce((accumulatedArea, currentVertex, vertexIndex) => {
    const nextVertex = vertices[(vertexIndex + 1) % vertices.length];
    return accumulatedArea + currentVertex.x * nextVertex.y - nextVertex.x * currentVertex.y;
  }, 0);

export const polygonArea = (vertices: PlanPoint[]): number => {
  if (vertices.length < MINIMUM_POLYGON_VERTICES) {
    return 0;
  }

  return Math.abs(doubledSignedPolygonArea(vertices)) / 2;
};

const averagePoint = (vertices: PlanPoint[]): PlanPoint => {
  if (vertices.length === 0) {
    return { x: 0, y: 0 };
  }

  const coordinateSums = vertices.reduce(
    (accumulatedSums, vertex) => ({ x: accumulatedSums.x + vertex.x, y: accumulatedSums.y + vertex.y }),
    { x: 0, y: 0 },
  );

  return { x: coordinateSums.x / vertices.length, y: coordinateSums.y / vertices.length };
};

export const polygonCentroid = (vertices: PlanPoint[]): PlanPoint => {
  const doubledSignedArea = doubledSignedPolygonArea(vertices);

  if (vertices.length < MINIMUM_POLYGON_VERTICES || Math.abs(doubledSignedArea) < DEGENERATE_AREA_TOLERANCE) {
    return averagePoint(vertices);
  }

  const weightedCoordinates = vertices.reduce(
    (accumulatedCoordinates, currentVertex, vertexIndex) => {
      const nextVertex = vertices[(vertexIndex + 1) % vertices.length];
      const crossTerm = currentVertex.x * nextVertex.y - nextVertex.x * currentVertex.y;

      return {
        x: accumulatedCoordinates.x + (currentVertex.x + nextVertex.x) * crossTerm,
        y: accumulatedCoordinates.y + (currentVertex.y + nextVertex.y) * crossTerm,
      };
    },
    { x: 0, y: 0 },
  );

  return {
    x: weightedCoordinates.x / (3 * doubledSignedArea),
    y: weightedCoordinates.y / (3 * doubledSignedArea),
  };
};
