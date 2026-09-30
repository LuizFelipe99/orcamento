import type { PlanPoint, PlanSegment } from '../domain/points';
import { BOUNDARY_TOLERANCE_IN_METERS, removeFloatingNoise } from './numericPrecision';
import { doubledSignedPolygonArea, listPolygonEdges } from './planMeasurements';
import { findVertexIndex } from './polygonQueries';
import { isPointOnSegment, isSegmentContainedIn } from './segmentGeometry';
import { crossProduct, dotProduct, negateVector, normalizeVector, subtractPoints, translatePoint } from './vectorMath';

const PARALLEL_LINES_TOLERANCE = 1e-12;

const cleanPoint = (point: PlanPoint): PlanPoint => ({
  x: removeFloatingNoise(point.x),
  y: removeFloatingNoise(point.y),
});

const outwardUnitNormal = (edge: PlanSegment, polygonOrientation: number): PlanPoint => {
  const edgeDirection = normalizeVector(subtractPoints(edge.end, edge.start));
  const leftNormal = { x: -edgeDirection.y, y: edgeDirection.x };

  return polygonOrientation > 0 ? negateVector(leftNormal) : leftNormal;
};

const offsetSegment = (edge: PlanSegment, outwardNormal: PlanPoint, distanceInMeters: number): PlanSegment => ({
  start: translatePoint(edge.start, outwardNormal, distanceInMeters),
  end: translatePoint(edge.end, outwardNormal, distanceInMeters),
});

export const intersectLines = (firstLine: PlanSegment, secondLine: PlanSegment): PlanPoint | null => {
  const firstDirection = subtractPoints(firstLine.end, firstLine.start);
  const secondDirection = subtractPoints(secondLine.end, secondLine.start);
  const directionsCross = crossProduct(firstDirection, secondDirection);

  if (Math.abs(directionsCross) < PARALLEL_LINES_TOLERANCE) {
    return null;
  }

  const firstLineParameter =
    crossProduct(subtractPoints(secondLine.start, firstLine.start), secondDirection) / directionsCross;

  return translatePoint(firstLine.start, firstDirection, firstLineParameter);
};

export const projectPointOntoLine = (point: PlanPoint, line: PlanSegment): PlanPoint => {
  const lineDirection = normalizeVector(subtractPoints(line.end, line.start));
  const distanceAlongLine = dotProduct(subtractPoints(point, line.start), lineDirection);

  return translatePoint(line.start, lineDirection, distanceAlongLine);
};

export const offsetPolygonOutline = (outline: PlanPoint[], distanceInMeters: number): PlanPoint[] => {
  if (distanceInMeters <= 0) {
    return outline;
  }

  const polygonOrientation = Math.sign(doubledSignedPolygonArea(outline));
  const offsetEdges = listPolygonEdges(outline).map((edge) =>
    offsetSegment(edge, outwardUnitNormal(edge, polygonOrientation), distanceInMeters),
  );

  return outline.map((_, vertexIndex) => {
    const incomingOffsetEdge = offsetEdges[(vertexIndex - 1 + outline.length) % outline.length];
    const outgoingOffsetEdge = offsetEdges[vertexIndex];

    return cleanPoint(intersectLines(incomingOffsetEdge, outgoingOffsetEdge) ?? outgoingOffsetEdge.start);
  });
};

type FootprintContext = {
  baseEdges: PlanSegment[];
  offsetBaseOutline: PlanPoint[];
  offsetBaseEdges: PlanSegment[];
  baseOutline: PlanPoint[];
};

const findDivisionEdgeLeavingBase = (
  vertexIndex: number,
  planeOutline: PlanPoint[],
  baseEdge: PlanSegment,
): PlanSegment | null => {
  const vertex = planeOutline[vertexIndex];
  const previousVertex = planeOutline[(vertexIndex - 1 + planeOutline.length) % planeOutline.length];
  const nextVertex = planeOutline[(vertexIndex + 1) % planeOutline.length];
  const adjacentEdges = [
    { start: previousVertex, end: vertex },
    { start: vertex, end: nextVertex },
  ];

  return adjacentEdges.find((edge) => !isSegmentContainedIn(edge, baseEdge, BOUNDARY_TOLERANCE_IN_METERS)) ?? null;
};

const relocateFootprintVertex = (vertexIndex: number, planeOutline: PlanPoint[], context: FootprintContext): PlanPoint => {
  const vertex = planeOutline[vertexIndex];
  const baseCornerIndex = findVertexIndex(context.baseOutline, vertex);

  if (baseCornerIndex !== -1) {
    return context.offsetBaseOutline[baseCornerIndex];
  }

  const baseEdgeIndex = context.baseEdges.findIndex((baseEdge) =>
    isPointOnSegment(vertex, baseEdge, BOUNDARY_TOLERANCE_IN_METERS),
  );

  if (baseEdgeIndex === -1) {
    return vertex;
  }

  const offsetBaseEdge = context.offsetBaseEdges[baseEdgeIndex];
  const divisionEdge = findDivisionEdgeLeavingBase(vertexIndex, planeOutline, context.baseEdges[baseEdgeIndex]);
  const relocatedVertex = divisionEdge ? intersectLines(divisionEdge, offsetBaseEdge) : null;

  return cleanPoint(relocatedVertex ?? projectPointOntoLine(vertex, offsetBaseEdge));
};

export const computeRoofPlaneFootprint = (
  planeOutline: PlanPoint[],
  baseOutline: PlanPoint[] | null,
  eaveOverhangInMeters: number,
): PlanPoint[] => {
  if (!baseOutline || eaveOverhangInMeters <= 0) {
    return planeOutline;
  }

  const offsetBaseOutline = offsetPolygonOutline(baseOutline, eaveOverhangInMeters);
  const context: FootprintContext = {
    baseOutline,
    baseEdges: listPolygonEdges(baseOutline),
    offsetBaseOutline,
    offsetBaseEdges: listPolygonEdges(offsetBaseOutline),
  };

  return planeOutline.map((_, vertexIndex) => relocateFootprintVertex(vertexIndex, planeOutline, context));
};

type PlaneWithOutline = {
  id: string;
  outline: PlanPoint[];
};

export const computeRoofFootprints = (
  roofPlanes: PlaneWithOutline[],
  baseOutline: PlanPoint[] | null,
  eaveOverhangInMeters: number,
): Map<string, PlanPoint[]> =>
  new Map(
    roofPlanes.map((roofPlane) => [
      roofPlane.id,
      computeRoofPlaneFootprint(roofPlane.outline, baseOutline, eaveOverhangInMeters),
    ]),
  );
