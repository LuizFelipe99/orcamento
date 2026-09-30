import type { PlanPoint, PlanSegment } from '../domain/points';
import type { RoofPlane } from '../domain/roofPlane';
import { doubledSignedPolygonArea, listPolygonEdges } from './planMeasurements';
import { findVertexIndex } from './polygonQueries';
import { areSegmentsCoincident } from './segmentGeometry';

const PARALLEL_TOLERANCE = 1e-6;

export type SharedLineKind = 'ridge' | 'hip' | 'valley' | 'junction';

export const listPairs = <Item>(items: Item[]): Array<[Item, Item]> =>
  items.flatMap((firstItem, firstIndex) =>
    items.slice(firstIndex + 1).map((secondItem): [Item, Item] => [firstItem, secondItem]),
  );

export const findSharedOutlineEdges = (firstOutline: PlanPoint[], secondOutline: PlanPoint[]): PlanSegment[] => {
  const secondOutlineEdges = listPolygonEdges(secondOutline);

  return listPolygonEdges(firstOutline).filter((edge) =>
    secondOutlineEdges.some((otherEdge) => areSegmentsCoincident(edge, otherEdge)),
  );
};

export const findSharedEdges = (firstPlane: RoofPlane, secondPlane: RoofPlane): PlanSegment[] =>
  findSharedOutlineEdges(firstPlane.outline, secondPlane.outline);

const areSegmentsParallel = (firstSegment: PlanSegment, secondSegment: PlanSegment): boolean => {
  const firstDeltaX = firstSegment.end.x - firstSegment.start.x;
  const firstDeltaY = firstSegment.end.y - firstSegment.start.y;
  const secondDeltaX = secondSegment.end.x - secondSegment.start.x;
  const secondDeltaY = secondSegment.end.y - secondSegment.start.y;
  const lengthsProduct = Math.hypot(firstDeltaX, firstDeltaY) * Math.hypot(secondDeltaX, secondDeltaY);

  if (lengthsProduct === 0) {
    return false;
  }

  return Math.abs(firstDeltaX * secondDeltaY - firstDeltaY * secondDeltaX) / lengthsProduct < PARALLEL_TOLERANCE;
};

const isConvexCorner = (outline: PlanPoint[], cornerIndex: number): boolean => {
  const previousVertex = outline[(cornerIndex - 1 + outline.length) % outline.length];
  const cornerVertex = outline[cornerIndex];
  const nextVertex = outline[(cornerIndex + 1) % outline.length];
  const turnDirection =
    (cornerVertex.x - previousVertex.x) * (nextVertex.y - cornerVertex.y) -
    (cornerVertex.y - previousVertex.y) * (nextVertex.x - cornerVertex.x);

  return Math.sign(turnDirection) === Math.sign(doubledSignedPolygonArea(outline));
};

const findBaseCornerIndex = (sharedEdge: PlanSegment, baseOutline: PlanPoint[]): number | null => {
  const cornerIndex = [sharedEdge.start, sharedEdge.end]
    .map((edgePoint) => findVertexIndex(baseOutline, edgePoint))
    .find((vertexIndex) => vertexIndex !== -1);

  return cornerIndex ?? null;
};

export const classifySharedLine = (
  sharedEdge: PlanSegment,
  firstPlane: RoofPlane,
  secondPlane: RoofPlane,
  baseOutline: PlanPoint[] | null,
): SharedLineKind => {
  const isParallelToBothEaves = [firstPlane.eave, secondPlane.eave].every(
    (eave) => eave !== null && areSegmentsParallel(sharedEdge, eave),
  );

  if (isParallelToBothEaves) {
    return 'ridge';
  }

  const baseCornerIndex = baseOutline ? findBaseCornerIndex(sharedEdge, baseOutline) : null;

  if (!baseOutline || baseCornerIndex === null) {
    return 'junction';
  }

  return isConvexCorner(baseOutline, baseCornerIndex) ? 'hip' : 'valley';
};
