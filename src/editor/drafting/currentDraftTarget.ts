import { useMemo } from 'react';
import type { PlanPoint } from '../../domain/points';
import { parseLengthInMeters } from '../../formatting/measurementParsers';
import { selectGridSpacing } from '../../geometry/gridSpacing';
import {
  MINIMUM_VERTICES_TO_CLOSE_OUTLINE,
  pointAtDistanceTowards,
  resolveDraftTarget,
  type DraftSnapCandidates,
  type DraftTarget,
} from '../../geometry/outlineDrafting';
import { pixelsToMeters } from '../../geometry/viewportTransform';
import { useCursorStore } from '../../store/cursorStore';
import { useDraftingInputStore } from '../../store/draftingInputStore';
import { useDraftStore } from '../../store/draftStore';
import { useRoofProjectStore } from '../../store/roofProjectStore';
import { useToolStore, type EditorTool } from '../../store/toolStore';
import { useViewportStore } from '../../store/viewportStore';
import {
  MINIMUM_GRID_STEP_IN_PIXELS,
  SNAP_TOLERANCE_IN_PIXELS,
  TYPED_ENDPOINT_SNAP_TOLERANCE_IN_METERS,
} from '../editorSettings';

const readPlaneOutlines = (): PlanPoint[][] =>
  useRoofProjectStore.getState().roofPlaneDefinitions.map((definition) => definition.outline);

type DraftTargetInputs = {
  activeTool: EditorTool;
  cursorPlanPoint: PlanPoint | null;
  draftVertices: PlanPoint[];
  planeOutlines: PlanPoint[][];
  pixelsPerMeter: number;
  isAngleLockActive: boolean;
  isGridSnapEnabled: boolean;
};

const buildSnapCandidates = (
  activeTool: EditorTool,
  draftVertices: PlanPoint[],
  planeOutlines: PlanPoint[][],
): DraftSnapCandidates | null => {
  if (activeTool === 'drawBase') {
    const canCloseOutline = draftVertices.length >= MINIMUM_VERTICES_TO_CLOSE_OUTLINE;
    return { closingVertex: canCloseOutline ? draftVertices[0] : null, boundaryOutlines: [] };
  }

  if (activeTool === 'splitPlanes') {
    return { closingVertex: null, boundaryOutlines: planeOutlines };
  }

  return null;
};

const computeDraftTarget = (inputs: DraftTargetInputs): DraftTarget | null => {
  const snapCandidates = buildSnapCandidates(inputs.activeTool, inputs.draftVertices, inputs.planeOutlines);

  if (!inputs.cursorPlanPoint || !snapCandidates) {
    return null;
  }

  const { minorStepInMeters } = selectGridSpacing(inputs.pixelsPerMeter, MINIMUM_GRID_STEP_IN_PIXELS);

  return resolveDraftTarget(
    inputs.cursorPlanPoint,
    inputs.draftVertices.at(-1) ?? null,
    {
      snapToleranceInMeters: pixelsToMeters(SNAP_TOLERANCE_IN_PIXELS, inputs.pixelsPerMeter),
      gridStepInMeters: inputs.isGridSnapEnabled ? minorStepInMeters : null,
      isAngleLockActive: inputs.isAngleLockActive,
    },
    snapCandidates,
  );
};

export const readCurrentDraftTarget = (): DraftTarget | null => {
  const { isAngleLockActive, isGridSnapEnabled } = useDraftingInputStore.getState();

  return computeDraftTarget({
    activeTool: useToolStore.getState().activeTool,
    cursorPlanPoint: useCursorStore.getState().cursorPlanPoint,
    draftVertices: useDraftStore.getState().draftVertices,
    planeOutlines: readPlaneOutlines(),
    pixelsPerMeter: useViewportStore.getState().viewportTransform.pixelsPerMeter,
    isAngleLockActive,
    isGridSnapEnabled,
  });
};

export const useCurrentDraftTarget = (): DraftTarget | null => {
  const activeTool = useToolStore((state) => state.activeTool);
  const cursorPlanPoint = useCursorStore((state) => state.cursorPlanPoint);
  const draftVertices = useDraftStore((state) => state.draftVertices);
  const roofPlaneDefinitions = useRoofProjectStore((state) => state.roofPlaneDefinitions);
  const planeOutlines = useMemo(
    () => roofPlaneDefinitions.map((definition) => definition.outline),
    [roofPlaneDefinitions],
  );
  const pixelsPerMeter = useViewportStore((state) => state.viewportTransform.pixelsPerMeter);
  const isAngleLockActive = useDraftingInputStore((state) => state.isAngleLockActive);
  const isGridSnapEnabled = useDraftingInputStore((state) => state.isGridSnapEnabled);

  return computeDraftTarget({
    activeTool,
    cursorPlanPoint,
    draftVertices,
    planeOutlines,
    pixelsPerMeter,
    isAngleLockActive,
    isGridSnapEnabled,
  });
};

export const classifyTypedEndpoint = (typedEndpoint: PlanPoint): DraftTarget => {
  const snapCandidates = buildSnapCandidates(
    useToolStore.getState().activeTool,
    useDraftStore.getState().draftVertices,
    readPlaneOutlines(),
  );

  if (!snapCandidates) {
    return { targetPoint: typedEndpoint, snapKind: 'free' };
  }

  return resolveDraftTarget(
    typedEndpoint,
    null,
    { snapToleranceInMeters: TYPED_ENDPOINT_SNAP_TOLERANCE_IN_METERS, gridStepInMeters: null, isAngleLockActive: false },
    snapCandidates,
  );
};

export const resolvePreviewEndpoint = (
  lastDraftVertex: PlanPoint,
  draftTarget: DraftTarget,
  typedLengthInput: string,
): PlanPoint => {
  const typedLengthInMeters = parseLengthInMeters(typedLengthInput);

  if (typedLengthInMeters === null) {
    return draftTarget.targetPoint;
  }

  return pointAtDistanceTowards(lastDraftVertex, draftTarget.targetPoint, typedLengthInMeters) ?? draftTarget.targetPoint;
};
