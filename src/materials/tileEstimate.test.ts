import { describe, expect, it } from 'vitest';
import { estimateTiles } from './tileEstimate';

describe('estimateTiles', () => {
  it('calcula telhas e cumeeiras com perda, arredondando para cima', () => {
    const tileEstimate = estimateTiles(100, 20, {
      tilesPerSquareMeter: 24,
      ridgeTilesPerLinearMeter: 3,
      wastePercent: 5,
    });

    expect(tileEstimate).toEqual({ roofTileCount: 2520, ridgeTileCount: 63 });
  });

  it('arredonda peças quebradas para cima', () => {
    const tileEstimate = estimateTiles(10.1, 1.1, {
      tilesPerSquareMeter: 16,
      ridgeTilesPerLinearMeter: 3,
      wastePercent: null,
    });

    expect(tileEstimate).toEqual({ roofTileCount: 162, ridgeTileCount: 4 });
  });

  it('não calcula sem os dados do fabricante', () => {
    const tileEstimate = estimateTiles(100, 20, {
      tilesPerSquareMeter: null,
      ridgeTilesPerLinearMeter: null,
      wastePercent: 5,
    });

    expect(tileEstimate).toEqual({ roofTileCount: null, ridgeTileCount: null });
  });
});
