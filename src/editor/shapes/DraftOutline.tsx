import { Circle, Line } from 'react-konva';
import { listSegments } from '../../geometry/planMeasurements';
import { useDraftingInputStore } from '../../store/draftingInputStore';
import { useDraftStore } from '../../store/draftStore';
import { resolvePreviewEndpoint, useCurrentDraftTarget } from '../drafting/currentDraftTarget';
import { OUTLINE_STROKE_WIDTH_IN_PIXELS, VERTEX_RADIUS_IN_PIXELS } from '../editorSettings';
import { flattenPlanPoints } from './flattenPlanPoints';
import { SegmentLengthLabel } from './SegmentLengthLabel';

const DRAFT_STROKE_COLOR = '#c46a2b';
const SNAP_HIGHLIGHT_COLOR = '#2b8a3e';
const PREVIEW_DASH_PATTERN_IN_PIXELS = [8, 6];
const SNAP_HIGHLIGHT_RADIUS_MULTIPLIER = 2.5;

type DraftOutlineProps = {
  metersPerPixel: number;
};

export const DraftOutline = ({ metersPerPixel }: DraftOutlineProps) => {
  const draftVertices = useDraftStore((state) => state.draftVertices);
  const typedLengthInput = useDraftingInputStore((state) => state.typedLengthInput);
  const draftTarget = useCurrentDraftTarget();
  const lastDraftVertex = draftVertices.at(-1);

  if (!lastDraftVertex) {
    return null;
  }

  const vertexRadiusInMeters = VERTEX_RADIUS_IN_PIXELS * metersPerPixel;
  const previewEndpoint = draftTarget ? resolvePreviewEndpoint(lastDraftVertex, draftTarget, typedLengthInput) : null;
  const previewLabelText = typedLengthInput ? `Medida: ${typedLengthInput} m` : undefined;
  const isSnapHighlightVisible = Boolean(draftTarget && draftTarget.snapKind !== 'free' && !typedLengthInput);

  return (
    <>
      <Line
        points={flattenPlanPoints(draftVertices)}
        stroke={DRAFT_STROKE_COLOR}
        strokeWidth={OUTLINE_STROKE_WIDTH_IN_PIXELS}
        strokeScaleEnabled={false}
      />
      {listSegments(draftVertices, false).map((segment, segmentIndex) => (
        <SegmentLengthLabel key={`draft-segment-${segmentIndex}`} segment={segment} metersPerPixel={metersPerPixel} />
      ))}
      {previewEndpoint && (
        <>
          <Line
            points={flattenPlanPoints([lastDraftVertex, previewEndpoint])}
            stroke={DRAFT_STROKE_COLOR}
            strokeWidth={OUTLINE_STROKE_WIDTH_IN_PIXELS}
            strokeScaleEnabled={false}
            dash={PREVIEW_DASH_PATTERN_IN_PIXELS}
          />
          <SegmentLengthLabel
            segment={{ start: lastDraftVertex, end: previewEndpoint }}
            metersPerPixel={metersPerPixel}
            text={previewLabelText}
          />
        </>
      )}
      {draftVertices.map((vertex, vertexIndex) => (
        <Circle
          key={`draft-vertex-${vertexIndex}`}
          x={vertex.x}
          y={vertex.y}
          radius={vertexRadiusInMeters}
          fill={DRAFT_STROKE_COLOR}
        />
      ))}
      {isSnapHighlightVisible && draftTarget && (
        <Circle
          x={draftTarget.targetPoint.x}
          y={draftTarget.targetPoint.y}
          radius={vertexRadiusInMeters * SNAP_HIGHLIGHT_RADIUS_MULTIPLIER}
          stroke={SNAP_HIGHLIGHT_COLOR}
          strokeWidth={OUTLINE_STROKE_WIDTH_IN_PIXELS}
          strokeScaleEnabled={false}
        />
      )}
    </>
  );
};
