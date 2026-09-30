import { useRoofProjectStore } from '../../store/roofProjectStore';
import { BattenListPanel } from './BattenListPanel';
import { PlaneList } from './PlaneList';
import { ProjectSettingsPanel } from './ProjectSettingsPanel';
import { RafterListPanel } from './RafterListPanel';
import { RoofLinesPanel } from './RoofLinesPanel';
import { RoofSummaryPanel } from './RoofSummaryPanel';
import { SelectedPlaneEditor } from './SelectedPlaneEditor';
import { TilePanel } from './TilePanel';
import { ValidationWarnings } from './ValidationWarnings';

export const RoofPlanesPanel = () => {
  const hasBaseOutline = useRoofProjectStore((state) => state.baseOutline !== null);

  if (!hasBaseOutline) {
    return null;
  }

  return (
    <aside className="planes-panel">
      <ProjectSettingsPanel />
      <PlaneList />
      <SelectedPlaneEditor />
      <ValidationWarnings />
      <RoofSummaryPanel />
      <RafterListPanel />
      <BattenListPanel />
      <TilePanel />
      <RoofLinesPanel />
    </aside>
  );
};
