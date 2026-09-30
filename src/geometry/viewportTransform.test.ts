import { describe, expect, it } from 'vitest';
import { selectGridSpacing } from './gridSpacing';
import { screenToPlan, zoomAroundScreenPoint, type ViewportTransform } from './viewportTransform';

const zoomLimits = { minimumPixelsPerMeter: 5, maximumPixelsPerMeter: 400 };

const initialTransform: ViewportTransform = {
  pixelsPerMeter: 40,
  originOnScreen: { x: 120, y: 120 },
};

describe('zoomAroundScreenPoint', () => {
  it('mantém fixo o ponto da planta que está sob o cursor', () => {
    const cursorOnScreen = { x: 437, y: 291 };
    const planPointBeforeZoom = screenToPlan(cursorOnScreen, initialTransform);

    const zoomedTransform = zoomAroundScreenPoint(initialTransform, cursorOnScreen, 2, zoomLimits);
    const planPointAfterZoom = screenToPlan(cursorOnScreen, zoomedTransform);

    expect(planPointAfterZoom.x).toBeCloseTo(planPointBeforeZoom.x);
    expect(planPointAfterZoom.y).toBeCloseTo(planPointBeforeZoom.y);
  });

  it('não ultrapassa o zoom máximo', () => {
    const zoomedTransform = zoomAroundScreenPoint(initialTransform, { x: 0, y: 0 }, 100, zoomLimits);

    expect(zoomedTransform.pixelsPerMeter).toBe(zoomLimits.maximumPixelsPerMeter);
  });
});

describe('selectGridSpacing', () => {
  it('escolhe o menor passo que respeita o espaçamento mínimo em pixels', () => {
    expect(selectGridSpacing(40, 16)).toEqual({ minorStepInMeters: 0.5, majorStepInMeters: 1 });
  });
});
