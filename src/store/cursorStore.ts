import { create } from 'zustand';
import type { PlanPoint } from '../domain/points';

type CursorState = {
  cursorPlanPoint: PlanPoint | null;
  setCursorPlanPoint: (cursorPlanPoint: PlanPoint | null) => void;
};

export const useCursorStore = create<CursorState>()((set) => ({
  cursorPlanPoint: null,
  setCursorPlanPoint: (cursorPlanPoint) => set({ cursorPlanPoint }),
}));
