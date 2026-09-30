import { create } from 'zustand';

export type EditorTool = 'drawBase' | 'splitPlanes' | 'configurePlanes';

export type DraftingTool = Exclude<EditorTool, 'configurePlanes'>;

type ToolState = {
  activeTool: EditorTool;
  setActiveTool: (tool: EditorTool) => void;
};

export const useToolStore = create<ToolState>()((set) => ({
  activeTool: 'drawBase',
  setActiveTool: (tool) => set({ activeTool: tool }),
}));
