import type { PlanPoint, PlanSegment } from '../domain/points';
import { isConfiguredRoofPlane, type ConfiguredRoofPlane, type RoofPlane } from '../domain/roofPlane';
import {
  layoutParallelSegments,
  listEvenlySpacedOffsets,
  measureOffsetRange,
  resolvePlaneAxes,
} from './parallelMemberLayout';
import { slopeLengthFactor } from './roofPlaneGeometry';

const MINIMUM_BATTEN_LENGTH_IN_METERS = 0.1;

export type Batten = {
  segment: PlanSegment;
  lengthInMeters: number;
};

export type BattenSummary = {
  battenRowCount: number;
  totalLengthInMeters: number;
};

export const planSpacingFromGauge = (battenGaugeInMeters: number, slopePercent: number): number =>
  battenGaugeInMeters / slopeLengthFactor(slopePercent);

export const layoutPlaneBattens = (
  roofPlane: ConfiguredRoofPlane,
  footprint: PlanPoint[],
  battenGaugeInMeters: number,
): Batten[] => {
  if (battenGaugeInMeters <= 0 || footprint.length < 3) {
    return [];
  }

  const { alongEave, upSlope } = resolvePlaneAxes(roofPlane);
  const scanDirection = { spacingAxis: upSlope, memberAxis: alongEave };
  const { minimumOffset, maximumOffset } = measureOffsetRange(footprint, upSlope);
  const battenOffsets = listEvenlySpacedOffsets(
    minimumOffset,
    maximumOffset,
    planSpacingFromGauge(battenGaugeInMeters, roofPlane.slopePercent),
  );

  return layoutParallelSegments(footprint, scanDirection, battenOffsets, MINIMUM_BATTEN_LENGTH_IN_METERS).map(
    ({ segment, planLengthInMeters }) => ({ segment, lengthInMeters: planLengthInMeters }),
  );
};

export const layoutRoofBattens = (
  roofPlanes: RoofPlane[],
  footprintsByPlaneId: Map<string, PlanPoint[]>,
  battenGaugeInMeters: number,
): Map<string, Batten[]> =>
  new Map(
    roofPlanes.filter(isConfiguredRoofPlane).map((roofPlane) => [
      roofPlane.id,
      layoutPlaneBattens(roofPlane, footprintsByPlaneId.get(roofPlane.id) ?? roofPlane.outline, battenGaugeInMeters),
    ]),
  );

export const summarizeBattens = (battens: Batten[]): BattenSummary => ({
  battenRowCount: battens.length,
  totalLengthInMeters: battens.reduce((totalLength, batten) => totalLength + batten.lengthInMeters, 0),
});
