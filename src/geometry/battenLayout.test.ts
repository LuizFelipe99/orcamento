import { describe, expect, it } from 'vitest';
import type { PlanPoint } from '../domain/points';
import type { ConfiguredRoofPlane } from '../domain/roofPlane';
import { layoutPlaneBattens, planSpacingFromGauge, summarizeBattens } from './battenLayout';
import { computeRoofPlaneFootprint } from './roofFootprint';

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

describe('planSpacingFromGauge', () => {
  it('converte a galga medida na inclinação para o espaçamento em planta', () => {
    expect(planSpacingFromGauge(0.36, 30)).toBeCloseTo(0.36 / Math.sqrt(1.09));
  });

  it('mantém a galga em telhado plano', () => {
    expect(planSpacingFromGauge(0.36, 0)).toBeCloseTo(0.36);
  });
});

describe('layoutPlaneBattens', () => {
  it('gera fiadas paralelas ao beiral, do beiral até a cumeeira', () => {
    const footprint = computeRoofPlaneFootprint(topHalfPlane.outline, rectangleBase, 0.5);
    const battens = layoutPlaneBattens(topHalfPlane, footprint, 0.36);

    expect(battens).toHaveLength(12);
    battens.forEach((batten) => {
      expect(batten.lengthInMeters).toBeCloseTo(11);
      expect(batten.segment.start.y).toBeCloseTo(batten.segment.end.y);
    });
    expect(Math.min(...battens.map(({ segment }) => segment.start.y))).toBeCloseTo(-0.5);
  });

  it('mantém a galga real entre fiadas vizinhas', () => {
    const battens = layoutPlaneBattens(topHalfPlane, topHalfPlane.outline, 0.36);
    const [firstBatten, secondBatten] = battens;
    const planDistance = Math.abs(secondBatten.segment.start.y - firstBatten.segment.start.y);

    expect(planDistance * Math.sqrt(1.09)).toBeCloseTo(0.36);
  });

  it('encurta as fiadas em direção ao espigão', () => {
    const battens = layoutPlaneBattens(hipTrianglePlane, hipTrianglePlane.outline, 0.36);
    const lengths = battens.map(({ lengthInMeters }) => lengthInMeters);

    expect(lengths[0]).toBeCloseTo(6);
    expect(lengths.every((length, lengthIndex) => lengthIndex === 0 || length < lengths[lengthIndex - 1])).toBe(true);
  });
});

describe('summarizeBattens', () => {
  it('soma os metros lineares de ripa', () => {
    const footprint = computeRoofPlaneFootprint(topHalfPlane.outline, rectangleBase, 0.5);
    const battenSummary = summarizeBattens(layoutPlaneBattens(topHalfPlane, footprint, 0.36));

    expect(battenSummary.battenRowCount).toBe(12);
    expect(battenSummary.totalLengthInMeters).toBeCloseTo(132);
  });
});
