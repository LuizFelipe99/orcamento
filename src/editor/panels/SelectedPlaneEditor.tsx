import { formatDegrees, formatMeters, formatPercent, formatSquareMeters } from '../../formatting/measurementFormatters';
import { parseSlopePercent } from '../../formatting/measurementParsers';
import { polygonArea, segmentLength } from '../../geometry/planMeasurements';
import { realSurfaceArea, slopeAngleInDegrees } from '../../geometry/roofPlaneGeometry';
import { useRoofProjectStore } from '../../store/roofProjectStore';
import { updateSelectedPlaneSlopeOverride } from '../commands/configureCommands';
import { summarizeBattens } from '../../geometry/battenLayout';
import { useRoofBattens, useRoofFootprints, useRoofRafters } from '../hooks/useRoofMaterials';
import { buildPlaneLabelsById } from '../presentation/roofPlanePresentation';
import { DecimalField } from './DecimalField';

type ReadOnlyRowProps = {
  label: string;
  value: string;
};

const ReadOnlyRow = ({ label, value }: ReadOnlyRowProps) => (
  <div className="planes-panel__row">
    <span>{label}</span>
    <span className="planes-panel__row-value">{value}</span>
  </div>
);

const describeEffectiveSlope = (effectiveSlopePercent: number, hasSlopeOverride: boolean): string =>
  `${formatPercent(effectiveSlopePercent)} (${hasSlopeOverride ? 'própria' : 'do telhado'}) • ${formatDegrees(
    slopeAngleInDegrees(effectiveSlopePercent),
  )}`;

export const SelectedPlaneEditor = () => {
  const roofPlaneDefinitions = useRoofProjectStore((state) => state.roofPlaneDefinitions);
  const selectedRoofPlaneId = useRoofProjectStore((state) => state.selectedRoofPlaneId);
  const roofSlopePercent = useRoofProjectStore((state) => state.projectSettings.roofSlopePercent);
  const footprintsByPlaneId = useRoofFootprints();
  const raftersByPlaneId = useRoofRafters();
  const battensByPlaneId = useRoofBattens();
  const selectedDefinition = roofPlaneDefinitions.find((definition) => definition.id === selectedRoofPlaneId);

  if (!selectedDefinition) {
    return (
      <section className="planes-panel__section">
        <h2 className="planes-panel__title">Água selecionada</h2>
        <p className="planes-panel__hint">Selecione uma água no desenho ou na lista acima.</p>
      </section>
    );
  }

  const planeLabel = buildPlaneLabelsById(roofPlaneDefinitions).get(selectedDefinition.id) ?? '';
  const footprint = footprintsByPlaneId.get(selectedDefinition.id) ?? selectedDefinition.outline;
  const planeRafters = raftersByPlaneId.get(selectedDefinition.id) ?? [];
  const planeBattenSummary = summarizeBattens(battensByPlaneId.get(selectedDefinition.id) ?? []);
  const { slopeOverridePercent, eave } = selectedDefinition;
  const effectiveSlopePercent = slopeOverridePercent ?? roofSlopePercent;

  return (
    <section className="planes-panel__section">
      <h2 className="planes-panel__title">{planeLabel}</h2>
      <DecimalField
        key={selectedDefinition.id}
        inputId="slope-override-input"
        label="Inclinação própria (%)"
        value={slopeOverridePercent}
        placeholder={`usa ${formatPercent(roofSlopePercent)}`}
        acceptsEmptyValue
        parseValue={parseSlopePercent}
        onValueChange={updateSelectedPlaneSlopeOverride}
      />
      <p className="planes-panel__hint">Deixe vazio para usar a inclinação do telhado.</p>
      <ReadOnlyRow label="Inclinação usada" value={describeEffectiveSlope(effectiveSlopePercent, slopeOverridePercent !== null)} />
      {eave ? (
        <ReadOnlyRow label="Beiral (na parede)" value={formatMeters(segmentLength(eave))} />
      ) : (
        <p className="planes-panel__warning">Clique no lado do beiral desta água, no desenho.</p>
      )}
      <ReadOnlyRow label="Área em planta" value={formatSquareMeters(polygonArea(footprint))} />
      <ReadOnlyRow label="Área real" value={formatSquareMeters(realSurfaceArea(footprint, effectiveSlopePercent))} />
      {planeRafters.length > 0 && <ReadOnlyRow label="Caibros nesta água" value={String(planeRafters.length)} />}
      {planeBattenSummary.battenRowCount > 0 && (
        <ReadOnlyRow label="Ripas nesta água" value={formatMeters(planeBattenSummary.totalLengthInMeters)} />
      )}
    </section>
  );
};
