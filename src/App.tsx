import { RoofCanvas } from './editor/RoofCanvas';
import { StatusBar } from './editor/StatusBar';
import { Toolbar } from './editor/Toolbar';
import { RoofPlanesPanel } from './editor/panels/RoofPlanesPanel';

export const App = () => (
  <>
    <RoofCanvas />
    <Toolbar />
    <RoofPlanesPanel />
    <StatusBar />
  </>
);
