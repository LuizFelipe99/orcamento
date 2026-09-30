import { describe, expect, it } from 'vitest';
import type { PlanPoint } from '../domain/points';
import { parseLengthInMeters, parseSlopePercent } from '../formatting/measurementParsers';
import {
  constrainToAngleLock,
  pointAtDistanceTowards,
  removeClosingDuplicateVertex,
  resolveDraftTarget,
  snapPointToGrid,
  type DraftSnapOptions,
} from './outlineDrafting';

const origin: PlanPoint = { x: 0, y: 0 };

const expectPointCloseTo = (actualPoint: PlanPoint, expectedPoint: PlanPoint) => {
  expect(actualPoint.x).toBeCloseTo(expectedPoint.x);
  expect(actualPoint.y).toBeCloseTo(expectedPoint.y);
};

const squareOutline: PlanPoint[] = [
  { x: 0, y: 0 },
  { x: 5, y: 0 },
  { x: 5, y: 5 },
  { x: 0, y: 5 },
];

const snapOptions: DraftSnapOptions = {
  snapToleranceInMeters: 0.2,
  gridStepInMeters: 0.5,
  isAngleLockActive: true,
};

describe('constrainToAngleLock', () => {
  it('trava na horizontal', () => {
    expectPointCloseTo(constrainToAngleLock(origin, { x: 5, y: 0.4 }, null), { x: 5, y: 0 });
  });

  it('trava na vertical', () => {
    expectPointCloseTo(constrainToAngleLock(origin, { x: 0.3, y: 4 }, null), { x: 0, y: 4 });
  });

  it('trava a 45° e arredonda o comprimento pelo passo da grade', () => {
    const lockedPoint = constrainToAngleLock(origin, { x: 3, y: 2.8 }, 0.5);
    const expectedCoordinate = 4 * Math.cos(Math.PI / 4);

    expectPointCloseTo(lockedPoint, { x: expectedCoordinate, y: expectedCoordinate });
  });
});

describe('snapPointToGrid', () => {
  it('arredonda para o cruzamento mais próximo', () => {
    expectPointCloseTo(snapPointToGrid({ x: 1.26, y: 3.74 }, 0.5), { x: 1.5, y: 3.5 });
  });

  it('mantém o ponto livre sem passo de grade', () => {
    expectPointCloseTo(snapPointToGrid({ x: 1.26, y: 3.74 }, null), { x: 1.26, y: 3.74 });
  });
});

describe('pointAtDistanceTowards', () => {
  it('cria o ponto na distância digitada, na direção do cursor', () => {
    const typedEndpoint = pointAtDistanceTowards(origin, { x: 3, y: 4 }, 10);

    expect(typedEndpoint).not.toBeNull();
    expectPointCloseTo(typedEndpoint as PlanPoint, { x: 6, y: 8 });
  });

  it('retorna nulo quando o cursor está sobre a origem', () => {
    expect(pointAtDistanceTowards(origin, origin, 10)).toBeNull();
  });
});

describe('resolveDraftTarget', () => {
  it('prioriza o fechamento no ponto inicial sobre a trava de ângulo', () => {
    const draftTarget = resolveDraftTarget({ x: 0.1, y: 0.1 }, { x: 0, y: 5 }, snapOptions, {
      closingVertex: origin,
      boundaryOutlines: [],
    });

    expect(draftTarget).toEqual({ targetPoint: origin, snapKind: 'closingVertex' });
  });

  it('encaixa em um vértice do contorno antes de encaixar na aresta', () => {
    const draftTarget = resolveDraftTarget({ x: 4.9, y: 0.1 }, null, snapOptions, {
      closingVertex: null,
      boundaryOutlines: [squareOutline],
    });

    expect(draftTarget).toEqual({ targetPoint: { x: 5, y: 0 }, snapKind: 'boundary' });
  });

  it('projeta o cursor sobre a aresta do contorno mais próxima', () => {
    const draftTarget = resolveDraftTarget({ x: 2.3, y: 0.15 }, null, snapOptions, {
      closingVertex: null,
      boundaryOutlines: [squareOutline],
    });

    expect(draftTarget.snapKind).toBe('boundary');
    expectPointCloseTo(draftTarget.targetPoint, { x: 2.3, y: 0 });
  });

  it('usa a grade quando não há nada para encaixar', () => {
    const draftTarget = resolveDraftTarget({ x: 2.3, y: 2.2 }, null, snapOptions, {
      closingVertex: null,
      boundaryOutlines: [squareOutline],
    });

    expect(draftTarget).toEqual({ targetPoint: { x: 2.5, y: 2 }, snapKind: 'free' });
  });
});

describe('removeClosingDuplicateVertex', () => {
  it('remove o último vértice quando ele coincide com o primeiro', () => {
    const verticesWithDuplicate = [...squareOutline, { x: 0, y: 0.0001 }];

    expect(removeClosingDuplicateVertex(verticesWithDuplicate)).toEqual(squareOutline);
  });

  it('mantém o contorno intacto sem duplicata', () => {
    expect(removeClosingDuplicateVertex(squareOutline)).toEqual(squareOutline);
  });
});

describe('parsers de medida', () => {
  it('aceita vírgula como separador decimal', () => {
    expect(parseLengthInMeters('4,35')).toBeCloseTo(4.35);
    expect(parseSlopePercent('32,5')).toBeCloseTo(32.5);
  });

  it('rejeita entradas vazias ou nulas', () => {
    expect(parseLengthInMeters('')).toBeNull();
    expect(parseLengthInMeters('0')).toBeNull();
    expect(parseSlopePercent('abc')).toBeNull();
  });
});
