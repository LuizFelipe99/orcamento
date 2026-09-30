import { create } from 'zustand';

type LayerVisibilityState = {
  areRaftersVisible: boolean;
  areBattensVisible: boolean;
  toggleRafters: () => void;
  toggleBattens: () => void;
};

export const useLayerVisibilityStore = create<LayerVisibilityState>()((set) => ({
  areRaftersVisible: true,
  areBattensVisible: true,
  toggleRafters: () => set((state) => ({ areRaftersVisible: !state.areRaftersVisible })),
  toggleBattens: () => set((state) => ({ areBattensVisible: !state.areBattensVisible })),
}));
