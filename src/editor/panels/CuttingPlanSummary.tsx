import { formatMeters } from '../../formatting/measurementFormatters';
import type { CuttingPlan, CutPattern } from '../../materials/cuttingPlan';

const PERCENT_MULTIPLIER = 100;

const describePieces = (quantity: number, singularLabel: string, pluralLabel: string): string =>
  quantity === 1 ? `1 ${singularLabel}` : `${quantity} ${pluralLabel}`;

const describeCuts = (cutPattern: CutPattern): string =>
  cutPattern.cutLengthsInMeters.map((cutLengthInMeters) => formatMeters(cutLengthInMeters)).join(' + ');

const describeLeftoverShare = (cuttingPlan: CuttingPlan): string => {
  if (cuttingPlan.totalPurchasedLengthInMeters === 0) {
    return '0%';
  }

  const leftoverPercent = (cuttingPlan.totalLeftoverInMeters / cuttingPlan.totalPurchasedLengthInMeters) * PERCENT_MULTIPLIER;
  return `${leftoverPercent.toFixed(1).replace('.', ',')}%`;
};

type CuttingPlanSummaryProps = {
  cuttingPlan: CuttingPlan;
};

export const CuttingPlanSummary = ({ cuttingPlan }: CuttingPlanSummaryProps) => (
  <>
    <p className="planes-panel__subtitle">Pedido à madeireira</p>
    <ul className="planes-panel__material-list">
      {cuttingPlan.stockOrder.map(({ lengthInMeters, quantity }) => (
        <li key={lengthInMeters} className="planes-panel__row">
          <span>{describePieces(quantity, 'caibro', 'caibros')}</span>
          <span className="planes-panel__row-value">de {formatMeters(lengthInMeters)}</span>
        </li>
      ))}
    </ul>
    <div className="planes-panel__row planes-panel__row--total">
      <span>Total ({cuttingPlan.purchasedPieceCount} peças)</span>
      <span className="planes-panel__row-value">{formatMeters(cuttingPlan.totalPurchasedLengthInMeters)}</span>
    </div>
    <p className="planes-panel__hint">
      Sobra: {formatMeters(cuttingPlan.totalLeftoverInMeters)} ({describeLeftoverShare(cuttingPlan)})
    </p>
    {cuttingPlan.oversizedCuts.length > 0 && (
      <div className="planes-panel__issue">
        <p className="planes-panel__issue-title">⚠ Caibros maiores que o maior comprimento disponível:</p>
        {cuttingPlan.oversizedCuts.map(({ lengthInMeters, quantity }) => (
          <p key={lengthInMeters} className="planes-panel__issue-remedy">
            {describePieces(quantity, 'caibro', 'caibros')} de {formatMeters(lengthInMeters)}: precisam de emenda sobre apoio
            ou de uma peça maior.
          </p>
        ))}
      </div>
    )}
    {cuttingPlan.cutPatterns.length > 0 && (
      <details className="planes-panel__details">
        <summary>Plano de corte (para a obra)</summary>
        <ul className="planes-panel__material-list">
          {cuttingPlan.cutPatterns.map((cutPattern) => (
            <li
              key={`${cutPattern.stockLengthInMeters}-${cutPattern.cutLengthsInMeters.join('-')}`}
              className="planes-panel__cut-pattern"
            >
              <span className="planes-panel__cut-pattern-header">
                {cutPattern.quantity}× peça de {formatMeters(cutPattern.stockLengthInMeters)}
              </span>
              <span className="planes-panel__row-value">
                {describeCuts(cutPattern)} • sobra {formatMeters(cutPattern.leftoverInMeters)}
              </span>
            </li>
          ))}
        </ul>
      </details>
    )}
  </>
);
