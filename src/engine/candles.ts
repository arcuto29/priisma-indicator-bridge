/**
 * Candle utilities and helpers.
 * Provides common operations on candle data used by indicator engines.
 */

import type { Candle, Timeframe } from './types.js';

/**
 * Check if a candle is bullish (close >= open)
 */
export function isBullish(candle: Candle): boolean {
  return candle.close >= candle.open;
}

/**
 * Check if a candle is bearish (close < open)
 */
export function isBearish(candle: Candle): boolean {
  return candle.close < candle.open;
}

/**
 * Get the body size of a candle (absolute difference between open and close)
 */
export function bodySize(candle: Candle): number {
  return Math.abs(candle.close - candle.open);
}

/**
 * Get the full range of a candle (high - low)
 */
export function range(candle: Candle): number {
  return candle.high - candle.low;
}

/**
 * Get the upper wick size
 */
export function upperWick(candle: Candle): number {
  const top = Math.max(candle.open, candle.close);
  return candle.high - top;
}

/**
 * Get the lower wick size
 */
export function lowerWick(candle: Candle): number {
  const bottom = Math.min(candle.open, candle.close);
  return bottom - candle.low;
}

/**
 * Get the body top (higher of open/close)
 */
export function bodyTop(candle: Candle): number {
  return Math.max(candle.open, candle.close);
}

/**
 * Get the body bottom (lower of open/close)
 */
export function bodyBottom(candle: Candle): number {
  return Math.min(candle.open, candle.close);
}

/**
 * Calculate the midpoint of a candle's range
 */
export function midpoint(candle: Candle): number {
  return (candle.high + candle.low) / 2;
}

/**
 * Validate that a candle has sensible data
 */
export function isValidCandle(candle: Candle): boolean {
  return (
    candle.timestamp > 0 &&
    candle.high >= candle.low &&
    candle.high >= candle.open &&
    candle.high >= candle.close &&
    candle.low <= candle.open &&
    candle.low <= candle.close &&
    candle.volume >= 0
  );
}

/**
 * Convert timeframe string to milliseconds
 */
export function timeframeToMs(timeframe: Timeframe): number {
  const map: Record<Timeframe, number> = {
    '1m': 60_000,
    '3m': 180_000,
    '5m': 300_000,
    '15m': 900_000,
    '30m': 1_800_000,
    '1h': 3_600_000,
    '2h': 7_200_000,
    '4h': 14_400_000,
    '1D': 86_400_000,
    '1W': 604_800_000,
    '1M': 2_592_000_000, // approximate 30 days
  };
  return map[timeframe];
}

/**
 * Sort candles by timestamp ascending
 */
export function sortCandles(candles: Candle[]): Candle[] {
  return [...candles].sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Remove duplicate candles (same timestamp)
 */
export function deduplicateCandles(candles: Candle[]): Candle[] {
  const seen = new Set<number>();
  return candles.filter((c) => {
    if (seen.has(c.timestamp)) return false;
    seen.add(c.timestamp);
    return true;
  });
}
