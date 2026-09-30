import type { KonvaEventObject } from 'konva/lib/Node';
import { handlePrimaryClick } from '../commands/editorCommands';

const PRIMARY_MOUSE_BUTTON = 0;

export const useCanvasClick = () => {
  const handleCanvasClick = (event: KonvaEventObject<MouseEvent>) => {
    if (event.evt.button !== PRIMARY_MOUSE_BUTTON) {
      return;
    }

    handlePrimaryClick();
  };

  return { handleCanvasClick };
};
