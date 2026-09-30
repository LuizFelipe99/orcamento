import type { RoofPlaneDefinition } from '../../domain/roofPlane';
import { formatPercent } from '../../formatting/measurementFormatters';
import { useRoofProjectStore } from '../../store/roofProjectStore';
import { focusRoofPlane } from '../commands/editorCommands';
import { useRoofPlanePresentations } from '../presentation/roofPlanePresentation';

const describePlaneStatus = (definition: RoofPlaneDefinition | undefined, roofSlopePercent: number): string => {
  if (!definition?.eave) {
    return 'sem beiral';
  }

  if (definition.slopeOverridePercent === null) {
    return formatPercent(roofSlopePercent);
  }

  return `${formatPercent(definition.slopeOverridePercent)} (própria)`;
};

export const PlaneList = () => {
  const presentations = useRoofPlanePresentations();
  const roofPlaneDefinitions = useRoofProjectStore((state) => state.roofPlaneDefinitions);
  const roofSlopePercent = useRoofProjectStore((state) => state.projectSettings.roofSlopePercent);
  const selectedRoofPlaneId = useRoofProjectStore((state) => state.selectedRoofPlaneId);

  return (
    <section className="planes-panel__section">
      <h2 className="planes-panel__title">Águas ({presentations.length})</h2>
      <ul className="planes-panel__list">
        {presentations.map(({ roofPlane, label, color }) => {
          const definition = roofPlaneDefinitions.find(({ id }) => id === roofPlane.id);
          const isSelected = roofPlane.id === selectedRoofPlaneId;
          const isPending = !roofPlane.eave;
          const buttonClassName = isSelected
            ? 'planes-panel__plane-button planes-panel__plane-button--selected'
            : 'planes-panel__plane-button';
          const statusClassName = isPending
            ? 'planes-panel__plane-status planes-panel__plane-status--pending'
            : 'planes-panel__plane-status';

          return (
            <li key={roofPlane.id}>
              <button type="button" className={buttonClassName} onClick={() => focusRoofPlane(roofPlane.id)}>
                <span>
                  <span className="planes-panel__swatch" style={{ backgroundColor: color }} />
                  {label}
                </span>
                <span className={statusClassName}>{describePlaneStatus(definition, roofSlopePercent)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
