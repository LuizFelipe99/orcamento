import { create } from 'zustand';
import type { PlanPoint } from '../domain/points';
import { resolveRoofPlanes, type RoofPlane, type RoofPlaneDefinition } from '../domain/roofPlane';
import type { TileSpecification } from '../materials/tileEstimate';

export type RoofPlaneChanges = Partial<Pick<RoofPlaneDefinition, 'eave' | 'slopeOverridePercent'>>;

export type ProjectSettings = {
  roofSlopePercent: number;
  eaveOverhangInMeters: number;
  rafterSpacingInMeters: number;
  battenGaugeInMeters: number;
};

const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  roofSlopePercent: 30,
  eaveOverhangInMeters: 0.5,
  rafterSpacingInMeters: 0.5,
  battenGaugeInMeters: 0.36,
};

const EMPTY_TILE_SPECIFICATION: TileSpecification = {
  tilesPerSquareMeter: null,
  ridgeTilesPerLinearMeter: null,
  wastePercent: null,
};

type RoofProjectState = {
  baseOutline: PlanPoint[] | null;
  roofPlaneDefinitions: RoofPlaneDefinition[];
  roofPlanesHistory: RoofPlaneDefinition[][];
  selectedRoofPlaneId: string | null;
  projectSettings: ProjectSettings;
  tileSpecification: TileSpecification;
  defineBaseOutline: (baseOutline: PlanPoint[], initialDefinitions: RoofPlaneDefinition[]) => void;
  clearProject: () => void;
  replaceRoofPlaneDefinitions: (nextDefinitions: RoofPlaneDefinition[]) => void;
  undoLastRoofPlanesChange: () => void;
  selectRoofPlane: (roofPlaneId: string | null) => void;
  updateRoofPlane: (roofPlaneId: string, changes: RoofPlaneChanges) => void;
  updateProjectSettings: (changes: Partial<ProjectSettings>) => void;
  updateTileSpecification: (changes: Partial<TileSpecification>) => void;
};

export const useRoofProjectStore = create<RoofProjectState>()((set) => ({
  baseOutline: null,
  roofPlaneDefinitions: [],
  roofPlanesHistory: [],
  selectedRoofPlaneId: null,
  projectSettings: DEFAULT_PROJECT_SETTINGS,
  tileSpecification: EMPTY_TILE_SPECIFICATION,
  defineBaseOutline: (baseOutline, initialDefinitions) =>
    set({
      baseOutline,
      roofPlaneDefinitions: initialDefinitions,
      roofPlanesHistory: [],
      selectedRoofPlaneId: null,
    }),
  clearProject: () =>
    set({
      baseOutline: null,
      roofPlaneDefinitions: [],
      roofPlanesHistory: [],
      selectedRoofPlaneId: null,
    }),
  replaceRoofPlaneDefinitions: (nextDefinitions) =>
    set((state) => ({
      roofPlaneDefinitions: nextDefinitions,
      roofPlanesHistory: [...state.roofPlanesHistory, state.roofPlaneDefinitions],
      selectedRoofPlaneId: null,
    })),
  undoLastRoofPlanesChange: () =>
    set((state) => {
      const previousDefinitions = state.roofPlanesHistory.at(-1);

      if (!previousDefinitions) {
        return state;
      }

      return {
        roofPlaneDefinitions: previousDefinitions,
        roofPlanesHistory: state.roofPlanesHistory.slice(0, -1),
        selectedRoofPlaneId: null,
      };
    }),
  selectRoofPlane: (roofPlaneId) => set({ selectedRoofPlaneId: roofPlaneId }),
  updateRoofPlane: (roofPlaneId, changes) =>
    set((state) => ({
      roofPlaneDefinitions: state.roofPlaneDefinitions.map((definition) =>
        definition.id === roofPlaneId ? { ...definition, ...changes } : definition,
      ),
    })),
  updateProjectSettings: (changes) =>
    set((state) => ({ projectSettings: { ...state.projectSettings, ...changes } })),
  updateTileSpecification: (changes) =>
    set((state) => ({ tileSpecification: { ...state.tileSpecification, ...changes } })),
}));

export const readResolvedRoofPlanes = (): RoofPlane[] => {
  const { roofPlaneDefinitions, projectSettings } = useRoofProjectStore.getState();
  return resolveRoofPlanes(roofPlaneDefinitions, projectSettings.roofSlopePercent);
};
