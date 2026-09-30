import { describe, expect, it } from 'vitest';
import { planCuts } from './cuttingPlan';

const repeat = (lengthInMeters: number, quantity: number): number[] => Array.from({ length: quantity }, () => lengthInMeters);

const raftersFromScreenshot = [
  ...repeat(5.8, 24),
  ...[5.3, 4.7, 4.2, 3.7, 3.2, 2.7, 2.1, 1.6, 1.1, 0.6].flatMap((lengthInMeters) => repeat(lengthInMeters, 8)),
];

describe('planCuts', () => {
  it('reduz a lista do print para 64 peças de 6 m, aproveitando as sobras', () => {
    const cuttingPlan = planCuts(raftersFromScreenshot, [6], 0.004);

    expect(cuttingPlan.stockOrder).toEqual([{ lengthInMeters: 6, quantity: 64 }]);
    expect(cuttingPlan.oversizedCuts).toEqual([]);
    expect(cuttingPlan.cutPatterns).toContainEqual({
      stockLengthInMeters: 6,
      cutLengthsInMeters: [5.3, 0.6],
      leftoverInMeters: 0.096,
      quantity: 8,
    });
  });

  it('separa as peças maiores que o maior comprimento disponível', () => {
    const cuttingPlan = planCuts(raftersFromScreenshot, [5], 0);

    expect(cuttingPlan.oversizedCuts).toEqual([
      { lengthInMeters: 5.8, quantity: 24 },
      { lengthInMeters: 5.3, quantity: 8 },
    ]);
    expect(cuttingPlan.stockOrder.every(({ lengthInMeters }) => lengthInMeters === 5)).toBe(true);
  });

  it('escolhe o comprimento que gera menos compra', () => {
    const cuttingPlan = planCuts([4, 1.5], [3, 5, 6], 0);

    expect(cuttingPlan.stockOrder).toEqual([{ lengthInMeters: 6, quantity: 1 }]);
    expect(cuttingPlan.totalLeftoverInMeters).toBeCloseTo(0.5);
  });

  it('prefere peças curtas quando a peça longa sobraria muito', () => {
    const cuttingPlan = planCuts([2.5, 2.5, 2.5], [3, 10], 0);

    expect(cuttingPlan.stockOrder).toEqual([{ lengthInMeters: 3, quantity: 3 }]);
  });

  it('desconta a espessura da serra entre os cortes', () => {
    expect(planCuts([3, 3], [6], 0).purchasedPieceCount).toBe(1);
    expect(planCuts([3, 3], [6], 0.004).purchasedPieceCount).toBe(2);
  });

  it('não compra nada quando não há comprimento disponível', () => {
    const cuttingPlan = planCuts([2, 3], [], 0);

    expect(cuttingPlan.purchasedPieceCount).toBe(0);
    expect(cuttingPlan.oversizedCuts).toEqual([
      { lengthInMeters: 3, quantity: 1 },
      { lengthInMeters: 2, quantity: 1 },
    ]);
  });
});
