import type { PlanPoint, PlanSegment } from '../domain/points';
import { isConfiguredRoofPlane, type ConfiguredRoofPlane, type RoofPlane } from '../domain/roofPlane';
import { HEIGHT_TOLERANCE_IN_METERS } from './numericPrecision';
import { heightAtPoint } from './roofPlaneGeometry';
import { classifySharedLine, findSharedEdges, listPairs, type SharedLineKind } from './roofTopology';

export type SharedEdgeHeightMismatch = {
  kind: 'sharedEdgeHeightMismatch';
  sharedEdge: PlanSegment;
  lineKind: SharedLineKind;
  planeIds: [string, string];
  heightsAtWorstPointInMeters: [number, number];
  heightDifferenceInMeters: number;
};

export type PointBelowEave = {
  kind: 'pointBelowEave';
  planeId: string;
};

export type RoofValidationIssue = SharedEdgeHeightMismatch | PointBelowEave;

type EdgeHeightComparison = {
  heightsInMeters: [number, number];
  heightDifferenceInMeters: number;
};

const compareHeightsAt = (
  edgePoint: PlanPoint,
  firstPlane: ConfiguredRoofPlane,
  secondPlane: ConfiguredRoofPlane,
): EdgeHeightComparison => {
  const firstHeight = heightAtPoint(firstPlane, edgePoint);
  const secondHeight = heightAtPoint(secondPlane, edgePoint);

  return {
    heightsInMeters: [firstHeight, secondHeight],
    heightDifferenceInMeters: Math.abs(firstHeight - secondHeight),
  };
};

const findWorstHeightComparison = (
  sharedEdge: PlanSegment,
  firstPlane: ConfiguredRoofPlane,
  secondPlane: ConfiguredRoofPlane,
): EdgeHeightComparison => {
  const [startComparison, endComparison] = [sharedEdge.start, sharedEdge.end].map((edgePoint) =>
    compareHeightsAt(edgePoint, firstPlane, secondPlane),
  );

  return startComparison.heightDifferenceInMeters >= endComparison.heightDifferenceInMeters
    ? startComparison
    : endComparison;
};

const findSharedEdgeMismatches = (
  configuredPlanes: ConfiguredRoofPlane[],
  baseOutline: PlanPoint[] | null,
): SharedEdgeHeightMismatch[] =>
  listPairs(configuredPlanes).flatMap(([firstPlane, secondPlane]) =>
    findSharedEdges(firstPlane, secondPlane)
      .map((sharedEdge) => ({ sharedEdge, comparison: findWorstHeightComparison(sharedEdge, firstPlane, secondPlane) }))
      .filter(({ comparison }) => comparison.heightDifferenceInMeters > HEIGHT_TOLERANCE_IN_METERS)
      .map(({ sharedEdge, comparison }) => ({
        kind: 'sharedEdgeHeightMismatch' as const,
        sharedEdge,
        lineKind: classifySharedLine(sharedEdge, firstPlane, secondPlane, baseOutline),
        planeIds: [firstPlane.id, secondPlane.id] as [string, string],
        heightsAtWorstPointInMeters: comparison.heightsInMeters,
        heightDifferenceInMeters: comparison.heightDifferenceInMeters,
      })),
  );

const findPlanesWithPointsBelowEave = (configuredPlanes: ConfiguredRoofPlane[]): PointBelowEave[] =>
  configuredPlanes
    .filter((roofPlane) =>
      roofPlane.outline.some((vertex) => heightAtPoint(roofPlane, vertex) < -HEIGHT_TOLERANCE_IN_METERS),
    )
    .map((roofPlane) => ({ kind: 'pointBelowEave' as const, planeId: roofPlane.id }));

export const validateRoofPlanes = (roofPlanes: RoofPlane[], baseOutline: PlanPoint[] | null): RoofValidationIssue[] => {
  const configuredPlanes = roofPlanes.filter(isConfiguredRoofPlane);

  return [
    ...findPlanesWithPointsBelowEave(configuredPlanes),
    ...findSharedEdgeMismatches(configuredPlanes, baseOutline),
  ];
};
