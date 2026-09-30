import { useMemo } from 'react';
import { Circle, Group, Label, Tag, Text } from 'react-konva';
import { formatMeters } from '../../formatting/measurementFormatters';
import { summarizeVertexHeights, type VertexHeightSummary } from '../../geometry/vertexHeights';
import { useResolvedRoofPlanes } from '../hooks/useRoofMaterials';

const CONSISTENT_COLOR = '#1b5e20';
const INCONSISTENT_COLOR = '#d93025';
const LABEL_BACKGROUND_COLOR = 'rgba(255, 255, 255, 0.88)';
const LABEL_FONT_SIZE_IN_PIXELS = 12;
const LABEL_OFFSET_IN_PIXELS = 7;
const LABEL_PADDING_IN_PIXELS = 3;
const LABEL_CORNER_RADIUS_IN_PIXELS = 3;
const MARKER_RADIUS_IN_PIXELS = 4;

type VertexHeightLabelsProps = {
  metersPerPixel: number;
};

const formatHeightLabel = ({ minimumHeightInMeters, maximumHeightInMeters, isConsistent }: VertexHeightSummary): string => {
  if (isConsistent) {
    return `h ${formatMeters(maximumHeightInMeters)}`;
  }

  return `h ${formatMeters(minimumHeightInMeters)} ≠ ${formatMeters(maximumHeightInMeters)}`;
};

export const VertexHeightLabels = ({ metersPerPixel }: VertexHeightLabelsProps) => {
  const roofPlanes = useResolvedRoofPlanes();
  const vertexHeightSummaries = useMemo(() => summarizeVertexHeights(roofPlanes), [roofPlanes]);

  return (
    <>
      {vertexHeightSummaries.map((vertexHeightSummary, summaryIndex) => {
        const labelColor = vertexHeightSummary.isConsistent ? CONSISTENT_COLOR : INCONSISTENT_COLOR;

        return (
          <Group key={`vertex-height-${summaryIndex}`} x={vertexHeightSummary.point.x} y={vertexHeightSummary.point.y}>
            <Circle radius={MARKER_RADIUS_IN_PIXELS * metersPerPixel} fill={labelColor} />
            <Label
              x={LABEL_OFFSET_IN_PIXELS * metersPerPixel}
              y={LABEL_OFFSET_IN_PIXELS * metersPerPixel}
              scaleX={metersPerPixel}
              scaleY={metersPerPixel}
            >
              <Tag fill={LABEL_BACKGROUND_COLOR} cornerRadius={LABEL_CORNER_RADIUS_IN_PIXELS} />
              <Text
                text={formatHeightLabel(vertexHeightSummary)}
                padding={LABEL_PADDING_IN_PIXELS}
                fontSize={LABEL_FONT_SIZE_IN_PIXELS}
                fontStyle="bold"
                fill={labelColor}
              />
            </Label>
          </Group>
        );
      })}
    </>
  );
};
