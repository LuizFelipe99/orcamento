import { Line } from 'react-konva';
import { useLayerVisibilityStore } from '../../store/layerVisibilityStore';
import { useRoofRafters } from '../hooks/useRoofMaterials';
import { flattenPlanPoints } from './flattenPlanPoints';

const RAFTER_COLOR = '#8d5524';
const RAFTER_STROKE_WIDTH_IN_PIXELS = 1.5;
const RAFTER_OPACITY = 0.85;

export const Rafters = () => {
  const areRaftersVisible = useLayerVisibilityStore((state) => state.areRaftersVisible);
  const raftersByPlaneId = useRoofRafters();

  if (!areRaftersVisible) {
    return null;
  }

  return (
    <>
      {[...raftersByPlaneId.entries()].flatMap(([roofPlaneId, planeRafters]) =>
        planeRafters.map((rafter, rafterIndex) => (
          <Line
            key={`rafter-${roofPlaneId}-${rafterIndex}`}
            points={flattenPlanPoints([rafter.segment.start, rafter.segment.end])}
            stroke={RAFTER_COLOR}
            strokeWidth={RAFTER_STROKE_WIDTH_IN_PIXELS}
            strokeScaleEnabled={false}
            opacity={RAFTER_OPACITY}
            perfectDrawEnabled={false}
          />
        )),
      )}
    </>
  );
};
