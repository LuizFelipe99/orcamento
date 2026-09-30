import { useMemo } from 'react';
import { formatMeters } from '../../formatting/measurementFormatters';
import { parseNonNegativeNumber } from '../../formatting/measurementParsers';
import { roundUpRafterLength, summarizeRafters, type RafterSummary } from '../../geometry/rafterLayout';
import { planCuts } from '../../materials/cuttingPlan';
import { useRoofProjectStore } from '../../store/roofProjectStore';
import { useResolvedRoofPlanes, useRoofRafters } from '../hooks/useRoofMaterials';
import { CuttingPlanSummary } from './CuttingPlanSummary';
import { DecimalField } from './DecimalField';
import { StockLengthsEditor } from './StockLengthsEditor';

const MILLIMETERS_PER_METER = 1000;

const describeRafterQuantity = (quantity: number): string => (quantity === 1 ? '1 caibro' : `${quantity} caibros`);

const describePlanesWithoutRafters = (planeCount: number): string => {
  if (planeCount === 1) {
    return '1 água ainda não entra na conta (falta beiral ou inclinação).';
  }

  return `${planeCount} águas ainda não entram na conta (falta beiral ou inclinação).`;
};

const updateSawKerf = (sawKerfInMillimeters: number | null) => {
  if (sawKerfInMillimeters === null) {
    return;
  }

  useRoofProjectStore.getState().updateSawKerf(sawKerfInMillimeters);
};

type ExactLengthListProps = {
  rafterSummary: RafterSummary;
};

const ExactLengthList = ({ rafterSummary }: ExactLengthListProps) => (
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
);

export const RafterListPanel = () => {
  const roofPlanes = useResolvedRoofPlanes();
  const raftersByPlaneId = useRoofRafters();
  const lumberOrderSettings = useRoofProjectStore((state) => state.lumberOrderSettings);
  const addRafterStockLength = useRoofProjectStore((state) => state.addRafterStockLength);
  const removeRafterStockLength = useRoofProjectStore((state) => state.removeRafterStockLength);
  const allRafters = useMemo(() => [...raftersByPlaneId.values()].flat(), [raftersByPlaneId]);
  const rafterSummary = summarizeRafters(allRafters);
  const planesWithoutRafters = roofPlanes.length - raftersByPlaneId.size;
  const hasStockLengths = lumberOrderSettings.rafterStockLengthsInMeters.length > 0;

  const cuttingPlan = useMemo(
    () =>
      planCuts(
        allRafters.map(({ realLengthInMeters }) => roundUpRafterLength(realLengthInMeters)),
        lumberOrderSettings.rafterStockLengthsInMeters,
        lumberOrderSettings.sawKerfInMillimeters / MILLIMETERS_PER_METER,
      ),
    [allRafters, lumberOrderSettings],
  );

  if (rafterSummary.rafterCount === 0) {
    return (
      <section className="planes-panel__section">
        <h2 className="planes-panel__title">Caibros</h2>
        <p className="planes-panel__hint">Configure beiral e inclinação das águas para calcular os caibros.</p>
      </section>
    );
  }

  return (
    <section className="planes-panel__section">
      <h2 className="planes-panel__title">Caibros</h2>
      <StockLengthsEditor
        stockLengthsInMeters={lumberOrderSettings.rafterStockLengthsInMeters}
        onAddStockLength={addRafterStockLength}
        onRemoveStockLength={removeRafterStockLength}
      />
      {hasStockLengths ? (
        <>
          <DecimalField
            inputId="saw-kerf-input"
            label="Espessura do corte (mm)"
            value={lumberOrderSettings.sawKerfInMillimeters}
            placeholder="ex.: 4"
            acceptsEmptyValue={false}
            parseValue={parseNonNegativeNumber}
            onValueChange={updateSawKerf}
          />
          <CuttingPlanSummary cuttingPlan={cuttingPlan} />
          <details className="planes-panel__details">
            <summary>Medidas exatas de cada caibro</summary>
            <ExactLengthList rafterSummary={rafterSummary} />
          </details>
        </>
      ) : (
        <>
          <p className="planes-panel__hint">
            Informe o que a madeireira tem disponível para montar o pedido com plano de corte.
          </p>
          <ExactLengthList rafterSummary={rafterSummary} />
        </>
      )}
      {planesWithoutRafters > 0 && (
        <p className="planes-panel__warning">{describePlanesWithoutRafters(planesWithoutRafters)}</p>
      )}
    </section>
  );
};
