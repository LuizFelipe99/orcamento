import { describe, expect, it } from 'vitest';
import type { PlanPoint, PlanSegment } from '../domain/points';
import type { RoofPlane } from '../domain/roofPlane';
import { assignMissingEaves, detectEave } from './eaveDetection';
import { solveLeastSquares } from './linearAlgebra';
import { polygonArea } from './planMeasurements';
import { applyVertexMoves, isValidRoofPartition, planRoofCorrection } from './roofCorrection';
import { validateRoofPlanes } from './roofConsistency';
import { summarizeVertexHeights } from './vertexHeights';

const topLeft = { x: 0, y: 0 };
const topRight = { x: 10, y: 0 };
const bottomRight = { x: 10, y: 10 };
const bottomLeft = { x: 0, y: 10 };
const squareBase: PlanPoint[] = [topLeft, topRight, bottomRight, bottomLeft];

const rectangleBase: PlanPoint[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 6 },
  { x: 0, y: 6 },
];

const expectPointCloseTo = (actualPoint: PlanPoint | undefined, expectedPoint: PlanPoint) => {
  expect(actualPoint?.x).toBeCloseTo(expectedPoint.x);
  expect(actualPoint?.y).toBeCloseTo(expectedPoint.y);
};

const buildRoofPlane = (id: string, outline: PlanPoint[], eave: PlanSegment, slopePercent = 30): RoofPlane => ({
  id,
  outline,
  eave,
  slopePercent,
});

const buildOffCenterSquareRoof = (): RoofPlane[] => {
  const upperRidgePoint = { x: 5.5, y: 4 };
  const lowerRidgePoint = { x: 5.5, y: 6 };

  return [
    buildRoofPlane('top', [topLeft, topRight, upperRidgePoint], { start: topLeft, end: topRight }),
    buildRoofPlane('right', [topRight, bottomRight, lowerRidgePoint, upperRidgePoint], { start: topRight, end: bottomRight }),
    buildRoofPlane('bottom', [bottomRight, bottomLeft, lowerRidgePoint], { start: bottomRight, end: bottomLeft }),
    buildRoofPlane('left', [bottomLeft, topLeft, upperRidgePoint, lowerRidgePoint], { start: bottomLeft, end: topLeft }),
  ];
};

describe('solveLeastSquares', () => {
  it('resolve um sistema exato 2x2', () => {
    const solution = solveLeastSquares(
      [
        [1, 1],
        [1, -1],
      ],
      [3, 1],
    );

    expect(solution?.[0]).toBeCloseTo(2);
    expect(solution?.[1]).toBeCloseTo(1);
  });

  it('retorna nulo para sistema sem solução única', () => {
    expect(
      solveLeastSquares(
        [
          [1, 1],
          [2, 2],
        ],
        [1, 2],
      ),
    ).toBeNull();
  });
});

describe('detectEave', () => {
  it('escolhe o maior lado da água que fica na parede', () => {
    const topHalf = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 3 },
      { x: 0, y: 3 },
    ];
    const eave = detectEave(topHalf, rectangleBase);

    expectPointCloseTo(eave?.start, { x: 0, y: 0 });
    expectPointCloseTo(eave?.end, { x: 10, y: 0 });
  });

  it('junta os pedaços do mesmo muro em um único beiral', () => {
    const planeWithSplitWall = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 3 },
      { x: 0, y: 3 },
    ];
    const eave = detectEave(planeWithSplitWall, rectangleBase);

    expectPointCloseTo(eave?.start, { x: 0, y: 0 });
    expectPointCloseTo(eave?.end, { x: 10, y: 0 });
  });

  it('mantém o beiral já escolhido pelo usuário', () => {
    const chosenEave = { start: { x: 0, y: 0 }, end: { x: 0, y: 6 } };
    const [plane] = assignMissingEaves([{ outline: rectangleBase, eave: chosenEave }], rectangleBase);

    expect(plane.eave).toBe(chosenEave);
  });
});

