import {
  parseLengthInMeters,
  parseNonNegativeLengthInMeters,
  parseSlopePercent,
} from '../../formatting/measurementParsers';
import { useRoofProjectStore, type ProjectSettings } from '../../store/roofProjectStore';
import { DecimalField } from './DecimalField';
import { LayerVisibilityToggles } from './LayerVisibilityToggles';

const updateProjectSetting =
  (settingName: keyof ProjectSettings) =>
  (settingValue: number | null): void => {
    if (settingValue === null) {
      return;
    }

    useRoofProjectStore.getState().updateProjectSettings({ [settingName]: settingValue });
  };

const updateRoofSlope = updateProjectSetting('roofSlopePercent');
const updateEaveOverhang = updateProjectSetting('eaveOverhangInMeters');
const updateRafterSpacing = updateProjectSetting('rafterSpacingInMeters');

export const ProjectSettingsPanel = () => {
  const projectSettings = useRoofProjectStore((state) => state.projectSettings);

  return (
    <section className="planes-panel__section">
      <h2 className="planes-panel__title">Projeto</h2>
      <DecimalField
        inputId="roof-slope-input"
        label="Inclinação do telhado (%)"
        value={projectSettings.roofSlopePercent}
        placeholder="ex.: 30"
        acceptsEmptyValue={false}
        parseValue={parseSlopePercent}
        onValueChange={updateRoofSlope}
      />
      <DecimalField
        inputId="eave-overhang-input"
        label="Beiral saliente (m)"
        value={projectSettings.eaveOverhangInMeters}
        placeholder="ex.: 0,5"
        acceptsEmptyValue={false}
        parseValue={parseNonNegativeLengthInMeters}
        onValueChange={updateEaveOverhang}
      />
      <DecimalField
        inputId="rafter-spacing-input"
        label="Espaçamento dos caibros (m)"
        value={projectSettings.rafterSpacingInMeters}
        placeholder="ex.: 0,5"
        acceptsEmptyValue={false}
        parseValue={parseLengthInMeters}
        onValueChange={updateRafterSpacing}
      />
      <LayerVisibilityToggles />
    </section>
  );
};
