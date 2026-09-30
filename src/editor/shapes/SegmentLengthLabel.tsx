import { Text } from 'react-konva';
import type { PlanSegment } from '../../domain/points';
import { formatMeters } from '../../formatting/measurementFormatters';
import { distanceBetween, midpointBetween } from '../../geometry/planMeasurements';
import { LABEL_FONT_SIZE_IN_PIXELS } from '../editorSettings';

const LABEL_COLOR = '#333';
const LABEL_OFFSET_X_IN_PIXELS = -6;
const LABEL_OFFSET_Y_IN_PIXELS = 18;

type SegmentLengthLabelProps = {
  segment: PlanSegment;
  metersPerPixel: number;
  text?: string;
};

export const SegmentLengthLabel = ({ segment, metersPerPixel, text }: SegmentLengthLabelProps) => {
  const segmentMidpoint = midpointBetween(segment.start, segment.end);
  const segmentLength = distanceBetween(segment.start, segment.end);

  return (
    <Text
      x={segmentMidpoint.x}
      y={segmentMidpoint.y}
      text={text ?? formatMeters(segmentLength)}
      fontSize={LABEL_FONT_SIZE_IN_PIXELS}
      fontStyle="bold"
      fill={LABEL_COLOR}
      scaleX={metersPerPixel}
      scaleY={metersPerPixel}
      offsetX={LABEL_OFFSET_X_IN_PIXELS}
      offsetY={LABEL_OFFSET_Y_IN_PIXELS}
    />
  );
};
