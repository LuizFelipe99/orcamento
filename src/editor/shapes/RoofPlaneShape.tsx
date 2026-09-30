import { Arrow, Group, Line, Text } from 'react-konva';
import type { PlanPoint } from '../../domain/points';
import { isConfiguredRoofPlane } from '../../domain/roofPlane';
import { formatPercent } from '../../formatting/measurementFormatters';
import { listPolygonEdges, polygonCentroid } from '../../geometry/planMeasurements';
import { downhillDirection, isEdgeOnEave } from '../../geometry/roofPlaneGeometry';
import { translatePoint } from '../../geometry/vectorMath';
import { LABEL_FONT_SIZE_IN_PIXELS } from '../editorSettings';
import type { RoofPlanePresentation } from '../presentation/roofPlanePresentation';
import { flattenPlanPoints } from './flattenPlanPoints';

const PLANE_FILL_OPACITY = 0.45;
const SELECTED_PLANE_FILL_OPACITY = 0.7;
const PLANE_STROKE_COLOR = '#5b564a';
const PLANE_STROKE_WIDTH_IN_PIXELS = 1.5;
const EAVE_STROKE_COLOR = '#0b7285';
const EAVE_STROKE_WIDTH_IN_PIXELS = 5;
const LABEL_COLOR = '#2b2b2b';
const LABEL_BOX_WIDTH_IN_PIXELS = 90;
const LABEL_LINE_HEIGHT = 1.3;
const ARROW_LENGTH_IN_PIXELS = 34;
const ARROW_OFFSET_IN_PIXELS = 26;
const ARROW_POINTER_SIZE_IN_PIXELS = 8;
const ARROW_STROKE_WIDTH_IN_PIXELS = 2;

type RoofPlaneShapeProps = {
  presentation: RoofPlanePresentation;
  footprint: PlanPoint[];
  isSelected: boolean;
  metersPerPixel: number;
};

type DownhillArrowProps = {
  presentation: RoofPlanePresentation;
  footprint: PlanPoint[];
  metersPerPixel: number;
};

const buildPlaneLabelText = (label: string, slopePercent: number | null): string => {
  if (slopePercent === null) {
    return `${label}\n—`;
  }

  return `${label}\n${formatPercent(slopePercent)}`;
};

const DownhillArrow = ({ presentation, footprint, metersPerPixel }: DownhillArrowProps) => {
  const { roofPlane } = presentation;

  if (!isConfiguredRoofPlane(roofPlane)) {
    return null;
  }

  const direction = downhillDirection(roofPlane);
  const arrowStart = translatePoint(polygonCentroid(footprint), direction, ARROW_OFFSET_IN_PIXELS * metersPerPixel);
  const arrowEnd = translatePoint(arrowStart, direction, ARROW_LENGTH_IN_PIXELS * metersPerPixel);

  return (
    <Arrow
      points={flattenPlanPoints([arrowStart, arrowEnd])}
      stroke={LABEL_COLOR}
      fill={LABEL_COLOR}
      strokeWidth={ARROW_STROKE_WIDTH_IN_PIXELS}
      strokeScaleEnabled={false}
      pointerLength={ARROW_POINTER_SIZE_IN_PIXELS * metersPerPixel}
      pointerWidth={ARROW_POINTER_SIZE_IN_PIXELS * metersPerPixel}
    />
  );
};

export const RoofPlaneShape = ({ presentation, footprint, isSelected, metersPerPixel }: RoofPlaneShapeProps) => {
  const { roofPlane, label, color } = presentation;
  const planeCentroid = polygonCentroid(footprint);
  const eave = roofPlane.eave;
  const eaveEdges = eave ? listPolygonEdges(roofPlane.outline).filter((edge) => isEdgeOnEave(edge, eave)) : [];

  return (
    <Group>
      <Line
        points={flattenPlanPoints(footprint)}
        closed
        fill={color}
        opacity={isSelected ? SELECTED_PLANE_FILL_OPACITY : PLANE_FILL_OPACITY}
        stroke={PLANE_STROKE_COLOR}
        strokeWidth={PLANE_STROKE_WIDTH_IN_PIXELS}
        strokeScaleEnabled={false}
      />
      {eaveEdges.map((eaveEdge, edgeIndex) => (
        <Line
          key={`eave-edge-${edgeIndex}`}
          points={flattenPlanPoints([eaveEdge.start, eaveEdge.end])}
          stroke={EAVE_STROKE_COLOR}
          strokeWidth={EAVE_STROKE_WIDTH_IN_PIXELS}
          strokeScaleEnabled={false}
          lineCap="round"
        />
      ))}
      <Text
        x={planeCentroid.x}
        y={planeCentroid.y}
        text={buildPlaneLabelText(label, roofPlane.slopePercent)}
        width={LABEL_BOX_WIDTH_IN_PIXELS}
        offsetX={LABEL_BOX_WIDTH_IN_PIXELS / 2}
        offsetY={LABEL_FONT_SIZE_IN_PIXELS * LABEL_LINE_HEIGHT}
        align="center"
        lineHeight={LABEL_LINE_HEIGHT}
        fontSize={LABEL_FONT_SIZE_IN_PIXELS}
        fontStyle="bold"
        fill={LABEL_COLOR}
        scaleX={metersPerPixel}
        scaleY={metersPerPixel}
      />
      <DownhillArrow presentation={presentation} footprint={footprint} metersPerPixel={metersPerPixel} />
    </Group>
  );
};
