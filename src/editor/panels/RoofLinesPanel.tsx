import { formatMeters } from '../../formatting/measurementFormatters';
import { totalRoofLineLengths } from '../../geometry/roofLines';
import type { SharedLineKind } from '../../geometry/roofTopology';
import { useRoofLines } from '../hooks/useRoofMaterials';

type RoofLineRow = {
  kind: SharedLineKind;
  label: string;
};

const ROOF_LINE_ROWS: RoofLineRow[] = [
  { kind: 'ridge', label: 'Cumeeira' },
  { kind: 'hip', label: 'Espigões' },
  { kind: 'valley', label: 'Rincões' },
];

export const RoofLinesPanel = () => {
  const roofLineTotals = totalRoofLineLengths(useRoofLines());
  const visibleRows = ROOF_LINE_ROWS.filter(({ kind }) => roofLineTotals[kind] > 0);

  if (visibleRows.length === 0) {
    return null;
  }

  return (
    <section className="planes-panel__section">
      <h2 className="planes-panel__title">Linhas do telhado</h2>
      {visibleRows.map(({ kind, label }) => (
        <div key={kind} className="planes-panel__row">
          <span>{label}</span>
          <span className="planes-panel__row-value">{formatMeters(roofLineTotals[kind])}</span>
        </div>
      ))}
      <p className="planes-panel__hint">Comprimentos reais, na inclinação, incluindo o beiral.</p>
    </section>
  );
};
