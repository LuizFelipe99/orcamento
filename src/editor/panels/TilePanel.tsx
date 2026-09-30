import { formatMeters, formatSquareMeters } from '../../formatting/measurementFormatters';
import {
  parseLengthInMeters,
  parseNonNegativeNumber,
  parsePositiveNumber,
} from '../../formatting/measurementParsers';
import { totalRoofLineLengths } from '../../geometry/roofLines';
import { summarizeRoof } from '../../geometry/roofSummary';
import { estimateTiles, type TileSpecification } from '../../materials/tileEstimate';
import { useRoofProjectStore } from '../../store/roofProjectStore';
import { useResolvedRoofPlanes, useRoofFootprints, useRoofLines } from '../hooks/useRoofMaterials';
import { DecimalField } from './DecimalField';

const updateTileSpecificationField =
  (fieldName: keyof TileSpecification) =>
  (fieldValue: number | null): void =>
    useRoofProjectStore.getState().updateTileSpecification({ [fieldName]: fieldValue });

const updateTilesPerSquareMeter = updateTileSpecificationField('tilesPerSquareMeter');
const updateRidgeTilesPerLinearMeter = updateTileSpecificationField('ridgeTilesPerLinearMeter');
const updateWastePercent = updateTileSpecificationField('wastePercent');

const updateBattenGauge = (battenGaugeInMeters: number | null) => {
  if (battenGaugeInMeters === null) {
    return;
  }

  useRoofProjectStore.getState().updateProjectSettings({ battenGaugeInMeters });
};

type ResultRowProps = {
  label: string;
  value: string;
};

const ResultRow = ({ label, value }: ResultRowProps) => (
  <div className="planes-panel__row">
    <span>{label}</span>
    <span className="planes-panel__row-value">{value}</span>
  </div>
);

const describePieceCount = (pieceCount: number | null, unitLabel: string): string =>
  pieceCount === null ? 'informe os dados' : `${pieceCount} ${unitLabel}`;

export const TilePanel = () => {
  const tileSpecification = useRoofProjectStore((state) => state.tileSpecification);
  const battenGaugeInMeters = useRoofProjectStore((state) => state.projectSettings.battenGaugeInMeters);
  const roofPlanes = useResolvedRoofPlanes();
  const footprintsByPlaneId = useRoofFootprints();
  const roofLineTotals = totalRoofLineLengths(useRoofLines());
  const { realAreaInSquareMeters } = summarizeRoof(roofPlanes, footprintsByPlaneId);
  const cappedLineLengthInMeters = roofLineTotals.ridge + roofLineTotals.hip;
  const tileEstimate = estimateTiles(realAreaInSquareMeters, cappedLineLengthInMeters, tileSpecification);

  return (
    <section className="planes-panel__section">
      <h2 className="planes-panel__title">Telha</h2>
      <p className="planes-panel__hint">Dados do fabricante da telha usada neste orçamento.</p>
      <DecimalField
        inputId="batten-gauge-input"
        label="Galga (m)"
        value={battenGaugeInMeters}
        placeholder="ex.: 0,36"
        acceptsEmptyValue={false}
        parseValue={parseLengthInMeters}
        onValueChange={updateBattenGauge}
      />
      <DecimalField
        inputId="tiles-per-square-meter-input"
        label="Telhas por m²"
        value={tileSpecification.tilesPerSquareMeter}
        placeholder="fabricante"
        acceptsEmptyValue
        parseValue={parsePositiveNumber}
        onValueChange={updateTilesPerSquareMeter}
      />
      <DecimalField
        inputId="ridge-tiles-per-meter-input"
        label="Cumeeiras por metro"
        value={tileSpecification.ridgeTilesPerLinearMeter}
        placeholder="fabricante"
        acceptsEmptyValue
        parseValue={parsePositiveNumber}
        onValueChange={updateRidgeTilesPerLinearMeter}
      />
      <DecimalField
        inputId="tile-waste-input"
        label="Perda (%)"
        value={tileSpecification.wastePercent}
        placeholder="ex.: 5"
        acceptsEmptyValue
        parseValue={parseNonNegativeNumber}
        onValueChange={updateWastePercent}
      />
      <div className="planes-panel__row planes-panel__row--total">
        <span>Telhas</span>
        <span className="planes-panel__row-value">{describePieceCount(tileEstimate.roofTileCount, 'peças')}</span>
      </div>
      <ResultRow label="Cumeeiras" value={describePieceCount(tileEstimate.ridgeTileCount, 'peças')} />
      <ResultRow label="Área coberta (real)" value={formatSquareMeters(realAreaInSquareMeters)} />
      <ResultRow label="Cumeeira + espigões" value={formatMeters(cappedLineLengthInMeters)} />
      <p className="planes-panel__hint">A perda vale para telhas e cumeeiras. Valores arredondados para cima.</p>
    </section>
  );
};

