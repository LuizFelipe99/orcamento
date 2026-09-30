import { removeFloatingNoise } from '../geometry/numericPrecision';

const LENGTH_TOLERANCE_IN_METERS = 1e-6;

export type LengthQuantity = {
  lengthInMeters: number;
  quantity: number;
};

export type CutPattern = {
  stockLengthInMeters: number;
  cutLengthsInMeters: number[];
  leftoverInMeters: number;
  quantity: number;
};

export type CuttingPlan = {
  stockOrder: LengthQuantity[];
  cutPatterns: CutPattern[];
  oversizedCuts: LengthQuantity[];
  purchasedPieceCount: number;
  totalPurchasedLengthInMeters: number;
  totalLeftoverInMeters: number;
};

type PackedStockPiece = {
  cutLengthsInMeters: number[];
  usedLengthInMeters: number;
};

type AssignedStockPiece = PackedStockPiece & {
  stockLengthInMeters: number;
};

const sortDescending = (values: number[]): number[] => [...values].sort((first, second) => second - first);

const countByValue = (values: number[]): LengthQuantity[] =>
  [...values.reduce((quantities, value) => quantities.set(value, (quantities.get(value) ?? 0) + 1), new Map<number, number>())]
    .map(([lengthInMeters, quantity]) => ({ lengthInMeters, quantity }))
    .sort((first, second) => second.lengthInMeters - first.lengthInMeters);

const usedLengthAfterCut = (stockPiece: PackedStockPiece, cutLengthInMeters: number, sawKerfInMeters: number): number => {
  if (stockPiece.cutLengthsInMeters.length === 0) {
    return cutLengthInMeters;
  }

  return stockPiece.usedLengthInMeters + sawKerfInMeters + cutLengthInMeters;
};

const findBestFittingPieceIndex = (
  stockPieces: PackedStockPiece[],
  cutLengthInMeters: number,
  binLengthInMeters: number,
  sawKerfInMeters: number,
): number | null => {
  const [bestCandidate] = stockPieces
    .map((stockPiece, pieceIndex) => ({
      pieceIndex,
      remainingLength: binLengthInMeters - usedLengthAfterCut(stockPiece, cutLengthInMeters, sawKerfInMeters),
    }))
    .filter(({ remainingLength }) => remainingLength >= -LENGTH_TOLERANCE_IN_METERS)
    .sort((first, second) => first.remainingLength - second.remainingLength);

  return bestCandidate?.pieceIndex ?? null;
};

const packBestFitDecreasing = (
  cutsInDescendingOrder: number[],
  binLengthInMeters: number,
  sawKerfInMeters: number,
): PackedStockPiece[] =>
  cutsInDescendingOrder.reduce<PackedStockPiece[]>((stockPieces, cutLengthInMeters) => {
    const bestPieceIndex = findBestFittingPieceIndex(stockPieces, cutLengthInMeters, binLengthInMeters, sawKerfInMeters);

    if (bestPieceIndex === null) {
      return [...stockPieces, { cutLengthsInMeters: [cutLengthInMeters], usedLengthInMeters: cutLengthInMeters }];
    }

    return stockPieces.map((stockPiece, pieceIndex) =>
      pieceIndex === bestPieceIndex
        ? {
            cutLengthsInMeters: [...stockPiece.cutLengthsInMeters, cutLengthInMeters],
            usedLengthInMeters: usedLengthAfterCut(stockPiece, cutLengthInMeters, sawKerfInMeters),
          }
        : stockPiece,
    );
  }, []);

const assignShortestStock = (
  stockPieces: PackedStockPiece[],
  stockLengthsInAscendingOrder: number[],
): AssignedStockPiece[] =>
  stockPieces.map((stockPiece) => ({
    ...stockPiece,
    stockLengthInMeters:
      stockLengthsInAscendingOrder.find(
        (stockLength) => stockLength >= stockPiece.usedLengthInMeters - LENGTH_TOLERANCE_IN_METERS,
      ) ?? stockLengthsInAscendingOrder[stockLengthsInAscendingOrder.length - 1],
  }));

