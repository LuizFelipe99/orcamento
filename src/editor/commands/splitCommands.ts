import type { PlanPoint } from '../../domain/points';
import { createRoofPlaneDefinition, type RoofPlaneDefinition } from '../../domain/roofPlane';
import { assignMissingEaves } from '../../geometry/eaveDetection';
import type { DraftTarget } from '../../geometry/outlineDrafting';
import { splitRoofPlanes } from '../../geometry/roofPlaneSplitting';
import { useDraftStore } from '../../store/draftStore';
import { useEditorMessageStore } from '../../store/editorMessageStore';
import { useRoofProjectStore } from '../../store/roofProjectStore';
import { appendDraftPoint, discardDraftInput, isTooCloseToLastDraftVertex } from './draftCommands';

const SPLIT_MUST_START_ON_BOUNDARY_MESSAGE = 'A divisão deve começar no contorno de uma água.';
const INVALID_SPLIT_MESSAGE =
  'Divisão inválida: a linha deve ficar dentro de uma única água e terminar no contorno dela.';

const createChildPlane = (parentPlane: RoofPlaneDefinition, childOutline: PlanPoint[]): RoofPlaneDefinition =>
  createRoofPlaneDefinition(childOutline, parentPlane.slopeOverridePercent);

const completeSplit = (divisionPolyline: PlanPoint[]) => {
  const { baseOutline, roofPlaneDefinitions, replaceRoofPlaneDefinitions } = useRoofProjectStore.getState();
  const splitDefinitions = splitRoofPlanes(roofPlaneDefinitions, divisionPolyline, createChildPlane);

  if (!splitDefinitions || !baseOutline) {
    useEditorMessageStore.getState().showEditorMessage(INVALID_SPLIT_MESSAGE);
    return;
  }

  replaceRoofPlaneDefinitions(assignMissingEaves(splitDefinitions, baseOutline));
  discardDraftInput();
};

export const placeSplitDraftPoint = (draftTarget: DraftTarget) => {
  const { draftVertices } = useDraftStore.getState();
  const isOnBoundary = draftTarget.snapKind === 'boundary';

  if (draftVertices.length === 0 && !isOnBoundary) {
    useEditorMessageStore.getState().showEditorMessage(SPLIT_MUST_START_ON_BOUNDARY_MESSAGE);
    return;
  }

  if (draftVertices.length === 0 || !isOnBoundary) {
    appendDraftPoint(draftTarget.targetPoint);
    return;
  }

  if (isTooCloseToLastDraftVertex(draftTarget.targetPoint)) {
    return;
  }

  completeSplit([...draftVertices, draftTarget.targetPoint]);
};

export const undoLastRoofChange = () => {
  discardDraftInput();
  useRoofProjectStore.getState().undoLastRoofPlanesChange();
};
