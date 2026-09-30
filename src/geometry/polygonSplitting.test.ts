import { describe, expect, it } from 'vitest';
import type { PlanPoint } from '../domain/points';
import { createRoofPlaneDefinition, type RoofPlaneDefinition } from '../domain/roofPlane';
import { polygonArea } from './planMeasurements';
import { insertPointIntoPolygonBoundary, isPointInsidePolygon } from './polygonQueries';
import { splitPolygonByPolyline } from './polygonSplitting';
import { splitRoofPlanes } from './roofPlaneSplitting';

const rectangleOutline: PlanPoint[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 6 },
  { x: 0, y: 6 },
];

const lShapedOutline: PlanPoint[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 3 },
  { x: 6, y: 3 },
  { x: 6, y: 6 },
  { x: 0, y: 6 },
];

const createChildPlane = (parentPlane: RoofPlaneDefinition, childOutline: PlanPoint[]): RoofPlaneDefinition =>
  createRoofPlaneDefinition(childOutline, parentPlane.slopeOverridePercent);

const totalArea = (roofPlanes: RoofPlaneDefinition[]): number =>
  roofPlanes.reduce((accumulatedArea, roofPlane) => accumulatedArea + polygonArea(roofPlane.outline), 0);

const applySplits = (initialPlanes: RoofPlaneDefinition[], divisionPolylines: PlanPoint[][]): RoofPlaneDefinition[] =>
  divisionPolylines.reduce((currentPlanes, divisionPolyline) => {
    const nextPlanes = splitRoofPlanes(currentPlanes, divisionPolyline, createChildPlane);

    if (!nextPlanes) {
      throw new Error(`Divisão inesperadamente inválida: ${JSON.stringify(divisionPolyline)}`);
    }

    return nextPlanes;
  }, initialPlanes);

describe('isPointInsidePolygon', () => {
  it('reconhece pontos dentro e fora de uma base em L', () => {
    expect(isPointInsidePolygon({ x: 2, y: 5 }, lShapedOutline)).toBe(true);
    expect(isPointInsidePolygon({ x: 8, y: 5 }, lShapedOutline)).toBe(false);
  });
});

describe('insertPointIntoPolygonBoundary', () => {
  it('insere o ponto na aresta que o contém', () => {
    const updatedOutline = insertPointIntoPolygonBoundary(rectangleOutline, { x: 0, y: 3 });

    expect(updatedOutline).toHaveLength(5);
    expect(updatedOutline[4]).toEqual({ x: 0, y: 3 });
  });

  it('não duplica um vértice existente', () => {
    expect(insertPointIntoPolygonBoundary(rectangleOutline, { x: 10, y: 0 })).toBe(rectangleOutline);
  });
});

describe('splitPolygonByPolyline', () => {
  it('divide um retângulo pela diagonal em dois triângulos', () => {
    const splitResult = splitPolygonByPolyline(rectangleOutline, [
      { x: 0, y: 0 },
      { x: 10, y: 6 },
    ]);

    expect(splitResult).not.toBeNull();
    expect(splitResult?.map(polygonArea)).toEqual([30, 30]);
  });

  it('rejeita uma linha que sai da base em L', () => {
    const splitResult = splitPolygonByPolyline(lShapedOutline, [
      { x: 10, y: 3 },
      { x: 6, y: 6 },
    ]);

    expect(splitResult).toBeNull();
  });

  it('rejeita uma linha sobre um lado existente', () => {
    const splitResult = splitPolygonByPolyline(rectangleOutline, [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);

    expect(splitResult).toBeNull();
  });
});

describe('splitRoofPlanes', () => {
  it('monta um telhado de duas águas a partir do meio dos lados', () => {
    const roofPlanes = applySplits(
      [createRoofPlaneDefinition(rectangleOutline)],
      [
        [
          { x: 0, y: 3 },
          { x: 10, y: 3 },
        ],
      ],
    );

    expect(roofPlanes).toHaveLength(2);
    expect(roofPlanes.map((roofPlane) => polygonArea(roofPlane.outline))).toEqual([30, 30]);
  });

  it('monta um telhado de quatro águas com cumeeira central', () => {
    const roofPlanes = applySplits(
      [createRoofPlaneDefinition(rectangleOutline)],
      [
        [
          { x: 0, y: 0 },
          { x: 3, y: 3 },
          { x: 0, y: 6 },
        ],
        [
          { x: 10, y: 0 },
          { x: 7, y: 3 },
          { x: 10, y: 6 },
        ],
        [
          { x: 3, y: 3 },
          { x: 7, y: 3 },
        ],
      ],
    );

    expect(roofPlanes).toHaveLength(4);
    expect(totalArea(roofPlanes)).toBeCloseTo(60);
  });

  it('herda a inclinação própria da água dividida', () => {
    const parentPlane = createRoofPlaneDefinition(rectangleOutline, 30);
    const roofPlanes = applySplits(
      [parentPlane],
      [
        [
          { x: 0, y: 3 },
          { x: 10, y: 3 },
        ],
      ],
    );

    expect(roofPlanes.every((roofPlane) => roofPlane.slopeOverridePercent === 30)).toBe(true);
  });

  it('insere o ponto de divisão também na água vizinha que compartilha a aresta', () => {
    const roofPlanesAfterFirstSplit = applySplits(
      [createRoofPlaneDefinition(rectangleOutline)],
      [
        [
          { x: 0, y: 3 },
          { x: 10, y: 3 },
        ],
      ],
    );

    const roofPlanesAfterSecondSplit = applySplits(roofPlanesAfterFirstSplit, [
      [
        { x: 5, y: 0 },
        { x: 5, y: 3 },
      ],
    ]);

    const untouchedPlane = roofPlanesAfterSecondSplit.find((roofPlane) => roofPlane.outline.length === 5);

    expect(roofPlanesAfterSecondSplit).toHaveLength(3);
    expect(untouchedPlane?.outline).toContainEqual({ x: 5, y: 3 });
  });

  it('retorna nulo para uma divisão inválida', () => {
    const roofPlanes = splitRoofPlanes(
      [createRoofPlaneDefinition(rectangleOutline)],
      [
        { x: 2, y: 2 },
        { x: 4, y: 4 },
      ],
      createChildPlane,
    );

    expect(roofPlanes).toBeNull();
  });
});
