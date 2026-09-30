import type { PlanPoint, PlanSegment } from '../domain/points';
import { isConfiguredRoofPlane, type RoofPlane } from '../domain/roofPlane';
import { segmentLength } from './planMeasurements';
import { heightAtPoint } from './roofPlaneGeometry';
import { classifySharedLine, findSharedOutlineEdges, listPairs, type SharedLineKind } from './roofTopology';

export type RoofLine = {
  kind: SharedLineKind;
  segment: PlanSegment;
  planLengthInMeters: number;
  realLengthInMeters: number;
};

export type RoofLineTotals = Record<SharedLineKind, number>;

export const listRoofLines = (
  roofPlanes: RoofPlane[],
  footprintsByPlaneId: Map<string, PlanPoint[]>,
  roofOutline: PlanPoint[] | null,
): RoofLine[] => {
  const configuredPlanes = roofPlanes.filter(isConfiguredRoofPlane);
  const resolveFootprint = (roofPlane: RoofPlane): PlanPoint[] => footprintsByPlaneId.get(roofPlane.id) ?? roofPlane.outline;

  return listPairs(configuredPlanes).flatMap(([firstPlane, secondPlane]) =>
    findSharedOutlineEdges(resolveFootprint(firstPlane), resolveFootprint(secondPlane)).map((sharedSegment) => {
      const planLengthInMeters = segmentLength(sharedSegment);
      const heightDifference = heightAtPoint(firstPlane, sharedSegment.end) - heightAtPoint(firstPlane, sharedSegment.start);

      return {
        kind: classifySharedLine(sharedSegment, firstPlane, secondPlane, roofOutline),
        segment: sharedSegment,
        planLengthInMeters,
        realLengthInMeters: Math.hypot(planLengthInMeters, heightDifference),
      };
    }),
  );
};

export const totalRoofLineLengths = (roofLines: RoofLine[]): RoofLineTotals =>
  roofLines.reduce<RoofLineTotals>(
    (lengthTotals, roofLine) => ({
      ...lengthTotals,
      [roofLine.kind]: lengthTotals[roofLine.kind] + roofLine.realLengthInMeters,
    }),
    { ridge: 0, hip: 0, valley: 0, junction: 0 },
  );
