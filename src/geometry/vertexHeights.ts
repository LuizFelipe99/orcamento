import type { PlanPoint } from '../domain/points';
import { isConfiguredRoofPlane, type RoofPlane } from '../domain/roofPlane';
import { HEIGHT_TOLERANCE_IN_METERS } from './numericPrecision';
import { arePointsCoincident } from './planMeasurements';
import { heightAtPoint } from './roofPlaneGeometry';

export type VertexHeightSummary = {
  point: PlanPoint;
  minimumHeightInMeters: number;
  maximumHeightInMeters: number;
  isConsistent: boolean;
};

type VertexHeightGroup = {
  point: PlanPoint;
  heightsInMeters: number[];
};

const groupHeightsByVertex = (heightSamples: VertexHeightGroup[]): VertexHeightGroup[] =>
  heightSamples.reduce<VertexHeightGroup[]>((vertexGroups, heightSample) => {
    const matchingGroup = vertexGroups.find((vertexGroup) => arePointsCoincident(vertexGroup.point, heightSample.point));

    if (!matchingGroup) {
      return [...vertexGroups, heightSample];
    }

    return vertexGroups.map((vertexGroup) =>
      vertexGroup === matchingGroup
        ? { ...vertexGroup, heightsInMeters: [...vertexGroup.heightsInMeters, ...heightSample.heightsInMeters] }
        : vertexGroup,
    );
  }, []);

export const summarizeVertexHeights = (roofPlanes: RoofPlane[]): VertexHeightSummary[] => {
  const heightSamples = roofPlanes
    .filter(isConfiguredRoofPlane)
    .flatMap((roofPlane) =>
      roofPlane.outline.map((vertex) => ({ point: vertex, heightsInMeters: [heightAtPoint(roofPlane, vertex)] })),
    );

  return groupHeightsByVertex(heightSamples)
    .map(({ point, heightsInMeters }) => {
      const minimumHeightInMeters = Math.min(...heightsInMeters);
      const maximumHeightInMeters = Math.max(...heightsInMeters);

      return {
        point,
        minimumHeightInMeters,
        maximumHeightInMeters,
        isConsistent: maximumHeightInMeters - minimumHeightInMeters <= HEIGHT_TOLERANCE_IN_METERS,
      };
    })
    .filter(({ maximumHeightInMeters }) => maximumHeightInMeters > HEIGHT_TOLERANCE_IN_METERS);
};
