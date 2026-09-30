import { describe, expect, it } from 'vitest';
import type { PlanPoint } from '../domain/points';
import type { RoofPlane } from '../domain/roofPlane';
import { computeRoofFootprints, offsetPolygonOutline } from './roofFootprint';
import { listRoofLines, totalRoofLineLengths } from './roofLines';

const rectangleBase: PlanPoint[] = [
  { x: 0, y: 0 },
  { x: 15, y: 0 },
  { x: 15, y: 10 },
  { x: 0, y: 10 },
];

const buildHipRoof = (): RoofPlane[] => {
  const [topLeft, topRight, bottomRight, bottomLeft] = rectangleBase;
  const leftRidgeEnd = { x: 5, y: 5 };
  const rightRidgeEnd = { x: 10, y: 5 };

  return [
    { id: 'left', outline: [bottomLeft, topLeft, leftRidgeEnd], eave: { start: bottomLeft, end: topLeft }, slopePercent: 30 },
    {
      id: 'top',
      outline: [topLeft, topRight, rightRidgeEnd, leftRidgeEnd],
      eave: { start: topLeft, end: topRight },
      slopePercent: 30,
    },
    { id: 'right', outline: [topRight, bottomRight, rightRidgeEnd], eave: { start: topRight, end: bottomRight }, slopePercent: 30 },
    {
      id: 'bottom',
      outline: [bottomRight, bottomLeft, leftRidgeEnd, rightRidgeEnd],
      eave: { start: bottomRight, end: bottomLeft },
      slopePercent: 30,
    },
  ];
};

describe('listRoofLines', () => {
  it('mede cumeeira e espigões em 3D, sem beiral', () => {
    const roofPlanes = buildHipRoof();
    const lineTotals = totalRoofLineLengths(listRoofLines(roofPlanes, new Map(), rectangleBase));
    const singleHipLength = Math.hypot(Math.hypot(5, 5), 1.5);

    expect(lineTotals.ridge).toBeCloseTo(5);
    expect(lineTotals.hip).toBeCloseTo(4 * singleHipLength);
    expect(lineTotals.valley).toBe(0);
  });

  it('prolonga os espigões até o canto do beiral', () => {
    const roofPlanes = buildHipRoof();
    const footprints = computeRoofFootprints(roofPlanes, rectangleBase, 0.5);
    const roofOutline = offsetPolygonOutline(rectangleBase, 0.5);
    const lineTotals = totalRoofLineLengths(listRoofLines(roofPlanes, footprints, roofOutline));
    const singleHipLength = Math.hypot(Math.hypot(5.5, 5.5), 1.5 + 0.15);

    expect(lineTotals.ridge).toBeCloseTo(5);
    expect(lineTotals.hip).toBeCloseTo(4 * singleHipLength);
  });
});
