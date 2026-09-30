import { formatMeters, formatPercent } from '../../formatting/measurementFormatters';
import type { CuttingPlan, CutPattern } from '../../materials/cuttingPlan';
import { addPieceMargin } from '../../materials/safetyMargin';
import { SafetyMarginNotice } from './SafetyMarginNotice';

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

type OrderLine = {
  lengthInMeters: number;
  exactQuantity: number;
  orderedQuantity: number;
};

const buildOrderLines = (cuttingPlan: CuttingPlan, safetyMarginPercent: number | null): OrderLine[] =>
  cuttingPlan.stockOrder.map(({ lengthInMeters, quantity }) => ({
    lengthInMeters,
    exactQuantity: quantity,
    orderedQuantity: addPieceMargin(quantity, safetyMarginPercent),
  }));

type CuttingPlanSummaryProps = {
  cuttingPlan: CuttingPlan;
  safetyMarginPercent: number | null;
};

export const CuttingPlanSummary = ({ cuttingPlan, safetyMarginPercent }: CuttingPlanSummaryProps) => {
  const orderLines = buildOrderLines(cuttingPlan, safetyMarginPercent);
  const orderedPieceCount = orderLines.reduce((totalPieces, { orderedQuantity }) => totalPieces + orderedQuantity, 0);
  const orderedLengthInMeters = orderLines.reduce(
    (totalLength, { lengthInMeters, orderedQuantity }) => totalLength + lengthInMeters * orderedQuantity,
    0,
  );
  const marginPieceCount = orderedPieceCount - cuttingPlan.purchasedPieceCount;

  return (
    <>
      <p className="planes-panel__subtitle">Pedido à madeireira</p>
      <ul className="planes-panel__material-list">
        {orderLines.map(({ lengthInMeters, orderedQuantity }) => (
          <li key={lengthInMeters} className="planes-panel__row">
            <span>{describePieces(orderedQuantity, 'caibro', 'caibros')}</span>
            <span className="planes-panel__row-value">de {formatMeters(lengthInMeters)}</span>
          </li>
        ))}
      </ul>
      <div className="planes-panel__row planes-panel__row--total">
        <span>Total ({orderedPieceCount} peças)</span>
        <span className="planes-panel__row-value">{formatMeters(orderedLengthInMeters)}</span>
      </div>
      {safetyMarginPercent !== null && safetyMarginPercent > 0 && (
        <p className="planes-panel__hint">
          {cuttingPlan.purchasedPieceCount} peças no plano de corte + {marginPieceCount} de margem (
          {formatPercent(safetyMarginPercent)}).
        </p>
      )}
      <SafetyMarginNotice safetyMarginPercent={safetyMarginPercent} />
      {cuttingPlan.oversizedCuts.length > 0 && (
        <div className="planes-panel__issue">
          <p className="planes-panel__issue-title">⚠ Caibros maiores que o maior comprimento disponível:</p>
          {cuttingPlan.oversizedCuts.map(({ lengthInMeters, quantity }) => (
            <p key={lengthInMeters} className="planes-panel__issue-remedy">
              {describePieces(quantity, 'caibro', 'caibros')} de {formatMeters(lengthInMeters)}: precisam de emenda sobre
              apoio ou de uma peça maior.
            </p>
          ))}
        </div>
      )}
      {cuttingPlan.cutPatterns.length > 0 && (
        <details className="planes-panel__details">
          <summary>Plano de corte (para a obra)</summary>
          <p className="planes-panel__hint">
            Sobra dos cortes: {formatMeters(cuttingPlan.totalLeftoverInMeters)} ({describeLeftoverShare(cuttingPlan)}).
            As peças de margem ficam inteiras, como reserva.
          </p>
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
};
