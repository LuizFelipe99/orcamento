import { formatSquareMeters } from '../../formatting/measurementFormatters';
import { summarizeRoof } from '../../geometry/roofSummary';
import { useResolvedRoofPlanes, useRoofFootprints } from '../hooks/useRoofMaterials';

const describePendingPlanes = (pendingPlaneCount: number): string => {
  if (pendingPlaneCount === 0) {
    return 'Todas as águas configuradas';
  }

  if (pendingPlaneCount === 1) {
    return '1 água sem beiral ou inclinação';
  }

  return `${pendingPlaneCount} águas sem beiral ou inclinação`;
};

export const RoofSummaryPanel = () => {
  const roofPlanes = useResolvedRoofPlanes();
  const footprintsByPlaneId = useRoofFootprints();
  const roofSummary = summarizeRoof(roofPlanes, footprintsByPlaneId);
  const pendingClassName = roofSummary.pendingPlaneCount > 0 ? 'planes-panel__warning' : 'planes-panel__hint';

  return (
    <section className="planes-panel__section">
      <h2 className="planes-panel__title">Resumo</h2>
      <div className="planes-panel__row">
        <span>Área em planta (com beiral)</span>
        <span className="planes-panel__row-value">{formatSquareMeters(roofSummary.planAreaInSquareMeters)}</span>
      </div>
      <div className="planes-panel__row">
        <span>Área real configurada</span>
        <span className="planes-panel__row-value">{formatSquareMeters(roofSummary.realAreaInSquareMeters)}</span>
      </div>
      <p className={pendingClassName}>{describePendingPlanes(roofSummary.pendingPlaneCount)}</p>
    </section>
  );
};
