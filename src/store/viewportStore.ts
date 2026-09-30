import { create } from 'zustand';
import type { ScreenPoint } from '../domain/points';
import { INITIAL_VIEWPORT_TRANSFORM, ZOOM_LIMITS } from '../editor/editorSettings';
import {
  panByScreenDelta,
  zoomAroundScreenPoint,
  type ViewportTransform,
} from '../geometry/viewportTransform';

type ViewportState = {
  viewportTransform: ViewportTransform;
  zoomAt: (anchorOnScreen: ScreenPoint, zoomFactor: number) => void;
  panBy: (screenDelta: ScreenPoint) => void;
};

export const useViewportStore = create<ViewportState>()((set) => ({
  viewportTransform: INITIAL_VIEWPORT_TRANSFORM,
  zoomAt: (anchorOnScreen, zoomFactor) =>
    set((state) => ({
      viewportTransform: zoomAroundScreenPoint(state.viewportTransform, anchorOnScreen, zoomFactor, ZOOM_LIMITS),
    })),
  panBy: (screenDelta) =>
    set((state) => ({
      viewportTransform: panByScreenDelta(state.viewportTransform, screenDelta),
    })),
}));
