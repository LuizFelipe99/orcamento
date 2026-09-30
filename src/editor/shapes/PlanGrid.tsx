import { Line } from 'react-konva';
import { isMultipleOf, listGridCoordinates, selectGridSpacing } from '../../geometry/gridSpacing';
import { screenToPlan, type ViewportTransform } from '../../geometry/viewportTransform';
import { MINIMUM_GRID_STEP_IN_PIXELS } from '../editorSettings';
import type { ViewportSize } from '../hooks/useViewportSize';

const MINOR_LINE_COLOR = '#e6e3da';
const MAJOR_LINE_COLOR = '#ccc8ba';
const AXIS_LINE_COLOR = '#9e9886';
const AXIS_TOLERANCE = 1e-9;

type PlanGridProps = {
  viewportSize: ViewportSize;
  viewportTransform: ViewportTransform;
};

const resolveGridLineColor = (coordinateInMeters: number, majorStepInMeters: number): string => {
  if (Math.abs(coordinateInMeters) < AXIS_TOLERANCE) {
    return AXIS_LINE_COLOR;
  }

  if (isMultipleOf(coordinateInMeters, majorStepInMeters)) {
    return MAJOR_LINE_COLOR;
  }

  return MINOR_LINE_COLOR;
};

export const PlanGrid = ({ viewportSize, viewportTransform }: PlanGridProps) => {
  const visibleTopLeft = screenToPlan({ x: 0, y: 0 }, viewportTransform);
  const visibleBottomRight = screenToPlan({ x: viewportSize.width, y: viewportSize.height }, viewportTransform);
  const { minorStepInMeters, majorStepInMeters } = selectGridSpacing(
    viewportTransform.pixelsPerMeter,
    MINIMUM_GRID_STEP_IN_PIXELS,
  );

  const verticalLineCoordinates = listGridCoordinates(visibleTopLeft.x, visibleBottomRight.x, minorStepInMeters);
  const horizontalLineCoordinates = listGridCoordinates(visibleTopLeft.y, visibleBottomRight.y, minorStepInMeters);

  return (
    <>
      {verticalLineCoordinates.map((coordinateX) => (
        <Line
          key={`vertical-${coordinateX}`}
          points={[coordinateX, visibleTopLeft.y, coordinateX, visibleBottomRight.y]}
          stroke={resolveGridLineColor(coordinateX, majorStepInMeters)}
          strokeWidth={1}
          strokeScaleEnabled={false}
          perfectDrawEnabled={false}
        />
      ))}
      {horizontalLineCoordinates.map((coordinateY) => (
        <Line
          key={`horizontal-${coordinateY}`}
          points={[visibleTopLeft.x, coordinateY, visibleBottomRight.x, coordinateY]}
          stroke={resolveGridLineColor(coordinateY, majorStepInMeters)}
          strokeWidth={1}
          strokeScaleEnabled={false}
          perfectDrawEnabled={false}
        />
      ))}
    </>
  );
};
