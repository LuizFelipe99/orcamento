import { Layer, Stage } from 'react-konva';
import { useViewportStore } from '../store/viewportStore';
import { useCanvasClick } from './hooks/useCanvasClick';
import { useDrawingShortcuts } from './hooks/useDrawingShortcuts';
import { useViewportNavigation } from './hooks/useViewportNavigation';
import { useViewportSize } from './hooks/useViewportSize';
import { BaseOutline } from './shapes/BaseOutline';
import { CursorSnapIndicator } from './shapes/CursorSnapIndicator';
import { DraftOutline } from './shapes/DraftOutline';
import { PlanGrid } from './shapes/PlanGrid';
import { RoofPlanes } from './shapes/RoofPlanes';
import { VertexHeightLabels } from './shapes/VertexHeightLabels';

const CANVAS_STYLE = { cursor: 'crosshair' };

export const RoofCanvas = () => {
  const viewportSize = useViewportSize();
  const viewportTransform = useViewportStore((state) => state.viewportTransform);
  const { handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave } = useViewportNavigation();
  const { handleCanvasClick } = useCanvasClick();

  useDrawingShortcuts();

  const metersPerPixel = 1 / viewportTransform.pixelsPerMeter;

  return (
    <Stage
      width={viewportSize.width}
      height={viewportSize.height}
      x={viewportTransform.originOnScreen.x}
      y={viewportTransform.originOnScreen.y}
      scaleX={viewportTransform.pixelsPerMeter}
      scaleY={viewportTransform.pixelsPerMeter}
      style={CANVAS_STYLE}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleCanvasClick}
    >
      <Layer listening={false}>
        <PlanGrid viewportSize={viewportSize} viewportTransform={viewportTransform} />
      </Layer>
      <Layer listening={false}>
        <RoofPlanes metersPerPixel={metersPerPixel} />
        <BaseOutline metersPerPixel={metersPerPixel} />
        <VertexHeightLabels metersPerPixel={metersPerPixel} />
        <DraftOutline metersPerPixel={metersPerPixel} />
        <CursorSnapIndicator metersPerPixel={metersPerPixel} />
      </Layer>
    </Stage>
  );
};
