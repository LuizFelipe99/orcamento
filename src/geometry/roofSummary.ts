import type { PlanPoint } from '../domain/points';
import { isConfiguredRoofPlane, type RoofPlane } from '../domain/roofPlane';
import { polygonArea } from './planMeasurements';
import { realSurfaceArea } from './roofPlaneGeometry';

export type RoofSummary = {
  planAreaInSquareMeters: number;
  realAreaInSquareMeters: number;
  configuredPlaneCount: number;
  pendingPlaneCount: number;
};

export const summarizeRoof = (roofPlanes: RoofPlane[], footprintsByPlaneId: Map<string, PlanPoint[]>): RoofSummary => {
  const resolveFootprint = (roofPlane: RoofPlane): PlanPoint[] => footprintsByPlaneId.get(roofPlane.id) ?? roofPlane.outline;
  const configuredPlanes = roofPlanes.filter(isConfiguredRoofPlane);

  return {
    planAreaInSquareMeters: roofPlanes.reduce(
      (totalArea, roofPlane) => totalArea + polygonArea(resolveFootprint(roofPlane)),
      0,
    ),
    realAreaInSquareMeters: configuredPlanes.reduce(
      (totalArea, roofPlane) => totalArea + realSurfaceArea(resolveFootprint(roofPlane), roofPlane.slopePercent),
      0,
    ),
    configuredPlaneCount: configuredPlanes.length,
    pendingPlaneCount: roofPlanes.length - configuredPlanes.length,
  };
};
