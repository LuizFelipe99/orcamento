import { describe, expect, it } from 'vitest';
import { addLengthMargin, addPieceMargin } from './safetyMargin';

describe('addPieceMargin', () => {
  it('acrescenta a margem e arredonda para cima', () => {
    expect(addPieceMargin(64, 10)).toBe(71);
    expect(addPieceMargin(64, 9.4)).toBe(71);
    expect(addPieceMargin(64, 9)).toBe(70);
  });

  it('mantém o valor exato sem margem', () => {
    expect(addPieceMargin(64, null)).toBe(64);
    expect(addPieceMargin(64, 0)).toBe(64);
  });

  it('não arredonda para cima por ruído numérico', () => {
    expect(addPieceMargin(50, 10)).toBe(55);
  });
});

describe('addLengthMargin', () => {
  it('arredonda os metros para cima', () => {
    expect(addLengthMargin(543, 10)).toBe(598);
    expect(addLengthMargin(542.3, null)).toBe(543);
  });
});
