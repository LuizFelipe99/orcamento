import { formatMeters } from '../../formatting/measurementFormatters';
import { summarizeBattens } from '../../geometry/battenLayout';
import { useRoofBattens } from '../hooks/useRoofMaterials';

export const BattenListPanel = () => {
  const battensByPlaneId = useRoofBattens();
  const battenSummary = summarizeBattens([...battensByPlaneId.values()].flat());

  return (
    <section className="planes-panel__section">
      <h2 className="planes-panel__title">Ripas</h2>
      {battenSummary.battenRowCount === 0 ? (
        <p className="planes-panel__hint">Configure beiral e inclinação das águas para calcular as ripas.</p>
      ) : (
        <>
          <div className="planes-panel__row planes-panel__row--total">
            <span>Total de ripa</span>
            <span className="planes-panel__row-value">{formatMeters(battenSummary.totalLengthInMeters)}</span>
          </div>
          <p className="planes-panel__hint">
            {battenSummary.battenRowCount} trechos de ripa, do beiral até a cumeeira. Metragem sem perdas de emenda.
          </p>
        </>
      )}
    </section>
  );
};
