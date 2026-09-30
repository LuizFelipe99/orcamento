import type { ViewportTransform, ZoomLimits } from '../geometry/viewportTransform';

export const MINIMUM_GRID_STEP_IN_PIXELS = 16;

export const ZOOM_STEP_FACTOR = 1.1;

export const ZOOM_LIMITS: ZoomLimits = {
  minimumPixelsPerMeter: 5,
  maximumPixelsPerMeter: 400,
};

export const INITIAL_VIEWPORT_TRANSFORM: ViewportTransform = {
  pixelsPerMeter: 40,
  originOnScreen: { x: 120, y: 120 },
};

export const SNAP_TOLERANCE_IN_PIXELS = 10;

export const VERTEX_RADIUS_IN_PIXELS = 4;

export const LABEL_FONT_SIZE_IN_PIXELS = 13;

export const OUTLINE_STROKE_WIDTH_IN_PIXELS = 2;

export const TYPED_ENDPOINT_SNAP_TOLERANCE_IN_METERS = 0.005;
