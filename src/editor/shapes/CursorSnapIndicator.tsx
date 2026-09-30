import { Circle } from 'react-konva';
import type { DraftSnapKind } from '../../geometry/outlineDrafting';
import { useDraftStore } from '../../store/draftStore';
import { useCurrentDraftTarget } from '../drafting/currentDraftTarget';
import { VERTEX_RADIUS_IN_PIXELS } from '../editorSettings';

const FREE_INDICATOR_COLOR = '#1f6feb';
const BOUNDARY_INDICATOR_COLOR = '#2b8a3e';
const INDICATOR_STROKE_WIDTH_IN_PIXELS = 1.5;
const INDICATOR_RADIUS_MULTIPLIER = 1.5;

type CursorSnapIndicatorProps = {
  metersPerPixel: number;
};

const resolveIndicatorColor = (snapKind: DraftSnapKind): string =>
  snapKind === 'boundary' ? BOUNDARY_INDICATOR_COLOR : FREE_INDICATOR_COLOR;

export const CursorSnapIndicator = ({ metersPerPixel }: CursorSnapIndicatorProps) => {
  const draftTarget = useCurrentDraftTarget();
  const hasDraftVertices = useDraftStore((state) => state.draftVertices.length > 0);

  if (!draftTarget || draftTarget.snapKind === 'closingVertex') {
    return null;
  }

  const isHighlightedByDraftOutline = hasDraftVertices && draftTarget.snapKind === 'boundary';

  if (isHighlightedByDraftOutline) {
    return null;
  }

  return (
    <Circle
      x={draftTarget.targetPoint.x}
      y={draftTarget.targetPoint.y}
      radius={VERTEX_RADIUS_IN_PIXELS * INDICATOR_RADIUS_MULTIPLIER * metersPerPixel}
      stroke={resolveIndicatorColor(draftTarget.snapKind)}
      strokeWidth={INDICATOR_STROKE_WIDTH_IN_PIXELS}
      strokeScaleEnabled={false}
    />
  );
};
