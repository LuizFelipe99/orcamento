import { describe, expect, it } from 'vitest';
import { listSegments, polygonArea, polygonCentroid } from './planMeasurements';

const rectangleVertices = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 5 },
  { x: 0, y: 5 },
];

const lShapedVertices = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 3 },
  { x: 6, y: 3 },
  { x: 6, y: 6 },
  { x: 0, y: 6 },
];

describe('polygonArea', () => {
  it('calcula a área de um retângulo', () => {
    expect(polygonArea(rectangleVertices)).toBeCloseTo(50);
  });

  it('calcula a área de uma base em L', () => {
    expect(polygonArea(lShapedVertices)).toBeCloseTo(48);
  });

  it('independe do sentido do desenho', () => {
    expect(polygonArea([...lShapedVertices].reverse())).toBeCloseTo(48);
  });
});

describe('listSegments', () => {
  it('inclui o lado de fechamento em polígonos fechados', () => {
    expect(listSegments(rectangleVertices, true)).toHaveLength(4);
    expect(listSegments(rectangleVertices, false)).toHaveLength(3);
  });
});

describe('polygonCentroid', () => {
  it('encontra o centro de um retângulo', () => {
    const centroid = polygonCentroid(rectangleVertices);

    expect(centroid.x).toBeCloseTo(5);
    expect(centroid.y).toBeCloseTo(2.5);
  });
});
