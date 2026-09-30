import { useMemo } from 'react';
import type { PlanPoint } from '../../domain/points';
import { resolveRoofPlanes, type RoofPlane } from '../../domain/roofPlane';
import { layoutRoofBattens, type Batten } from '../../geometry/battenLayout';
import { layoutRoofRafters, type Rafter } from '../../geometry/rafterLayout';
import { computeRoofFootprints, offsetPolygonOutline } from '../../geometry/roofFootprint';
import { listRoofLines, type RoofLine } from '../../geometry/roofLines';
import { useRoofProjectStore } from '../../store/roofProjectStore';

export const useResolvedRoofPlanes = (): RoofPlane[] => {
  const roofPlaneDefinitions = useRoofProjectStore((state) => state.roofPlaneDefinitions);
  const roofSlopePercent = useRoofProjectStore((state) => state.projectSettings.roofSlopePercent);

  return useMemo(() => resolveRoofPlanes(roofPlaneDefinitions, roofSlopePercent), [roofPlaneDefinitions, roofSlopePercent]);
};

export const useRoofFootprints = (): Map<string, PlanPoint[]> => {
  const roofPlanes = useResolvedRoofPlanes();
  const baseOutline = useRoofProjectStore((state) => state.baseOutline);
  const eaveOverhangInMeters = useRoofProjectStore((state) => state.projectSettings.eaveOverhangInMeters);

  return useMemo(
    () => computeRoofFootprints(roofPlanes, baseOutline, eaveOverhangInMeters),
    [roofPlanes, baseOutline, eaveOverhangInMeters],
  );
};

export const useRoofRafters = (): Map<string, Rafter[]> => {
  const roofPlanes = useResolvedRoofPlanes();
  const rafterSpacingInMeters = useRoofProjectStore((state) => state.projectSettings.rafterSpacingInMeters);
  const footprintsByPlaneId = useRoofFootprints();

  return useMemo(
    () => layoutRoofRafters(roofPlanes, footprintsByPlaneId, rafterSpacingInMeters),
    [roofPlanes, footprintsByPlaneId, rafterSpacingInMeters],
  );
};

export const useRoofBattens = (): Map<string, Batten[]> => {
  const roofPlanes = useResolvedRoofPlanes();
  const battenGaugeInMeters = useRoofProjectStore((state) => state.projectSettings.battenGaugeInMeters);
  const footprintsByPlaneId = useRoofFootprints();

  return useMemo(
    () => layoutRoofBattens(roofPlanes, footprintsByPlaneId, battenGaugeInMeters),
    [roofPlanes, footprintsByPlaneId, battenGaugeInMeters],
  );
};

export const useRoofLines = (): RoofLine[] => {
  const roofPlanes = useResolvedRoofPlanes();
  const baseOutline = useRoofProjectStore((state) => state.baseOutline);
  const eaveOverhangInMeters = useRoofProjectStore((state) => state.projectSettings.eaveOverhangInMeters);
  const footprintsByPlaneId = useRoofFootprints();

  return useMemo(() => {
    const roofOutline = baseOutline ? offsetPolygonOutline(baseOutline, eaveOverhangInMeters) : null;
    return listRoofLines(roofPlanes, footprintsByPlaneId, roofOutline);
  }, [roofPlanes, footprintsByPlaneId, baseOutline, eaveOverhangInMeters]);
};
