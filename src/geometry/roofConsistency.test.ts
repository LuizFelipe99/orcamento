import { describe, expect, it } from 'vitest';
import type { PlanPoint } from '../domain/points';
import type { ConfiguredRoofPlane, RoofPlane } from '../domain/roofPlane';
import { validateRoofPlanes } from './roofConsistency';
import { heightAtPoint, realSurfaceArea, slopeAngleInDegrees } from './roofPlaneGeometry';
import { summarizeRoof } from './roofSummary';

const topHalfOutline: PlanPoint[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 3 },
  { x: 0, y: 3 },
];

const bottomHalfOutline: PlanPoint[] = [
  { x: 0, y: 3 },
  { x: 10, y: 3 },
  { x: 10, y: 6 },
  { x: 0, y: 6 },
];

const buildConfiguredPlane = (
  id: string,
  outline: PlanPoint[],
  eave: ConfiguredRoofPlane['eave'],
  slopePercent: number,
): ConfiguredRoofPlane => ({ id, outline, eave, slopePercent });

const topEave = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
const bottomEave = { start: { x: 10, y: 6 }, end: { x: 0, y: 6 } };

describe('geometria de uma água', () => {
  it('converte inclinação em ângulo', () => {
    expect(slopeAngleInDegrees(100)).toBeCloseTo(45);
  });

  it('calcula a área real a partir da inclinação', () => {
    expect(realSurfaceArea(topHalfOutline, 30)).toBeCloseTo(30 * Math.sqrt(1.09));
  });

  it('calcula a altura a partir do beiral, independente do sentido do beiral', () => {
    const topPlane = buildConfiguredPlane('top', topHalfOutline, topEave, 30);
    const reversedEavePlane = buildConfiguredPlane(
      'top-reversed',
      topHalfOutline,
      { start: topEave.end, end: topEave.start },
      30,
    );

    expect(heightAtPoint(topPlane, { x: 4, y: 3 })).toBeCloseTo(0.9);
    expect(heightAtPoint(reversedEavePlane, { x: 4, y: 3 })).toBeCloseTo(0.9);
  });
});

describe('validateRoofPlanes', () => {
  it('aceita um telhado de duas águas com a mesma inclinação', () => {
    const roofPlanes = [
      buildConfiguredPlane('top', topHalfOutline, topEave, 30),
      buildConfiguredPlane('bottom', bottomHalfOutline, bottomEave, 30),
    ];

    expect(validateRoofPlanes(roofPlanes, null)).toEqual([]);
  });

  it('acusa cumeeira desalinhada quando as inclinações não fecham', () => {
    const roofPlanes = [
      buildConfiguredPlane('top', topHalfOutline, topEave, 30),
      buildConfiguredPlane('bottom', bottomHalfOutline, bottomEave, 40),
    ];

    const [validationIssue] = validateRoofPlanes(roofPlanes, null);

    expect(validationIssue?.kind).toBe('sharedEdgeHeightMismatch');
    expect(validationIssue?.kind === 'sharedEdgeHeightMismatch' && validationIssue.heightDifferenceInMeters).toBeCloseTo(
      0.3,
    );
  });

  it('acusa beiral escolhido no lado errado', () => {
    const middleEave = { start: { x: 0, y: 1.5 }, end: { x: 10, y: 1.5 } };
    const roofPlanes = [buildConfiguredPlane('top', topHalfOutline, middleEave, 30)];

    expect(validateRoofPlanes(roofPlanes, null)).toEqual([{ kind: 'pointBelowEave', planeId: 'top' }]);
  });

  it('ignora águas ainda não configuradas', () => {
    const pendingPlane: RoofPlane = { id: 'pending', outline: bottomHalfOutline, eave: null, slopePercent: 40 };
    const roofPlanes = [buildConfiguredPlane('top', topHalfOutline, topEave, 30), pendingPlane];

    expect(validateRoofPlanes(roofPlanes, null)).toEqual([]);
  });
});

describe('summarizeRoof', () => {
  it('soma áreas e conta águas pendentes', () => {
    const pendingPlane: RoofPlane = { id: 'pending', outline: bottomHalfOutline, eave: null, slopePercent: null };
    const roofPlanes = [buildConfiguredPlane('top', topHalfOutline, topEave, 30), pendingPlane];
    const roofSummary = summarizeRoof(roofPlanes, new Map());

    expect(roofSummary.planAreaInSquareMeters).toBeCloseTo(60);
    expect(roofSummary.realAreaInSquareMeters).toBeCloseTo(30 * Math.sqrt(1.09));
    expect(roofSummary.pendingPlaneCount).toBe(1);
  });
});
