import { Line } from 'react-konva';
import { listPolygonEdges } from '../../geometry/planMeasurements';
import { useRoofProjectStore } from '../../store/roofProjectStore';
import { useRoofFootprints } from '../hooks/useRoofMaterials';
import { useRoofValidationIssues } from '../hooks/useRoofValidationIssues';
import { useRoofPlanePresentations } from '../presentation/roofPlanePresentation';
import { flattenPlanPoints } from './flattenPlanPoints';
import { Battens } from './Battens';
import { Rafters } from './Rafters';
import { RoofPlaneShape } from './RoofPlaneShape';

const SELECTED_OUTLINE_COLOR = '#1f6feb';
const SELECTED_OUTLINE_WIDTH_IN_PIXELS = 3;
const MISMATCH_EDGE_COLOR = '#d93025';
const MISMATCH_EDGE_WIDTH_IN_PIXELS = 4;
const MISMATCH_DASH_PATTERN_IN_PIXELS = [10, 6];

type RoofPlanesProps = {
  metersPerPixel: number;
};

export const RoofPlanes = ({ metersPerPixel }: RoofPlanesProps) => {
  const presentations = useRoofPlanePresentations();
  const selectedRoofPlaneId = useRoofProjectStore((state) => state.selectedRoofPlaneId);
  const footprintsByPlaneId = useRoofFootprints();
  const validationIssues = useRoofValidationIssues();
  const selectedFootprint = selectedRoofPlaneId ? footprintsByPlaneId.get(selectedRoofPlaneId) : undefined;

  const mismatchedEdges = validationIssues.flatMap((validationIssue) =>
    validationIssue.kind === 'sharedEdgeHeightMismatch' ? [validationIssue.sharedEdge] : [],
  );

  return (
    <>
      {presentations.map((presentation) => (
        <RoofPlaneShape
          key={presentation.roofPlane.id}
          presentation={presentation}
          footprint={footprintsByPlaneId.get(presentation.roofPlane.id) ?? presentation.roofPlane.outline}
          isSelected={presentation.roofPlane.id === selectedRoofPlaneId}
          metersPerPixel={metersPerPixel}
        />
      ))}
      <Rafters />
      <Battens />
      {selectedFootprint &&
        listPolygonEdges(selectedFootprint).map((edge, edgeIndex) => (
          <Line
            key={`selected-edge-${edgeIndex}`}
            points={flattenPlanPoints([edge.start, edge.end])}
            stroke={SELECTED_OUTLINE_COLOR}
            strokeWidth={SELECTED_OUTLINE_WIDTH_IN_PIXELS}
            strokeScaleEnabled={false}
          />
        ))}
      {mismatchedEdges.map((mismatchedEdge, edgeIndex) => (
        <Line
          key={`mismatched-edge-${edgeIndex}`}
          points={flattenPlanPoints([mismatchedEdge.start, mismatchedEdge.end])}
          stroke={MISMATCH_EDGE_COLOR}
          strokeWidth={MISMATCH_EDGE_WIDTH_IN_PIXELS}
          strokeScaleEnabled={false}
          dash={MISMATCH_DASH_PATTERN_IN_PIXELS}
        />
      ))}
    </>
  );
};
