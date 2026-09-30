import type { RoofPlane } from '../../domain/roofPlane';
import { useResolvedRoofPlanes } from '../hooks/useRoofMaterials';

const ROOF_PLANE_COLORS = ['#e9b98a', '#a9cf9a', '#9dc0e4', '#dca8c8', '#e3d07a', '#b8aee3', '#8fd1c7', '#e6a39a'];

export type RoofPlanePresentation = {
  roofPlane: RoofPlane;
  label: string;
  color: string;
};

type IdentifiedPlane = {
  id: string;
};

export const presentRoofPlanes = (roofPlanes: RoofPlane[]): RoofPlanePresentation[] =>
  roofPlanes.map((roofPlane, planeIndex) => ({
    roofPlane,
    label: `Água ${planeIndex + 1}`,
    color: ROOF_PLANE_COLORS[planeIndex % ROOF_PLANE_COLORS.length],
  }));

export const buildPlaneLabelsById = (planes: IdentifiedPlane[]): Map<string, string> =>
  new Map(planes.map((plane, planeIndex) => [plane.id, `Água ${planeIndex + 1}`]));

export const useRoofPlanePresentations = (): RoofPlanePresentation[] => presentRoofPlanes(useResolvedRoofPlanes());
