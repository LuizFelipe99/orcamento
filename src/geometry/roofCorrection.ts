import type { PlanPoint, PlanSegment } from '../domain/points';
import { isConfiguredRoofPlane, type ConfiguredRoofPlane, type RoofPlane } from '../domain/roofPlane';
import { solveLeastSquares } from './linearAlgebra';
import { BOUNDARY_TOLERANCE_IN_METERS, COINCIDENT_POINT_TOLERANCE_IN_METERS, removeFloatingNoise } from './numericPrecision';
import { arePointsCoincident, distanceBetween, listPolygonEdges, polygonArea } from './planMeasurements';
import { findVertexIndex } from './polygonQueries';
import { interiorUnitNormal, slopeRatio } from './roofPlaneGeometry';
import { doSegmentsProperlyIntersect, isPointOnSegment } from './segmentGeometry';
import { dotProduct, normalizeVector, scaleVector, subtractPoints, translatePoint } from './vectorMath';

const MINIMUM_PLANE_AREA_IN_SQUARE_METERS = 0.01;
const RELATIVE_AREA_TOLERANCE = 1e-4;
const DEGENERATE_COEFFICIENT_TOLERANCE = 1e-9;

export type VertexMove = {
  from: PlanPoint;
  to: PlanPoint;
};

type HeightEquation = {
  weightedNormal: PlanPoint;
  constant: number;
};

type PlaneWithEave = {
  outline: PlanPoint[];
  eave: PlanSegment | null;
};

const cleanPoint = (point: PlanPoint): PlanPoint => ({
  x: removeFloatingNoise(point.x),
  y: removeFloatingNoise(point.y),
});

const buildHeightEquation = (roofPlane: ConfiguredRoofPlane): HeightEquation => {
  const weightedNormal = scaleVector(interiorUnitNormal(roofPlane.outline, roofPlane.eave), slopeRatio(roofPlane.slopePercent));

  return { weightedNormal, constant: dotProduct(weightedNormal, roofPlane.eave.start) };
};

const listUniqueVertices = (roofPlanes: RoofPlane[]): PlanPoint[] =>
  roofPlanes
    .flatMap((roofPlane) => roofPlane.outline)
    .reduce<PlanPoint[]>(
      (uniqueVertices, vertex) =>
        uniqueVertices.some((uniqueVertex) => arePointsCoincident(uniqueVertex, vertex))
          ? uniqueVertices
          : [...uniqueVertices, vertex],
      [],
    );

const solveInteriorVertex = (currentPosition: PlanPoint, equations: HeightEquation[]): PlanPoint | null => {
  if (equations.length === 2) {
    const [firstEquation, secondEquation] = equations;
    const lineNormal = subtractPoints(firstEquation.weightedNormal, secondEquation.weightedNormal);
    const lineConstant = firstEquation.constant - secondEquation.constant;
    const normalSquaredLength = dotProduct(lineNormal, lineNormal);

    if (normalSquaredLength < DEGENERATE_COEFFICIENT_TOLERANCE) {
      return null;
    }

    const signedExcess = (dotProduct(lineNormal, currentPosition) - lineConstant) / normalSquaredLength;
    return subtractPoints(currentPosition, scaleVector(lineNormal, signedExcess));
  }

  const solution = solveLeastSquares(
    equations.map(({ weightedNormal }) => [weightedNormal.x, weightedNormal.y, -1]),
    equations.map(({ constant }) => constant),
  );

  if (!solution) {
    return null;
  }

  return { x: solution[0], y: solution[1] };
};

const solveWallVertex = (wallEdge: PlanSegment, equations: HeightEquation[]): PlanPoint | null => {
  const wallDirection = normalizeVector(subtractPoints(wallEdge.end, wallEdge.start));
  const solution = solveLeastSquares(
    equations.map(({ weightedNormal }) => [dotProduct(weightedNormal, wallDirection), -1]),
    equations.map(({ weightedNormal, constant }) => constant - dotProduct(weightedNormal, wallEdge.start)),
  );

  if (!solution) {
    return null;
  }

  return translatePoint(wallEdge.start, wallDirection, solution[0]);
};

const solveVertexPosition = (
  vertex: PlanPoint,
  roofPlanes: RoofPlane[],
  baseOutline: PlanPoint[],
): PlanPoint | null => {
  if (findVertexIndex(baseOutline, vertex) !== -1) {
    return null;
  }

  const containingPlanes = roofPlanes.filter((roofPlane) => findVertexIndex(roofPlane.outline, vertex) !== -1);
  const configuredPlanes = containingPlanes.filter(isConfiguredRoofPlane);

  if (containingPlanes.length < 2 || configuredPlanes.length !== containingPlanes.length) {
    return null;
  }

  const equations = configuredPlanes.map(buildHeightEquation);
  const wallEdge = listPolygonEdges(baseOutline).find((baseEdge) =>
    isPointOnSegment(vertex, baseEdge, BOUNDARY_TOLERANCE_IN_METERS),
  );

  return wallEdge ? solveWallVertex(wallEdge, equations) : solveInteriorVertex(vertex, equations);
};

export const planRoofCorrection = (roofPlanes: RoofPlane[], baseOutline: PlanPoint[]): VertexMove[] =>
  listUniqueVertices(roofPlanes).flatMap((vertex) => {
    const solvedPosition = solveVertexPosition(vertex, roofPlanes, baseOutline);

    if (!solvedPosition || distanceBetween(vertex, solvedPosition) <= COINCIDENT_POINT_TOLERANCE_IN_METERS) {
      return [];
    }

    return [{ from: vertex, to: cleanPoint(solvedPosition) }];
  });

const movePoint = (point: PlanPoint, vertexMoves: VertexMove[]): PlanPoint =>
  vertexMoves.find(({ from }) => arePointsCoincident(from, point))?.to ?? point;

const removeRepeatedVertices = (outline: PlanPoint[]): PlanPoint[] => {
  if (outline.length < 2) {
    return outline;
  }

  return outline.filter((vertex, vertexIndex) => !arePointsCoincident(vertex, outline[(vertexIndex + 1) % outline.length]));
};

export const applyVertexMoves = <Plane extends PlaneWithEave>(planes: Plane[], vertexMoves: VertexMove[]): Plane[] =>
  planes
    .map((plane) => ({
      ...plane,
      outline: removeRepeatedVertices(plane.outline.map((vertex) => movePoint(vertex, vertexMoves))),
      eave: plane.eave
        ? { start: movePoint(plane.eave.start, vertexMoves), end: movePoint(plane.eave.end, vertexMoves) }
        : null,
    }))
    .filter((plane) => polygonArea(plane.outline) >= MINIMUM_PLANE_AREA_IN_SQUARE_METERS);

const isSimplePolygon = (outline: PlanPoint[]): boolean => {
  const edges = listPolygonEdges(outline);

  return edges.every((edge, edgeIndex) =>
    edges.every(
      (otherEdge, otherEdgeIndex) => otherEdgeIndex <= edgeIndex || !doSegmentsProperlyIntersect(edge, otherEdge),
    ),
  );
};

export const isValidRoofPartition = (planes: PlaneWithEave[], baseOutline: PlanPoint[]): boolean => {
  const baseArea = polygonArea(baseOutline);
  const partitionedArea = planes.reduce((totalArea, plane) => totalArea + polygonArea(plane.outline), 0);
  const coversBaseExactly = Math.abs(partitionedArea - baseArea) <= baseArea * RELATIVE_AREA_TOLERANCE;

  return coversBaseExactly && planes.every((plane) => isSimplePolygon(plane.outline));
};
