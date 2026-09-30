const SINGULARITY_TOLERANCE = 1e-10;

type SquareMatrix = number[][];

const multiplyTransposeByMatrix = (matrixRows: number[][], unknownCount: number): SquareMatrix =>
  Array.from({ length: unknownCount }, (_, rowIndex) =>
    Array.from({ length: unknownCount }, (_, columnIndex) =>
      matrixRows.reduce((sum, matrixRow) => sum + matrixRow[rowIndex] * matrixRow[columnIndex], 0),
    ),
  );

const multiplyTransposeByVector = (matrixRows: number[][], rightHandSide: number[], unknownCount: number): number[] =>
  Array.from({ length: unknownCount }, (_, rowIndex) =>
    matrixRows.reduce((sum, matrixRow, equationIndex) => sum + matrixRow[rowIndex] * rightHandSide[equationIndex], 0),
  );

const determinant = (matrix: SquareMatrix): number => {
  if (matrix.length === 2) {
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  }

  return (
    matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
    matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
    matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
  );
};

const replaceColumn = (matrix: SquareMatrix, columnIndex: number, replacementColumn: number[]): SquareMatrix =>
  matrix.map((row, rowIndex) =>
    row.map((value, currentColumnIndex) => (currentColumnIndex === columnIndex ? replacementColumn[rowIndex] : value)),
  );

const solveByCramersRule = (coefficients: SquareMatrix, constants: number[]): number[] | null => {
  const coefficientsDeterminant = determinant(coefficients);

  if (Math.abs(coefficientsDeterminant) < SINGULARITY_TOLERANCE) {
    return null;
  }

  return coefficients.map(
    (_, columnIndex) => determinant(replaceColumn(coefficients, columnIndex, constants)) / coefficientsDeterminant,
  );
};

export const solveLeastSquares = (matrixRows: number[][], rightHandSide: number[]): number[] | null => {
  const unknownCount = matrixRows[0]?.length ?? 0;
  const isSupportedSize = unknownCount === 2 || unknownCount === 3;

  if (!isSupportedSize || matrixRows.length < unknownCount) {
    return null;
  }

  return solveByCramersRule(
    multiplyTransposeByMatrix(matrixRows, unknownCount),
    multiplyTransposeByVector(matrixRows, rightHandSide, unknownCount),
  );
};
