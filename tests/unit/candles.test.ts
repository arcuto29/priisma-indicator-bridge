/**
 * Unit tests for candle utilities
 */

import { describe, it, expect } from 'vitest';
import {
  isBullish,
  isBearish,
  bodySize,
  range,
  upperWick,
  lowerWick,
  bodyTop,
  bodyBottom,
  midpoint,
  isValidCandle,
  timeframeToMs,
  sortCandles,
  deduplicateCandles,
} from '../../src/engine/candles.js';
import type { Candle } from '../../src/engine/types.js';

const bullishCandle: Candle = {
  timestamp: 1700000000000,
  open: 100,
  high: 110,
  low: 95,
  close: 108,
  volume: 1000,
};

const bearishCandle: Candle = {
  timestamp: 1700000060000,
  open: 108,
  high: 112,
  low: 98,
  close: 100,
  volume: 1200,
};

const dojiCandle: Candle = {
  timestamp: 1700000120000,
  open: 100,
  high: 105,
  low: 95,
  close: 100,
  volume: 800,
};

describe('Candle Utilities', () => {
  describe('isBullish / isBearish', () => {
    it('identifies bullish candle', () => {
      expect(isBullish(bullishCandle)).toBe(true);
      expect(isBearish(bullishCandle)).toBe(false);
    });

    it('identifies bearish candle', () => {
      expect(isBullish(bearishCandle)).toBe(false);
      expect(isBearish(bearishCandle)).toBe(true);
    });

    it('doji counts as bullish (close >= open)', () => {
      expect(isBullish(dojiCandle)).toBe(true);
      expect(isBearish(dojiCandle)).toBe(false);
    });
  });

  describe('bodySize', () => {
    it('calculates bullish body size', () => {
      expect(bodySize(bullishCandle)).toBe(8);
    });

    it('calculates bearish body size', () => {
      expect(bodySize(bearishCandle)).toBe(8);
    });

    it('doji has zero body', () => {
      expect(bodySize(dojiCandle)).toBe(0);
    });
  });

  describe('range', () => {
    it('calculates high-low range', () => {
      expect(range(bullishCandle)).toBe(15);
      expect(range(bearishCandle)).toBe(14);
    });
  });

  describe('wicks', () => {
    it('calculates upper wick', () => {
      expect(upperWick(bullishCandle)).toBe(2); // 110 - 108
      expect(upperWick(bearishCandle)).toBe(4); // 112 - 108
    });

    it('calculates lower wick', () => {
      expect(lowerWick(bullishCandle)).toBe(5); // 100 - 95
      expect(lowerWick(bearishCandle)).toBe(2); // 100 - 98
    });
  });

  describe('bodyTop / bodyBottom', () => {
    it('gets body top and bottom for bullish', () => {
      expect(bodyTop(bullishCandle)).toBe(108);
      expect(bodyBottom(bullishCandle)).toBe(100);
    });

    it('gets body top and bottom for bearish', () => {
      expect(bodyTop(bearishCandle)).toBe(108);
      expect(bodyBottom(bearishCandle)).toBe(100);
    });
  });

  describe('midpoint', () => {
    it('calculates midpoint of range', () => {
      expect(midpoint(bullishCandle)).toBe(102.5); // (110 + 95) / 2
    });
  });

  describe('isValidCandle', () => {
    it('valid candle passes', () => {
      expect(isValidCandle(bullishCandle)).toBe(true);
    });

    it('invalid candle fails (high < low)', () => {
      const bad: Candle = { ...bullishCandle, high: 90 };
      expect(isValidCandle(bad)).toBe(false);
    });

    it('invalid candle fails (negative volume)', () => {
      const bad: Candle = { ...bullishCandle, volume: -1 };
      expect(isValidCandle(bad)).toBe(false);
    });
  });

  describe('timeframeToMs', () => {
    it('converts timeframes correctly', () => {
      expect(timeframeToMs('1m')).toBe(60_000);
      expect(timeframeToMs('5m')).toBe(300_000);
      expect(timeframeToMs('1h')).toBe(3_600_000);
      expect(timeframeToMs('1D')).toBe(86_400_000);
    });
  });

  describe('sortCandles', () => {
    it('sorts by timestamp ascending', () => {
      const unsorted = [bearishCandle, dojiCandle, bullishCandle];
      const sorted = sortCandles(unsorted);
      expect(sorted[0].timestamp).toBe(bullishCandle.timestamp);
      expect(sorted[1].timestamp).toBe(bearishCandle.timestamp);
      expect(sorted[2].timestamp).toBe(dojiCandle.timestamp);
    });
  });

  describe('deduplicateCandles', () => {
    it('removes duplicates by timestamp', () => {
      const duped = [bullishCandle, bullishCandle, bearishCandle];
      const deduped = deduplicateCandles(duped);
      expect(deduped).toHaveLength(2);
    });
  });
});
