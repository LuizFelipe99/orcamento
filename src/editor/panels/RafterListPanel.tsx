import { formatMeters } from '../../formatting/measurementFormatters';
import { summarizeRafters } from '../../geometry/rafterLayout';
import { useResolvedRoofPlanes, useRoofRafters } from '../hooks/useRoofMaterials';

const describeRafterQuantity = (quantity: number): string => (quantity === 1 ? '1 caibro' : `${quantity} caibros`);

const describePlanesWithoutRafters = (planeCount: number): string => {
  if (planeCount === 1) {
    return '1 água ainda não entra na conta (falta beiral ou inclinação).';
  }

  return `${planeCount} águas ainda não entram na conta (falta beiral ou inclinação).`;
};

export const RafterListPanel = () => {
  const roofPlanes = useResolvedRoofPlanes();
  const raftersByPlaneId = useRoofRafters();
  const rafterSummary = summarizeRafters([...raftersByPlaneId.values()].flat());
  const planesWithoutRafters = roofPlanes.length - raftersByPlaneId.size;

  return (
    <section className="planes-panel__section">
      <h2 className="planes-panel__title">Caibros</h2>
      {rafterSummary.rafterCount === 0 ? (
        <p className="planes-panel__hint">Configure beiral e inclinação das águas para calcular os caibros.</p>
      ) : (
        <>
          <ul className="planes-panel__material-list">
            {rafterSummary.lengthGroups.map(({ lengthInMeters, quantity }) => (
              <li key={lengthInMeters} className="planes-panel__row">
                <span>{describeRafterQuantity(quantity)}</span>
                <span className="planes-panel__row-value">de {formatMeters(lengthInMeters)}</span>
              </li>
            ))}
          </ul>
          <div className="planes-panel__row planes-panel__row--total">
            <span>Total ({rafterSummary.rafterCount} peças)</span>
            <span className="planes-panel__row-value">{formatMeters(rafterSummary.totalRealLengthInMeters)}</span>
          </div>
          <p className="planes-panel__hint">Comprimentos reais, arredondados para cima a cada 10 cm.</p>
        </>
      )}
      {planesWithoutRafters > 0 && rafterSummary.rafterCount > 0 && (
        <p className="planes-panel__warning">{describePlanesWithoutRafters(planesWithoutRafters)}</p>
      )}
    </section>
  );
};
