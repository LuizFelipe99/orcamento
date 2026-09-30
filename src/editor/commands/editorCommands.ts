import type { DraftTarget } from '../../geometry/outlineDrafting';
import { useRoofProjectStore } from '../../store/roofProjectStore';
import { useToolStore, type DraftingTool, type EditorTool } from '../../store/toolStore';
import { classifyTypedEndpoint, readCurrentDraftTarget } from '../drafting/currentDraftTarget';
import { placeBaseDraftPoint } from './baseOutlineCommands';
import { selectPlaneOrEaveAtCursor } from './configureCommands';
import { discardDraftInput, readTypedEndpoint } from './draftCommands';
import { placeSplitDraftPoint } from './splitCommands';

const draftPointPlacersByTool: Record<DraftingTool, (draftTarget: DraftTarget) => void> = {
  drawBase: placeBaseDraftPoint,
  splitPlanes: placeSplitDraftPoint,
};

export const isToolAvailable = (tool: EditorTool, hasBaseOutline: boolean): boolean =>
  tool === 'drawBase' ? !hasBaseOutline : hasBaseOutline;

export const handlePrimaryClick = () => {
  const { activeTool } = useToolStore.getState();

  if (activeTool === 'configurePlanes') {
    selectPlaneOrEaveAtCursor();
    return;
  }

  const draftTarget = readCurrentDraftTarget();

  if (!draftTarget) {
    return;
  }

  draftPointPlacersByTool[activeTool](draftTarget);
};

export const commitTypedLength = () => {
  const { activeTool } = useToolStore.getState();

  if (activeTool === 'configurePlanes') {
    return;
  }

  const typedEndpoint = readTypedEndpoint();

  if (!typedEndpoint) {
    return;
  }

  draftPointPlacersByTool[activeTool](classifyTypedEndpoint(typedEndpoint));
};

export const activateTool = (tool: EditorTool) => {
  const hasBaseOutline = useRoofProjectStore.getState().baseOutline !== null;

  if (!isToolAvailable(tool, hasBaseOutline)) {
    return;
  }

  discardDraftInput();
  useRoofProjectStore.getState().selectRoofPlane(null);
  useToolStore.getState().setActiveTool(tool);
};

export const focusRoofPlane = (roofPlaneId: string) => {
  activateTool('configurePlanes');
  useRoofProjectStore.getState().selectRoofPlane(roofPlaneId);
};
