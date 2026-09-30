import type { KonvaEventObject } from 'konva/lib/Node';
import { useRef } from 'react';
import type { ScreenPoint } from '../../domain/points';
import { screenToPlan } from '../../geometry/viewportTransform';
import { useCursorStore } from '../../store/cursorStore';
import { useViewportStore } from '../../store/viewportStore';
import { ZOOM_STEP_FACTOR } from '../editorSettings';

const MIDDLE_MOUSE_BUTTON = 1;

const readPointerOnScreen = (event: KonvaEventObject<MouseEvent | WheelEvent>): ScreenPoint | null =>
  event.target.getStage()?.getPointerPosition() ?? null;

export const useViewportNavigation = () => {
  const zoomAt = useViewportStore((state) => state.zoomAt);
  const panBy = useViewportStore((state) => state.panBy);
  const setCursorPlanPoint = useCursorStore((state) => state.setCursorPlanPoint);
  const lastPanPointerRef = useRef<ScreenPoint | null>(null);

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();

    const pointerOnScreen = readPointerOnScreen(event);

    if (!pointerOnScreen) {
      return;
    }

    const isZoomingIn = event.evt.deltaY < 0;
    const zoomFactor = isZoomingIn ? ZOOM_STEP_FACTOR : 1 / ZOOM_STEP_FACTOR;

    zoomAt(pointerOnScreen, zoomFactor);
  };

  const handleMouseDown = (event: KonvaEventObject<MouseEvent>) => {
    if (event.evt.button !== MIDDLE_MOUSE_BUTTON) {
      return;
    }

    event.evt.preventDefault();
    lastPanPointerRef.current = readPointerOnScreen(event);
  };

  const handleMouseMove = (event: KonvaEventObject<MouseEvent>) => {
    const pointerOnScreen = readPointerOnScreen(event);

    if (!pointerOnScreen) {
      return;
    }

    const { viewportTransform } = useViewportStore.getState();
    setCursorPlanPoint(screenToPlan(pointerOnScreen, viewportTransform));

    const lastPanPointer = lastPanPointerRef.current;

    if (!lastPanPointer) {
      return;
    }

    panBy({
      x: pointerOnScreen.x - lastPanPointer.x,
      y: pointerOnScreen.y - lastPanPointer.y,
    });
    lastPanPointerRef.current = pointerOnScreen;
  };

  const handleMouseUp = (event: KonvaEventObject<MouseEvent>) => {
    if (event.evt.button !== MIDDLE_MOUSE_BUTTON) {
      return;
    }

    lastPanPointerRef.current = null;
  };

  const handleMouseLeave = () => {
    lastPanPointerRef.current = null;
    setCursorPlanPoint(null);
  };

  return { handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave };
};
