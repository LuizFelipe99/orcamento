import { Line } from 'react-konva';
import { useLayerVisibilityStore } from '../../store/layerVisibilityStore';
import { useRoofBattens } from '../hooks/useRoofMaterials';
import { flattenPlanPoints } from './flattenPlanPoints';

const BATTEN_COLOR = '#b08968';
const BATTEN_STROKE_WIDTH_IN_PIXELS = 1;
const BATTEN_OPACITY = 0.8;

export const Battens = () => {
  const areBattensVisible = useLayerVisibilityStore((state) => state.areBattensVisible);
  const battensByPlaneId = useRoofBattens();

  if (!areBattensVisible) {
    return null;
  }

  return (
    <>
      {[...battensByPlaneId.entries()].flatMap(([roofPlaneId, planeBattens]) =>
        planeBattens.map((batten, battenIndex) => (
          <Line
            key={`batten-${roofPlaneId}-${battenIndex}`}
            points={flattenPlanPoints([batten.segment.start, batten.segment.end])}
            stroke={BATTEN_COLOR}
            strokeWidth={BATTEN_STROKE_WIDTH_IN_PIXELS}
            strokeScaleEnabled={false}
            opacity={BATTEN_OPACITY}
            perfectDrawEnabled={false}
          />
        )),
      )}
    </>
  );
};
