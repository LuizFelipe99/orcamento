import { useMemo } from 'react';
import { validateRoofPlanes, type RoofValidationIssue } from '../../geometry/roofConsistency';
import { useRoofProjectStore } from '../../store/roofProjectStore';
import { useResolvedRoofPlanes } from './useRoofMaterials';

export const useRoofValidationIssues = (): RoofValidationIssue[] => {
  const roofPlanes = useResolvedRoofPlanes();
  const baseOutline = useRoofProjectStore((state) => state.baseOutline);

  return useMemo(() => validateRoofPlanes(roofPlanes, baseOutline), [roofPlanes, baseOutline]);
};
