import {
  parseLengthInMeters,
  parseNonNegativeLengthInMeters,
  parseNonNegativeNumber,
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

const updateWoodSafetyMargin = (woodSafetyMarginPercent: number | null) =>
  useRoofProjectStore.getState().updateWoodSafetyMargin(woodSafetyMarginPercent);

export const ProjectSettingsPanel = () => {
  const projectSettings = useRoofProjectStore((state) => state.projectSettings);
  const woodSafetyMarginPercent = useRoofProjectStore((state) => state.lumberOrderSettings.woodSafetyMarginPercent);

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
      <DecimalField
        inputId="wood-safety-margin-input"
        label="Margem de segurança da madeira (%)"
        value={woodSafetyMarginPercent}
        placeholder="ex.: 10"
        acceptsEmptyValue
        parseValue={parseNonNegativeNumber}
        onValueChange={updateWoodSafetyMargin}
      />
      <p className="planes-panel__hint">Vale para caibros e ripas: cobre peças com defeito, quebra e acidentes.</p>
      <LayerVisibilityToggles />
    </section>
  );
};
