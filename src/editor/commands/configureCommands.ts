import { findNearestEdge, isPointInsidePolygon } from '../../geometry/polygonQueries';
import { computeRoofFootprints } from '../../geometry/roofFootprint';
import { pixelsToMeters } from '../../geometry/viewportTransform';
import { useCursorStore } from '../../store/cursorStore';
import { useRoofProjectStore } from '../../store/roofProjectStore';
import { useViewportStore } from '../../store/viewportStore';
import { SNAP_TOLERANCE_IN_PIXELS } from '../editorSettings';

export const selectPlaneOrEaveAtCursor = () => {
  const { cursorPlanPoint } = useCursorStore.getState();

  if (!cursorPlanPoint) {
    return;
  }

  const { roofPlaneDefinitions, selectedRoofPlaneId, selectRoofPlane, updateRoofPlane, baseOutline, projectSettings } =
    useRoofProjectStore.getState();
  const { pixelsPerMeter } = useViewportStore.getState().viewportTransform;
  const edgeToleranceInMeters = pixelsToMeters(SNAP_TOLERANCE_IN_PIXELS, pixelsPerMeter);
  const selectedDefinition = roofPlaneDefinitions.find((definition) => definition.id === selectedRoofPlaneId);
  const clickedEdge = selectedDefinition
    ? findNearestEdge(selectedDefinition.outline, cursorPlanPoint, edgeToleranceInMeters)
    : null;

  if (selectedDefinition && clickedEdge) {
    updateRoofPlane(selectedDefinition.id, { eave: clickedEdge });
    return;
  }

  const footprintsByPlaneId = computeRoofFootprints(
    roofPlaneDefinitions,
    baseOutline,
    projectSettings.eaveOverhangInMeters,
  );
  const clickedDefinition = roofPlaneDefinitions.find((definition) =>
    isPointInsidePolygon(cursorPlanPoint, footprintsByPlaneId.get(definition.id) ?? definition.outline),
  );

  selectRoofPlane(clickedDefinition?.id ?? null);
};

export const updateSelectedPlaneSlopeOverride = (slopeOverridePercent: number | null) => {
  const { selectedRoofPlaneId, updateRoofPlane } = useRoofProjectStore.getState();

  if (!selectedRoofPlaneId) {
    return;
  }

  updateRoofPlane(selectedRoofPlaneId, { slopeOverridePercent });
};
