import { formatMeters } from '../../formatting/measurementFormatters';
import type { RoofValidationIssue, SharedEdgeHeightMismatch } from '../../geometry/roofConsistency';
import type { SharedLineKind } from '../../geometry/roofTopology';
import { useRoofProjectStore } from '../../store/roofProjectStore';
import { correctRoofDrawing } from '../commands/correctionCommands';
import { useRoofValidationIssues } from '../hooks/useRoofValidationIssues';
import { buildPlaneLabelsById } from '../presentation/roofPlanePresentation';

type WarningText = {
  title: string;
  remedy: string;
};

type PlaneLabelResolver = (planeId: string) => string;

const LINE_NAMES_BY_KIND: Record<SharedLineKind, string> = {
  ridge: 'A cumeeira',
  hip: 'O espigão',
  valley: 'O rincão',
  junction: 'A linha de encontro',
};

const MISMATCH_REMEDY = 'O ponto está fora de posição para essa inclinação. Use "Corrigir desenho" para ajustá-lo.';

const POINT_BELOW_EAVE_REMEDY =
  'O lado marcado como beiral não é a borda mais baixa desta água. Em "Configurar águas", clique no lado por onde a água escorre (onde fica a calha).';

const describeMismatch = (mismatch: SharedEdgeHeightMismatch, resolvePlaneLabel: PlaneLabelResolver): WarningText => {
  const [firstPlaneLabel, secondPlaneLabel] = mismatch.planeIds.map(resolvePlaneLabel);
  const [firstHeight, secondHeight] = mismatch.heightsAtWorstPointInMeters.map(formatMeters);

  return {
    title: `${LINE_NAMES_BY_KIND[mismatch.lineKind]} entre ${firstPlaneLabel} e ${secondPlaneLabel} não fecha: a ${firstPlaneLabel} chega a ${firstHeight} e a ${secondPlaneLabel} a ${secondHeight}.`,
    remedy: MISMATCH_REMEDY,
  };
};

const describeValidationIssue = (
  validationIssue: RoofValidationIssue,
  resolvePlaneLabel: PlaneLabelResolver,
): WarningText => {
  if (validationIssue.kind === 'pointBelowEave') {
    return { title: `${resolvePlaneLabel(validationIssue.planeId)}: beiral no lado errado.`, remedy: POINT_BELOW_EAVE_REMEDY };
  }

  return describeMismatch(validationIssue, resolvePlaneLabel);
};

export const ValidationWarnings = () => {
  const roofPlaneDefinitions = useRoofProjectStore((state) => state.roofPlaneDefinitions);
  const validationIssues = useRoofValidationIssues();

  if (validationIssues.length === 0) {
    return null;
  }

  const planeLabelsById = buildPlaneLabelsById(roofPlaneDefinitions);
  const resolvePlaneLabel: PlaneLabelResolver = (planeId) => planeLabelsById.get(planeId) ?? 'Água';
  const hasHeightMismatch = validationIssues.some(({ kind }) => kind === 'sharedEdgeHeightMismatch');

  return (
    <section className="planes-panel__section">
      <h2 className="planes-panel__title">Avisos ({validationIssues.length})</h2>
      {hasHeightMismatch && (
        <button type="button" className="planes-panel__action" onClick={correctRoofDrawing}>
          Corrigir desenho
        </button>
      )}
      {validationIssues.map((validationIssue, issueIndex) => {
        const { title, remedy } = describeValidationIssue(validationIssue, resolvePlaneLabel);

        return (
          <div key={`validation-issue-${issueIndex}`} className="planes-panel__issue">
            <p className="planes-panel__issue-title">⚠ {title}</p>
            <p className="planes-panel__issue-remedy">{remedy}</p>
          </div>
        );
      })}
    </section>
  );
};
