import type { PlanPoint } from '../domain/points';
import { insertPointIntoPolygonBoundary } from './polygonQueries';
import { splitPolygonByPolyline, type PolygonSplitResult } from './polygonSplitting';

type SplittablePlane = {
  id: string;
  outline: PlanPoint[];
};

type PlaneSplitCandidate<Plane extends SplittablePlane> = {
  parentPlane: Plane;
  splitResult: PolygonSplitResult;
};

export const insertPointsIntoRoofPlanes = <Plane extends SplittablePlane>(planes: Plane[], points: PlanPoint[]): Plane[] =>
  planes.map((plane) => ({
    ...plane,
    outline: points.reduce(insertPointIntoPolygonBoundary, plane.outline),
  }));

const findSplittablePlane = <Plane extends SplittablePlane>(
  planes: Plane[],
  divisionPolyline: PlanPoint[],
): PlaneSplitCandidate<Plane> | null => {
  for (const plane of planes) {
    const splitResult = splitPolygonByPolyline(plane.outline, divisionPolyline);

    if (splitResult) {
      return { parentPlane: plane, splitResult };
    }
  }

  return null;
};

export const splitRoofPlanes = <Plane extends SplittablePlane>(
  planes: Plane[],
  divisionPolyline: PlanPoint[],
  createChildPlane: (parentPlane: Plane, childOutline: PlanPoint[]) => Plane,
): Plane[] | null => {
  const polylineStart = divisionPolyline[0];
  const polylineEnd = divisionPolyline.at(-1);

  if (!polylineStart || !polylineEnd) {
    return null;
  }

  const planesWithDivisionEndpoints = insertPointsIntoRoofPlanes(planes, [polylineStart, polylineEnd]);
  const splitCandidate = findSplittablePlane(planesWithDivisionEndpoints, divisionPolyline);

  if (!splitCandidate) {
    return null;
  }

  const { parentPlane, splitResult } = splitCandidate;
  const childPlanes = splitResult.map((childOutline) => createChildPlane(parentPlane, childOutline));

  return planesWithDivisionEndpoints.flatMap((plane) => (plane.id === parentPlane.id ? childPlanes : [plane]));
};
