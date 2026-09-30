import { create } from 'zustand';
import type { PlanPoint } from '../domain/points';

type DraftState = {
  draftVertices: PlanPoint[];
  appendDraftVertex: (vertex: PlanPoint) => void;
  removeLastDraftVertex: () => void;
  discardDraft: () => void;
};

export const useDraftStore = create<DraftState>()((set) => ({
  draftVertices: [],
  appendDraftVertex: (vertex) => set((state) => ({ draftVertices: [...state.draftVertices, vertex] })),
  removeLastDraftVertex: () => set((state) => ({ draftVertices: state.draftVertices.slice(0, -1) })),
  discardDraft: () => set({ draftVertices: [] }),
}));
