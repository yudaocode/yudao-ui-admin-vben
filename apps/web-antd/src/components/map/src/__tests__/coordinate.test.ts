import { describe, expect, it } from 'vitest';

import { bd09ToGcj02, gcj02ToBd09, toMapCoordinate } from '../coordinate';

/** 百度 BMapGL.Convertor 官方转换结果（GCJ02 -> BD09） */
const OFFICIAL_POINTS = [
  {
    gcj02: [116.404, 39.915],
    bd09: [116.41036949370643, 39.921336993524285],
  },
  {
    gcj02: [121.4737, 31.2304],
    bd09: [121.48023740340795, 31.23633481986451],
  },
] as const;

describe('map coordinate', () => {
  it('matches official Baidu results inside mainland China', () => {
    for (const { bd09, gcj02 } of OFFICIAL_POINTS) {
      const result = gcj02ToBd09(gcj02[0], gcj02[1]);
      expect(result.longitude).toBeCloseTo(bd09[0], 8);
      expect(result.latitude).toBeCloseTo(bd09[1], 8);

      const back = bd09ToGcj02(bd09[0], bd09[1]);
      expect(back.longitude).toBeCloseTo(gcj02[0], 8);
      expect(back.latitude).toBeCloseTo(gcj02[1], 8);
    }
  });

  it('keeps zero and overseas coordinates unchanged', () => {
    expect(gcj02ToBd09(0, 0)).toEqual({ longitude: 0, latitude: 0 });
    expect(bd09ToGcj02(0, 0)).toEqual({ longitude: 0, latitude: 0 });
    expect(gcj02ToBd09(-0.1276, 51.5072)).toEqual({
      longitude: -0.1276,
      latitude: 51.5072,
    });
    expect(bd09ToGcj02(-0.1276, 51.5072)).toEqual({
      longitude: -0.1276,
      latitude: 51.5072,
    });
  });

  it('parses only finite coordinates', () => {
    expect(toMapCoordinate(0, '0')).toEqual({ longitude: 0, latitude: 0 });
    expect(toMapCoordinate(' 116.4 ', 39.9)).toEqual({
      longitude: 116.4,
      latitude: 39.9,
    });
    expect(toMapCoordinate('', 39.9)).toBeUndefined();
    expect(toMapCoordinate('  ', 39.9)).toBeUndefined();
    expect(toMapCoordinate('abc', 39.9)).toBeUndefined();
    expect(toMapCoordinate(116.4, null)).toBeUndefined();
    expect(toMapCoordinate(Number.NaN, 39.9)).toBeUndefined();
    expect(toMapCoordinate(116.4, Number.POSITIVE_INFINITY)).toBeUndefined();
  });
});
