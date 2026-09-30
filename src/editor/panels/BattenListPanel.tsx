import { formatMeters, formatPercent } from '../../formatting/measurementFormatters';
import { summarizeBattens } from '../../geometry/battenLayout';
import { addLengthMargin } from '../../materials/safetyMargin';
import { useRoofProjectStore } from '../../store/roofProjectStore';
import { useRoofBattens } from '../hooks/useRoofMaterials';
import { SafetyMarginNotice } from './SafetyMarginNotice';

export const BattenListPanel = () => {
  const battensByPlaneId = useRoofBattens();
  const safetyMarginPercent = useRoofProjectStore((state) => state.lumberOrderSettings.woodSafetyMarginPercent);
  const battenSummary = summarizeBattens([...battensByPlaneId.values()].flat());
  const hasSafetyMargin = safetyMarginPercent !== null && safetyMarginPercent > 0;

  if (battenSummary.battenRowCount === 0) {
    return (
      <section className="planes-panel__section">
        <h2 className="planes-panel__title">Ripas</h2>
        <p className="planes-panel__hint">Configure beiral e inclinação das águas para calcular as ripas.</p>
      </section>
    );
  }

  return (
    <section className="planes-panel__section">
      <h2 className="planes-panel__title">Ripas</h2>
      <div className="planes-panel__row">
        <span>Metragem exata</span>
        <span className="planes-panel__row-value">{formatMeters(battenSummary.totalLengthInMeters)}</span>
      </div>
      {hasSafetyMargin && (
        <div className="planes-panel__row planes-panel__row--total">
          <span>Pedir (margem {formatPercent(safetyMarginPercent)})</span>
          <span className="planes-panel__row-value">
            {formatMeters(addLengthMargin(battenSummary.totalLengthInMeters, safetyMarginPercent))}
          </span>
        </div>
      )}
      <SafetyMarginNotice safetyMarginPercent={safetyMarginPercent} />
      <p className="planes-panel__hint">
        {battenSummary.battenRowCount} trechos de ripa, do beiral até a cumeeira.
      </p>
    </section>
  );
};
