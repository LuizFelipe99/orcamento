import { Line } from 'react-konva';
import { listSegments } from '../../geometry/planMeasurements';
import { useRoofProjectStore } from '../../store/roofProjectStore';
import { flattenPlanPoints } from './flattenPlanPoints';
import { SegmentLengthLabel } from './SegmentLengthLabel';

const BASE_OUTLINE_STROKE_COLOR = '#2b2b2b';
const BASE_OUTLINE_STROKE_WIDTH_IN_PIXELS = 2.5;

type BaseOutlineProps = {
  metersPerPixel: number;
};

export const BaseOutline = ({ metersPerPixel }: BaseOutlineProps) => {
  const baseOutline = useRoofProjectStore((state) => state.baseOutline);

  if (!baseOutline) {
    return null;
  }

  return (
    <>
      <Line
        points={flattenPlanPoints(baseOutline)}
        closed
        stroke={BASE_OUTLINE_STROKE_COLOR}
        strokeWidth={BASE_OUTLINE_STROKE_WIDTH_IN_PIXELS}
        strokeScaleEnabled={false}
      />
      {listSegments(baseOutline, true).map((segment, segmentIndex) => (
        <SegmentLengthLabel key={`base-segment-${segmentIndex}`} segment={segment} metersPerPixel={metersPerPixel} />
      ))}
    </>
  );
};
