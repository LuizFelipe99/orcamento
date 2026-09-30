import type { PlanPoint } from '../../domain/points';
import { parseLengthInMeters } from '../../formatting/measurementParsers';
import { isDegenerateSegment, pointAtDistanceTowards } from '../../geometry/outlineDrafting';
import { pixelsToMeters } from '../../geometry/viewportTransform';
import { useDraftingInputStore } from '../../store/draftingInputStore';
import { useDraftStore } from '../../store/draftStore';
import { useRoofProjectStore } from '../../store/roofProjectStore';
import { useViewportStore } from '../../store/viewportStore';
import { SNAP_TOLERANCE_IN_PIXELS } from '../editorSettings';
import { readCurrentDraftTarget } from '../drafting/currentDraftTarget';

export const discardDraftInput = () => {
  useDraftStore.getState().discardDraft();
  useDraftingInputStore.getState().clearTypedLength();
};

export const isTooCloseToLastDraftVertex = (point: PlanPoint): boolean => {
  const lastDraftVertex = useDraftStore.getState().draftVertices.at(-1);

  if (!lastDraftVertex) {
    return false;
  }

  const { pixelsPerMeter } = useViewportStore.getState().viewportTransform;
  const minimumSegmentLengthInMeters = pixelsToMeters(SNAP_TOLERANCE_IN_PIXELS, pixelsPerMeter);

  return isDegenerateSegment(lastDraftVertex, point, minimumSegmentLengthInMeters);
};

export const appendDraftPoint = (point: PlanPoint) => {
  if (isTooCloseToLastDraftVertex(point)) {
    return;
  }

  useDraftStore.getState().appendDraftVertex(point);
  useDraftingInputStore.getState().clearTypedLength();
};

export const readTypedEndpoint = (): PlanPoint | null => {
  const typedLengthInMeters = parseLengthInMeters(useDraftingInputStore.getState().typedLengthInput);
  const lastDraftVertex = useDraftStore.getState().draftVertices.at(-1);
  const draftTarget = readCurrentDraftTarget();

  if (typedLengthInMeters === null || !lastDraftVertex || !draftTarget) {
    return null;
  }

  return pointAtDistanceTowards(lastDraftVertex, draftTarget.targetPoint, typedLengthInMeters);
};

export const typeLengthCharacter = (character: string) => {
  if (useDraftStore.getState().draftVertices.length === 0) {
    return;
  }

  useDraftingInputStore.getState().appendTypedLengthCharacter(character);
};

export const undoLastDraftInput = () => {
  const { typedLengthInput, removeLastTypedLengthCharacter } = useDraftingInputStore.getState();

  if (typedLengthInput) {
    removeLastTypedLengthCharacter();
    return;
  }

  useDraftStore.getState().removeLastDraftVertex();
};

export const cancelCurrentInput = () => {
  const { typedLengthInput, clearTypedLength } = useDraftingInputStore.getState();

  if (typedLengthInput) {
    clearTypedLength();
    return;
  }

  if (useDraftStore.getState().draftVertices.length > 0) {
    useDraftStore.getState().discardDraft();
    return;
  }

  useRoofProjectStore.getState().selectRoofPlane(null);
};

export const toggleGridSnap = () => useDraftingInputStore.getState().toggleGridSnap();

export const setAngleLockActive = (isActive: boolean) =>
  useDraftingInputStore.getState().setAngleLockActive(isActive);
