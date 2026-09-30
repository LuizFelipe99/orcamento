import { describe, expect, it } from 'vitest';
import type { PlanPoint } from '../domain/points';
import type { ConfiguredRoofPlane, RoofPlane } from '../domain/roofPlane';
import { polygonArea } from './planMeasurements';
import { listEvenlySpacedOffsets } from './parallelMemberLayout';
import { layoutPlaneRafters, roundUpRafterLength, summarizeRafters } from './rafterLayout';
import { computeRoofFootprints, computeRoofPlaneFootprint, offsetPolygonOutline } from './roofFootprint';
import { summarizeRoof } from './roofSummary';

const rectangleBase: PlanPoint[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 6 },
  { x: 0, y: 6 },
];

const topHalfPlane: ConfiguredRoofPlane = {
  id: 'top',
  outline: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 3 },
    { x: 0, y: 3 },
  ],
  eave: { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } },
  slopePercent: 30,
};

const bottomHalfPlane: ConfiguredRoofPlane = {
  id: 'bottom',
  outline: [
    { x: 10, y: 3 },
    { x: 10, y: 6 },
    { x: 0, y: 6 },
    { x: 0, y: 3 },
  ],
  eave: { start: { x: 10, y: 6 }, end: { x: 0, y: 6 } },
  slopePercent: 30,
};

const expectOutlineCloseTo = (actualOutline: PlanPoint[], expectedOutline: PlanPoint[]) => {
  expect(actualOutline).toHaveLength(expectedOutline.length);
  actualOutline.forEach((actualPoint, pointIndex) => {
    expect(actualPoint.x).toBeCloseTo(expectedOutline[pointIndex].x);
    expect(actualPoint.y).toBeCloseTo(expectedOutline[pointIndex].y);
  });
};

describe('offsetPolygonOutline', () => {
  it('expande o retângulo para fora, independente do sentido do desenho', () => {
    const expectedOutline = [
      { x: -0.5, y: -0.5 },
      { x: 10.5, y: -0.5 },
      { x: 10.5, y: 6.5 },
      { x: -0.5, y: 6.5 },
    ];

    expectOutlineCloseTo(offsetPolygonOutline(rectangleBase, 0.5), expectedOutline);
    expectOutlineCloseTo(offsetPolygonOutline([...rectangleBase].reverse(), 0.5), [...expectedOutline].reverse());
  });

  it('não altera o contorno sem beiral', () => {
    expect(offsetPolygonOutline(rectangleBase, 0)).toBe(rectangleBase);
  });
});

describe('computeRoofPlaneFootprint', () => {
  it('estende a água até o beiral e prolonga a cumeeira além do oitão', () => {
    const footprint = computeRoofPlaneFootprint(topHalfPlane.outline, rectangleBase, 0.5);

    expectOutlineCloseTo(footprint, [
      { x: -0.5, y: -0.5 },
      { x: 10.5, y: -0.5 },
      { x: 10.5, y: 3 },
      { x: -0.5, y: 3 },
    ]);
  });

  it('prolonga o espigão até o canto do beiral', () => {
    const hipTriangle = [
      { x: 0, y: 0 },
      { x: 3, y: 3 },
      { x: 0, y: 6 },
    ];

    expectOutlineCloseTo(computeRoofPlaneFootprint(hipTriangle, rectangleBase, 0.5), [
      { x: -0.5, y: -0.5 },
      { x: 3, y: 3 },
      { x: -0.5, y: 6.5 },
    ]);
  });

  it('a soma das águas cobre a base inteira com o beiral', () => {
    const footprints = computeRoofFootprints([topHalfPlane, bottomHalfPlane], rectangleBase, 0.5);
    const coveredArea = [...footprints.values()].reduce((totalArea, footprint) => totalArea + polygonArea(footprint), 0);

    expect(coveredArea).toBeCloseTo(11 * 7);
  });
});

describe('listEvenlySpacedOffsets', () => {
  it('distribui no espaçamento e fecha com um caibro na ponta', () => {
    expect(listEvenlySpacedOffsets(0, 1.2, 0.5)).toEqual([0, 0.5, 1, 1.2]);
  });

  it('não duplica a ponta quando o espaçamento fecha exato', () => {
    expect(listEvenlySpacedOffsets(0, 1, 0.5)).toEqual([0, 0.5, 1]);
  });
});

describe('layoutPlaneRafters', () => {
  it('gera caibros de comprimento real em um telhado de duas águas com beiral', () => {
    const footprint = computeRoofPlaneFootprint(topHalfPlane.outline, rectangleBase, 0.5);
    const rafters = layoutPlaneRafters(topHalfPlane, footprint, 0.5);
    const expectedRealLength = 3.5 * Math.sqrt(1 + 0.3 ** 2);

    expect(rafters).toHaveLength(23);
    rafters.forEach((rafter) => {
      expect(rafter.planLengthInMeters).toBeCloseTo(3.5);
      expect(rafter.realLengthInMeters).toBeCloseTo(expectedRealLength);
    });
  });

  it('corta os caibros no espigão, gerando comprimentos decrescentes', () => {
    const hipTrianglePlane: ConfiguredRoofPlane = {
      id: 'hip',
      outline: [
        { x: 0, y: 0 },
        { x: 3, y: 3 },
        { x: 0, y: 6 },
      ],
      eave: { start: { x: 0, y: 6 }, end: { x: 0, y: 0 } },
      slopePercent: 30,
    };
    const rafters = layoutPlaneRafters(hipTrianglePlane, hipTrianglePlane.outline, 0.5);
    const planLengths = rafters.map(({ planLengthInMeters }) => planLengthInMeters);

    expect(Math.max(...planLengths)).toBeCloseTo(3);
    expect(new Set(planLengths.map((length) => length.toFixed(2))).size).toBeGreaterThan(3);
  });
});

describe('summarizeRafters', () => {
  it('arredonda para cima em 10 cm e agrupa por comprimento', () => {
    expect(roundUpRafterLength(3.61)).toBe(3.7);
    expect(roundUpRafterLength(3.7)).toBe(3.7);

    const footprint = computeRoofPlaneFootprint(topHalfPlane.outline, rectangleBase, 0.5);
    const rafterSummary = summarizeRafters(layoutPlaneRafters(topHalfPlane, footprint, 0.5));

    expect(rafterSummary.lengthGroups).toEqual([{ lengthInMeters: 3.7, quantity: 23 }]);
    expect(rafterSummary.rafterCount).toBe(23);
  });
});

describe('summarizeRoof com beiral', () => {
  it('usa a área coberta pelo telhado, incluindo o beiral', () => {
    const roofPlanes: RoofPlane[] = [topHalfPlane, bottomHalfPlane];
    const footprints = computeRoofFootprints(roofPlanes, rectangleBase, 0.5);
    const roofSummary = summarizeRoof(roofPlanes, footprints);

    expect(roofSummary.planAreaInSquareMeters).toBeCloseTo(77);
    expect(roofSummary.realAreaInSquareMeters).toBeCloseTo(77 * Math.sqrt(1.09));
  });
});
