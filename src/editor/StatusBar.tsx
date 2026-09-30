import { formatMeters, formatSquareMeters } from '../formatting/measurementFormatters';
import { selectGridSpacing } from '../geometry/gridSpacing';
import { polygonArea } from '../geometry/planMeasurements';
import { useCursorStore } from '../store/cursorStore';
import { useDraftingInputStore } from '../store/draftingInputStore';
import { useDraftStore } from '../store/draftStore';
import { useEditorMessageStore } from '../store/editorMessageStore';
import { useRoofProjectStore } from '../store/roofProjectStore';
import { useToolStore, type EditorTool } from '../store/toolStore';
import { useViewportStore } from '../store/viewportStore';
import { MINIMUM_GRID_STEP_IN_PIXELS } from './editorSettings';

const resolveDrawingHint = (activeTool: EditorTool, draftVertexCount: number): string => {
  if (activeTool === 'configurePlanes') {
    return 'Clique em uma água para selecionar • Com ela selecionada, clique no lado do beiral';
  }

  if (activeTool === 'splitPlanes' && draftVertexCount === 0) {
    return 'Clique no contorno para iniciar uma divisão • Desenhe aproximado e use "Corrigir desenho" • Ctrl+Z desfaz';
  }

  if (activeTool === 'splitPlanes') {
    return 'Clique para dobrar a linha • Clique no contorno para concluir • Shift trava 45° • Esc cancela';
  }

  if (draftVertexCount === 0) {
    return 'Clique para marcar o primeiro ponto da base • G liga/desliga o snap na grade';
  }

  return 'Clique ou digite a medida + Enter • Shift trava 45° • Backspace desfaz • Esc cancela';
};

const resolveSnapModeLabel = (isGridSnapEnabled: boolean, isAngleLockActive: boolean): string => {
  const gridSnapLabel = isGridSnapEnabled ? 'Snap: grade' : 'Snap: livre';

  if (!isAngleLockActive) {
    return gridSnapLabel;
  }

  return `${gridSnapLabel} + ângulo travado`;
};

export const StatusBar = () => {
  const cursorPlanPoint = useCursorStore((state) => state.cursorPlanPoint);
  const pixelsPerMeter = useViewportStore((state) => state.viewportTransform.pixelsPerMeter);
  const draftVertexCount = useDraftStore((state) => state.draftVertices.length);
  const baseOutline = useRoofProjectStore((state) => state.baseOutline);
  const activeTool = useToolStore((state) => state.activeTool);
  const editorMessage = useEditorMessageStore((state) => state.editorMessage);
  const isGridSnapEnabled = useDraftingInputStore((state) => state.isGridSnapEnabled);
  const isAngleLockActive = useDraftingInputStore((state) => state.isAngleLockActive);
  const { minorStepInMeters } = selectGridSpacing(pixelsPerMeter, MINIMUM_GRID_STEP_IN_PIXELS);

  const cursorLabel = cursorPlanPoint
    ? `X ${formatMeters(cursorPlanPoint.x)}   Y ${formatMeters(cursorPlanPoint.y)}`
    : 'Cursor fora do canvas';

  const areaLabel = baseOutline ? `Área da base: ${formatSquareMeters(polygonArea(baseOutline))}   ` : '';

  return (
    <footer className="status-bar">
      <span>{cursorLabel}</span>
      {editorMessage ? (
        <span className={`status-bar__message status-bar__message--${editorMessage.tone}`}>{editorMessage.text}</span>
      ) : (
        <span>{resolveDrawingHint(activeTool, draftVertexCount)}</span>
      )}
      <span>
        {areaLabel}
        {resolveSnapModeLabel(isGridSnapEnabled, isAngleLockActive)}   Grade: {formatMeters(minorStepInMeters)}
      </span>
    </footer>
  );
};
