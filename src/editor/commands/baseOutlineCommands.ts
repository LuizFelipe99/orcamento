import { createRoofPlaneDefinition } from '../../domain/roofPlane';
import { assignMissingEaves } from '../../geometry/eaveDetection';
import type { DraftTarget } from '../../geometry/outlineDrafting';
import { removeClosingDuplicateVertex } from '../../geometry/outlineDrafting';
import { useDraftStore } from '../../store/draftStore';
import { useRoofProjectStore } from '../../store/roofProjectStore';
import { useToolStore } from '../../store/toolStore';
import { appendDraftPoint, discardDraftInput } from './draftCommands';

const PROJECT_DELETION_CONFIRMATION = 'Apagar a base e todas as águas? Essa ação não pode ser desfeita.';

const completeBaseOutline = () => {
  const baseOutline = removeClosingDuplicateVertex(useDraftStore.getState().draftVertices);
  const initialDefinitions = assignMissingEaves([createRoofPlaneDefinition(baseOutline)], baseOutline);

  useRoofProjectStore.getState().defineBaseOutline(baseOutline, initialDefinitions);
  discardDraftInput();
  useToolStore.getState().setActiveTool('splitPlanes');
};

export const placeBaseDraftPoint = (draftTarget: DraftTarget) => {
  if (useRoofProjectStore.getState().baseOutline) {
    return;
  }

  if (draftTarget.snapKind === 'closingVertex') {
    completeBaseOutline();
    return;
  }

  appendDraftPoint(draftTarget.targetPoint);
};

export const requestProjectDeletion = () => {
  if (!useRoofProjectStore.getState().baseOutline) {
    return;
  }

  if (!window.confirm(PROJECT_DELETION_CONFIRMATION)) {
    return;
  }

  useRoofProjectStore.getState().clearProject();
  discardDraftInput();
  useToolStore.getState().setActiveTool('drawBase');
};
