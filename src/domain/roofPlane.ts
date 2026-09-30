import type { PlanPoint, PlanSegment } from './points';

export type RoofPlaneDefinition = {
  id: string;
  outline: PlanPoint[];
  eave: PlanSegment | null;
  slopeOverridePercent: number | null;
};

export type RoofPlane = {
  id: string;
  outline: PlanPoint[];
  eave: PlanSegment | null;
  slopePercent: number | null;
};

export type ConfiguredRoofPlane = RoofPlane & {
  eave: PlanSegment;
  slopePercent: number;
};

export const isConfiguredRoofPlane = (roofPlane: RoofPlane): roofPlane is ConfiguredRoofPlane =>
  roofPlane.eave !== null && roofPlane.slopePercent !== null;

export const createRoofPlaneDefinition = (
  outline: PlanPoint[],
  slopeOverridePercent: number | null = null,
): RoofPlaneDefinition => ({
  id: crypto.randomUUID(),
  outline,
  eave: null,
  slopeOverridePercent,
});

export const resolveRoofPlane = (definition: RoofPlaneDefinition, roofSlopePercent: number | null): RoofPlane => ({
  id: definition.id,
  outline: definition.outline,
  eave: definition.eave,
  slopePercent: definition.slopeOverridePercent ?? roofSlopePercent,
});

export const resolveRoofPlanes = (definitions: RoofPlaneDefinition[], roofSlopePercent: number | null): RoofPlane[] =>
  definitions.map((definition) => resolveRoofPlane(definition, roofSlopePercent));
