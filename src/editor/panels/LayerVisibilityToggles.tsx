import { useLayerVisibilityStore } from '../../store/layerVisibilityStore';

export const LayerVisibilityToggles = () => {
  const areRaftersVisible = useLayerVisibilityStore((state) => state.areRaftersVisible);
  const areBattensVisible = useLayerVisibilityStore((state) => state.areBattensVisible);
  const toggleRafters = useLayerVisibilityStore((state) => state.toggleRafters);
  const toggleBattens = useLayerVisibilityStore((state) => state.toggleBattens);

  return (
    <div className="planes-panel__toggles">
      <label className="planes-panel__toggle">
        <input type="checkbox" checked={areRaftersVisible} onChange={toggleRafters} />
        Mostrar caibros
      </label>
      <label className="planes-panel__toggle">
        <input type="checkbox" checked={areBattensVisible} onChange={toggleBattens} />
        Mostrar ripas
      </label>
    </div>
  );
};