const totalPurchasedLength = (assignedPieces: AssignedStockPiece[]): number =>
  assignedPieces.reduce((totalLength, assignedPiece) => totalLength + assignedPiece.stockLengthInMeters, 0);

const isCheaperPlan = (candidate: AssignedStockPiece[], currentBest: AssignedStockPiece[]): boolean => {
  const lengthDifference = totalPurchasedLength(candidate) - totalPurchasedLength(currentBest);

  if (Math.abs(lengthDifference) > LENGTH_TOLERANCE_IN_METERS) {
    return lengthDifference < 0;
  }

  return candidate.length < currentBest.length;
};

const groupCutPatterns = (assignedPieces: AssignedStockPiece[]): CutPattern[] => {
  const patternsByKey = assignedPieces.reduce((patterns, assignedPiece) => {
    const cutLengthsInMeters = sortDescending(assignedPiece.cutLengthsInMeters);
    const patternKey = `${assignedPiece.stockLengthInMeters}|${cutLengthsInMeters.join(';')}`;
    const existingPattern = patterns.get(patternKey);

    if (existingPattern) {
      return patterns.set(patternKey, { ...existingPattern, quantity: existingPattern.quantity + 1 });
    }

    return patterns.set(patternKey, {
      stockLengthInMeters: assignedPiece.stockLengthInMeters,
      cutLengthsInMeters,
      leftoverInMeters: removeFloatingNoise(assignedPiece.stockLengthInMeters - assignedPiece.usedLengthInMeters),
      quantity: 1,
    });
  }, new Map<string, CutPattern>());

  return [...patternsByKey.values()].sort(
    (first, second) => second.stockLengthInMeters - first.stockLengthInMeters || second.quantity - first.quantity,
  );
};

export const planCuts = (
  cutLengthsInMeters: number[],
  availableStockLengthsInMeters: number[],
  sawKerfInMeters: number,
): CuttingPlan => {
  const stockLengthsInAscendingOrder = [...new Set(availableStockLengthsInMeters)].sort((first, second) => first - second);
  const longestStockLength = stockLengthsInAscendingOrder[stockLengthsInAscendingOrder.length - 1] ?? 0;
  const cutsInDescendingOrder = sortDescending(cutLengthsInMeters);
  const oversizedCuts = cutsInDescendingOrder.filter((cutLength) => cutLength > longestStockLength + LENGTH_TOLERANCE_IN_METERS);
  const fittingCuts = cutsInDescendingOrder.filter((cutLength) => cutLength <= longestStockLength + LENGTH_TOLERANCE_IN_METERS);
  const longestFittingCut = fittingCuts[0] ?? 0;

  const bestAssignedPieces = stockLengthsInAscendingOrder
    .filter((binLength) => binLength >= longestFittingCut - LENGTH_TOLERANCE_IN_METERS)
    .map((binLength) =>
      assignShortestStock(packBestFitDecreasing(fittingCuts, binLength, sawKerfInMeters), stockLengthsInAscendingOrder),
    )
    .reduce<AssignedStockPiece[] | null>(
      (currentBest, candidate) => (!currentBest || isCheaperPlan(candidate, currentBest) ? candidate : currentBest),
      null,
    ) ?? [];

  const totalPurchasedLengthInMeters = totalPurchasedLength(bestAssignedPieces);
  const totalCutLengthInMeters = fittingCuts.reduce((totalLength, cutLength) => totalLength + cutLength, 0);

  return {
    stockOrder: countByValue(bestAssignedPieces.map(({ stockLengthInMeters }) => stockLengthInMeters)),
    cutPatterns: groupCutPatterns(bestAssignedPieces),
    oversizedCuts: countByValue(oversizedCuts),
    purchasedPieceCount: bestAssignedPieces.length,
    totalPurchasedLengthInMeters,
    totalLeftoverInMeters: removeFloatingNoise(totalPurchasedLengthInMeters - totalCutLengthInMeters),
  };
};
