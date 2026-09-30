import { resolveRoofPlanes } from '../../domain/roofPlane';
import { applyVertexMoves, isValidRoofPartition, planRoofCorrection } from '../../geometry/roofCorrection';
import { validateRoofPlanes } from '../../geometry/roofConsistency';
import { useEditorMessageStore } from '../../store/editorMessageStore';
import { readResolvedRoofPlanes, useRoofProjectStore } from '../../store/roofProjectStore';
import { discardDraftInput } from './draftCommands';

const NOTHING_TO_CORRECT_MESSAGE = 'Nada para corrigir: os pontos já estão na posição certa.';
const CORRECTION_FAILED_MESSAGE =
  'Não foi possível corrigir automaticamente: as divisões ficariam cruzadas. Confira o desenho das divisões.';
const PARTIAL_CORRECTION_MESSAGE =
  'Pontos ajustados, mas ainda há linhas que não fecham: o formato das divisões não combina com a base (por exemplo, base retangular precisa de cumeeira, não de um ponto só).';

const describeCorrectedPoints = (correctedPointCount: number): string =>
  correctedPointCount === 1
    ? 'Desenho corrigido: 1 ponto ajustado.'
    : `Desenho corrigido: ${correctedPointCount} pontos ajustados.`;

export const correctRoofDrawing = () => {
  const { baseOutline, roofPlaneDefinitions, projectSettings, replaceRoofPlaneDefinitions } =
    useRoofProjectStore.getState();
  const { showEditorMessage } = useEditorMessageStore.getState();

  if (!baseOutline) {
    return;
  }

  const vertexMoves = planRoofCorrection(readResolvedRoofPlanes(), baseOutline);

  if (vertexMoves.length === 0) {
    showEditorMessage(NOTHING_TO_CORRECT_MESSAGE, 'info');
    return;
  }

  const correctedDefinitions = applyVertexMoves(roofPlaneDefinitions, vertexMoves);

  if (!isValidRoofPartition(correctedDefinitions, baseOutline)) {
    showEditorMessage(CORRECTION_FAILED_MESSAGE);
    return;
  }

  discardDraftInput();
  replaceRoofPlaneDefinitions(correctedDefinitions);

  const remainingIssues = validateRoofPlanes(
    resolveRoofPlanes(correctedDefinitions, projectSettings.roofSlopePercent),
    baseOutline,
  );

  if (remainingIssues.length > 0) {
    showEditorMessage(PARTIAL_CORRECTION_MESSAGE);
    return;
  }

  showEditorMessage(describeCorrectedPoints(vertexMoves.length), 'info');
};
