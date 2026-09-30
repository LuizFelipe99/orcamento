import type { PlanPoint, PlanSegment } from '../domain/points';
import { isConfiguredRoofPlane, type ConfiguredRoofPlane, type RoofPlane } from '../domain/roofPlane';
import { removeFloatingNoise } from './numericPrecision';
import {
  layoutParallelSegments,
  listEvenlySpacedOffsets,
  measureOffsetRange,
  resolvePlaneAxes,
} from './parallelMemberLayout';
import { slopeLengthFactor } from './roofPlaneGeometry';

const MINIMUM_RAFTER_PLAN_LENGTH_IN_METERS = 0.1;
const LENGTH_ROUNDING_TOLERANCE = 1e-9;

export const RAFTER_LENGTH_ROUNDING_STEP_IN_METERS = 0.1;

export type Rafter = {
  segment: PlanSegment;
  planLengthInMeters: number;
  realLengthInMeters: number;
};

export type RafterLengthGroup = {
  lengthInMeters: number;
  quantity: number;
};

export type RafterSummary = {
  lengthGroups: RafterLengthGroup[];
  rafterCount: number;
  totalRealLengthInMeters: number;
};

export const layoutPlaneRafters = (
  roofPlane: ConfiguredRoofPlane,
  footprint: PlanPoint[],
  rafterSpacingInMeters: number,
): Rafter[] => {
  if (rafterSpacingInMeters <= 0 || footprint.length < 3) {
    return [];
  }

  const { alongEave, upSlope } = resolvePlaneAxes(roofPlane);
  const scanDirection = { spacingAxis: alongEave, memberAxis: upSlope };
  const { minimumOffset, maximumOffset } = measureOffsetRange(footprint, alongEave);
  const rafterOffsets = listEvenlySpacedOffsets(minimumOffset, maximumOffset, rafterSpacingInMeters);
  const lengthFactor = slopeLengthFactor(roofPlane.slopePercent);

  return layoutParallelSegments(footprint, scanDirection, rafterOffsets, MINIMUM_RAFTER_PLAN_LENGTH_IN_METERS).map(
    ({ segment, planLengthInMeters }) => ({
      segment,
      planLengthInMeters,
      realLengthInMeters: planLengthInMeters * lengthFactor,
    }),
  );
};

export const layoutRoofRafters = (
  roofPlanes: RoofPlane[],
  footprintsByPlaneId: Map<string, PlanPoint[]>,
  rafterSpacingInMeters: number,
): Map<string, Rafter[]> =>
  new Map(
    roofPlanes.filter(isConfiguredRoofPlane).map((roofPlane) => [
      roofPlane.id,
      layoutPlaneRafters(roofPlane, footprintsByPlaneId.get(roofPlane.id) ?? roofPlane.outline, rafterSpacingInMeters),
    ]),
  );

export const roundUpRafterLength = (realLengthInMeters: number): number =>
  removeFloatingNoise(
    Math.ceil(realLengthInMeters / RAFTER_LENGTH_ROUNDING_STEP_IN_METERS - LENGTH_ROUNDING_TOLERANCE) *
      RAFTER_LENGTH_ROUNDING_STEP_IN_METERS,
  );

export const summarizeRafters = (rafters: Rafter[]): RafterSummary => {
  const quantitiesByLength = rafters.reduce((accumulatedQuantities, rafter) => {
    const roundedLength = roundUpRafterLength(rafter.realLengthInMeters);
    accumulatedQuantities.set(roundedLength, (accumulatedQuantities.get(roundedLength) ?? 0) + 1);
    return accumulatedQuantities;
  }, new Map<number, number>());

  return {
    lengthGroups: [...quantitiesByLength.entries()]
      .map(([lengthInMeters, quantity]) => ({ lengthInMeters, quantity }))
      .sort((firstGroup, secondGroup) => secondGroup.lengthInMeters - firstGroup.lengthInMeters),
    rafterCount: rafters.length,
    totalRealLengthInMeters: rafters.reduce((totalLength, rafter) => totalLength + rafter.realLengthInMeters, 0),
  };
};
