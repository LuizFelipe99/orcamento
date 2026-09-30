const GRID_STEP_CANDIDATES_IN_METERS = [0.1, 0.5, 1, 5, 10, 50, 100];

const MULTIPLE_TOLERANCE = 1e-6;

export type GridSpacing = {
  minorStepInMeters: number;
  majorStepInMeters: number;
};

export const selectGridSpacing = (pixelsPerMeter: number, minimumMinorStepInPixels: number): GridSpacing => {
  const lastCandidateIndex = GRID_STEP_CANDIDATES_IN_METERS.length - 1;
  const minorStepIndex = GRID_STEP_CANDIDATES_IN_METERS.findIndex(
    (candidateStep) => candidateStep * pixelsPerMeter >= minimumMinorStepInPixels,
  );

  if (minorStepIndex === -1) {
    const largestStep = GRID_STEP_CANDIDATES_IN_METERS[lastCandidateIndex];
    return { minorStepInMeters: largestStep, majorStepInMeters: largestStep };
  }

  const majorStepIndex = Math.min(minorStepIndex + 1, lastCandidateIndex);

  return {
    minorStepInMeters: GRID_STEP_CANDIDATES_IN_METERS[minorStepIndex],
    majorStepInMeters: GRID_STEP_CANDIDATES_IN_METERS[majorStepIndex],
  };
};

export const listGridCoordinates = (rangeStart: number, rangeEnd: number, stepInMeters: number): number[] => {
  const firstStepIndex = Math.ceil(rangeStart / stepInMeters);
  const lastStepIndex = Math.floor(rangeEnd / stepInMeters);

  if (lastStepIndex < firstStepIndex) {
    return [];
  }

  return Array.from(
    { length: lastStepIndex - firstStepIndex + 1 },
    (_, offset) => (firstStepIndex + offset) * stepInMeters,
  );
};

export const isMultipleOf = (value: number, step: number): boolean => {
  const ratio = value / step;
  return Math.abs(ratio - Math.round(ratio)) < MULTIPLE_TOLERANCE;
};
