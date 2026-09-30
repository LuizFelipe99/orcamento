import type { PlanPoint, ScreenPoint } from '../domain/points';

export type ViewportTransform = {
  pixelsPerMeter: number;
  originOnScreen: ScreenPoint;
};

export type ZoomLimits = {
  minimumPixelsPerMeter: number;
  maximumPixelsPerMeter: number;
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

export const screenToPlan = (screenPoint: ScreenPoint, transform: ViewportTransform): PlanPoint => ({
  x: (screenPoint.x - transform.originOnScreen.x) / transform.pixelsPerMeter,
  y: (screenPoint.y - transform.originOnScreen.y) / transform.pixelsPerMeter,
});

export const planToScreen = (planPoint: PlanPoint, transform: ViewportTransform): ScreenPoint => ({
  x: planPoint.x * transform.pixelsPerMeter + transform.originOnScreen.x,
  y: planPoint.y * transform.pixelsPerMeter + transform.originOnScreen.y,
});

export const pixelsToMeters = (lengthInPixels: number, pixelsPerMeter: number): number =>
  lengthInPixels / pixelsPerMeter;

export const zoomAroundScreenPoint = (
  transform: ViewportTransform,
  anchorOnScreen: ScreenPoint,
  zoomFactor: number,
  zoomLimits: ZoomLimits,
): ViewportTransform => {
  const nextPixelsPerMeter = clamp(
    transform.pixelsPerMeter * zoomFactor,
    zoomLimits.minimumPixelsPerMeter,
    zoomLimits.maximumPixelsPerMeter,
  );

  if (nextPixelsPerMeter === transform.pixelsPerMeter) {
    return transform;
  }

  const anchorOnPlan = screenToPlan(anchorOnScreen, transform);

  return {
    pixelsPerMeter: nextPixelsPerMeter,
    originOnScreen: {
      x: anchorOnScreen.x - anchorOnPlan.x * nextPixelsPerMeter,
      y: anchorOnScreen.y - anchorOnPlan.y * nextPixelsPerMeter,
    },
  };
};

export const panByScreenDelta = (transform: ViewportTransform, screenDelta: ScreenPoint): ViewportTransform => ({
  ...transform,
  originOnScreen: {
    x: transform.originOnScreen.x + screenDelta.x,
    y: transform.originOnScreen.y + screenDelta.y,
  },
});
