import type { PlanPoint } from '../../domain/points';

export const flattenPlanPoints = (vertices: PlanPoint[]): number[] =>
  vertices.flatMap((vertex) => [vertex.x, vertex.y]);