describe('correção do desenho do print (cumeeira fora do centro)', () => {
  it('reposiciona os pontos da cumeeira no centro, virando pirâmide', () => {
    const roofPlanes = buildOffCenterSquareRoof();
    const vertexMoves = planRoofCorrection(roofPlanes, squareBase);

    expect(vertexMoves).toHaveLength(2);
    vertexMoves.forEach(({ to }) => expectPointCloseTo(to, { x: 5, y: 5 }));
  });

  it('elimina os avisos depois de corrigir', () => {
    const roofPlanes = buildOffCenterSquareRoof();
    const correctedPlanes = applyVertexMoves(roofPlanes, planRoofCorrection(roofPlanes, squareBase));

    expect(isValidRoofPartition(correctedPlanes, squareBase)).toBe(true);
    expect(correctedPlanes.every((roofPlane) => roofPlane.outline.length === 3)).toBe(true);
    expect(validateRoofPlanes(correctedPlanes, squareBase)).toEqual([]);
    expect(summarizeVertexHeights(correctedPlanes).every(({ isConsistent }) => isConsistent)).toBe(true);
  });

  it('respeita uma água com inclinação própria', () => {
    const roofPlanes = buildOffCenterSquareRoof().map((roofPlane) =>
      roofPlane.id === 'top' ? { ...roofPlane, slopePercent: 45 } : roofPlane,
    );
    const correctedPlanes = applyVertexMoves(roofPlanes, planRoofCorrection(roofPlanes, squareBase));

    expect(validateRoofPlanes(correctedPlanes, squareBase)).toEqual([]);
  });
});

describe('correção de telhado retangular de quatro águas', () => {
  it('coloca a cumeeira no meio e os espigões a 45°', () => {
    const sloppyLeftRidge = { x: 2.6, y: 3.4 };
    const sloppyRightRidge = { x: 7.3, y: 2.8 };
    const [rectangleTopLeft, rectangleTopRight, rectangleBottomRight, rectangleBottomLeft] = rectangleBase;
    const roofPlanes = [
      buildRoofPlane('left', [rectangleBottomLeft, rectangleTopLeft, sloppyLeftRidge], {
        start: rectangleBottomLeft,
        end: rectangleTopLeft,
      }),
      buildRoofPlane('top', [rectangleTopLeft, rectangleTopRight, sloppyRightRidge, sloppyLeftRidge], {
        start: rectangleTopLeft,
        end: rectangleTopRight,
      }),
      buildRoofPlane('right', [rectangleTopRight, rectangleBottomRight, sloppyRightRidge], {
        start: rectangleTopRight,
        end: rectangleBottomRight,
      }),
      buildRoofPlane('bottom', [rectangleBottomRight, rectangleBottomLeft, sloppyLeftRidge, sloppyRightRidge], {
        start: rectangleBottomRight,
        end: rectangleBottomLeft,
      }),
    ];

    const vertexMoves = planRoofCorrection(roofPlanes, rectangleBase);
    const correctedPlanes = applyVertexMoves(roofPlanes, vertexMoves);

    expectPointCloseTo(vertexMoves.find(({ from }) => from === sloppyLeftRidge)?.to, { x: 3, y: 3 });
    expectPointCloseTo(vertexMoves.find(({ from }) => from === sloppyRightRidge)?.to, { x: 7, y: 3 });
    expect(validateRoofPlanes(correctedPlanes, rectangleBase)).toEqual([]);
  });
});

describe('correção de telhado de duas águas', () => {
  it('centraliza a ponta da cumeeira deslizando sobre a parede do oitão', () => {
    const leftRidgeEnd = { x: 0, y: 3.4 };
    const rightRidgeEnd = { x: 10, y: 2.7 };
    const roofPlanes = [
      buildRoofPlane('top', [{ x: 0, y: 0 }, { x: 10, y: 0 }, rightRidgeEnd, leftRidgeEnd], {
        start: { x: 0, y: 0 },
        end: { x: 10, y: 0 },
      }),
      buildRoofPlane('bottom', [rightRidgeEnd, { x: 10, y: 6 }, { x: 0, y: 6 }, leftRidgeEnd], {
        start: { x: 10, y: 6 },
        end: { x: 0, y: 6 },
      }),
    ];

    const correctedPlanes = applyVertexMoves(roofPlanes, planRoofCorrection(roofPlanes, rectangleBase));

    expect(correctedPlanes.map(({ outline }) => polygonArea(outline))).toEqual([30, 30]);
    expect(validateRoofPlanes(correctedPlanes, rectangleBase)).toEqual([]);
  });
});

describe('isValidRoofPartition', () => {
  it('rejeita águas que se sobrepõem', () => {
    const overlappingPlanes = [
      { outline: rectangleBase, eave: null },
      { outline: rectangleBase, eave: null },
    ];

    expect(isValidRoofPartition(overlappingPlanes, rectangleBase)).toBe(false);
  });
});
