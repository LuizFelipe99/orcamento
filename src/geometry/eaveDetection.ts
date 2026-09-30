import type { PlanPoint, PlanSegment } from '../domain/points';
import { BOUNDARY_TOLERANCE_IN_METERS } from './numericPrecision';
import { listPolygonEdges, segmentLength } from './planMeasurements';
import { isSegmentContainedIn } from './segmentGeometry';
import { dotProduct, normalizeVector, subtractPoints } from './vectorMath';

type EaveCandidate = {
  baseEdge: PlanSegment;
  containedEdges: PlanSegment[];
  totalLengthInMeters: number;
};

type PlaneWithEave = {
  outline: PlanPoint[];
  eave: PlanSegment | null;
};

const spanAlongBaseEdge = (baseEdge: PlanSegment, containedEdges: PlanSegment[]): PlanSegment => {
  const edgeDirection = normalizeVector(subtractPoints(baseEdge.end, baseEdge.start));
  const projectedPoints = containedEdges
    .flatMap((edge) => [edge.start, edge.end])
    .map((point) => ({ point, offset: dotProduct(subtractPoints(point, baseEdge.start), edgeDirection) }))
    .sort((firstPoint, secondPoint) => firstPoint.offset - secondPoint.offset);

  return { start: projectedPoints[0].point, end: projectedPoints[projectedPoints.length - 1].point };
};

export const detectEave = (planeOutline: PlanPoint[], baseOutline: PlanPoint[]): PlanSegment | null => {
  const planeEdges = listPolygonEdges(planeOutline);
  const [bestCandidate] = listPolygonEdges(baseOutline)
    .map((baseEdge): EaveCandidate => {
      const containedEdges = planeEdges.filter((edge) => isSegmentContainedIn(edge, baseEdge, BOUNDARY_TOLERANCE_IN_METERS));
      const totalLengthInMeters = containedEdges.reduce((totalLength, edge) => totalLength + segmentLength(edge), 0);

      return { baseEdge, containedEdges, totalLengthInMeters };
    })
    .filter(({ containedEdges }) => containedEdges.length > 0)
    .sort((firstCandidate, secondCandidate) => secondCandidate.totalLengthInMeters - firstCandidate.totalLengthInMeters);

  if (!bestCandidate) {
    return null;
  }

  return spanAlongBaseEdge(bestCandidate.baseEdge, bestCandidate.containedEdges);
};

export const assignMissingEaves = <Plane extends PlaneWithEave>(planes: Plane[], baseOutline: PlanPoint[]): Plane[] =>
  planes.map((plane) => (plane.eave ? plane : { ...plane, eave: detectEave(plane.outline, baseOutline) }));
