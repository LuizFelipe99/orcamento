import type { MouseEvent, ReactNode } from 'react';
import { useRoofProjectStore } from '../store/roofProjectStore';
import { useToolStore, type EditorTool } from '../store/toolStore';
import { requestProjectDeletion } from './commands/baseOutlineCommands';
import { activateTool, isToolAvailable } from './commands/editorCommands';
import { correctRoofDrawing } from './commands/correctionCommands';
import { undoLastRoofChange } from './commands/splitCommands';

type ToolButtonDefinition = {
  tool: EditorTool;
  label: string;
};

const TOOL_BUTTONS: ToolButtonDefinition[] = [
  { tool: 'drawBase', label: '1. Base' },
  { tool: 'splitPlanes', label: '2. Dividir águas' },
  { tool: 'configurePlanes', label: '3. Configurar águas' },
];

type ToolbarButtonProps = {
  isActive?: boolean;
  isDisabled?: boolean;
  onPress: () => void;
  children: ReactNode;
};

const ToolbarButton = ({ isActive = false, isDisabled = false, onPress, children }: ToolbarButtonProps) => {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    onPress();
  };

  const className = isActive ? 'toolbar__button toolbar__button--active' : 'toolbar__button';

  return (
    <button type="button" className={className} disabled={isDisabled} onClick={handleClick}>
      {children}
    </button>
  );
};

export const Toolbar = () => {
  const activeTool = useToolStore((state) => state.activeTool);
  const hasBaseOutline = useRoofProjectStore((state) => state.baseOutline !== null);
  const canUndo = useRoofProjectStore((state) => state.roofPlanesHistory.length > 0);
  const canCorrectDrawing = useRoofProjectStore((state) => state.roofPlaneDefinitions.length > 1);

  return (
    <nav className="toolbar">
      {TOOL_BUTTONS.map(({ tool, label }) => (
        <ToolbarButton
          key={tool}
          isActive={activeTool === tool}
          isDisabled={!isToolAvailable(tool, hasBaseOutline)}
          onPress={() => activateTool(tool)}
        >
          {label}
        </ToolbarButton>
      ))}
      <span className="toolbar__divider" />
      <ToolbarButton isDisabled={!canCorrectDrawing} onPress={correctRoofDrawing}>
        Corrigir desenho
      </ToolbarButton>
      <ToolbarButton isDisabled={!canUndo} onPress={undoLastRoofChange}>
        Desfazer
      </ToolbarButton>
      <ToolbarButton isDisabled={!hasBaseOutline} onPress={requestProjectDeletion}>
        Apagar tudo
      </ToolbarButton>
    </nav>
  );
};
