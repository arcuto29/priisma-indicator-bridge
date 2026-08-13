/**
 * Unit tests for the Mock Provider
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMockProvider, MockProvider } from '../../src/data/mock-provider.js';
import type { Candle } from '../../src/engine/types.js';

const sampleCandles: Candle[] = [
  { timestamp: 1700000000000, open: 100, high: 105, low: 95, close: 103, volume: 500 },
  { timestamp: 1700000060000, open: 103, high: 108, low: 101, close: 106, volume: 600 },
  { timestamp: 1700000120000, open: 106, high: 110, low: 104, close: 109, volume: 700 },
  { timestamp: 1700000180000, open: 109, high: 112, low: 107, close: 111, volume: 550 },
  { timestamp: 1700000240000, open: 111, high: 113, low: 108, close: 110, volume: 450 },
];

describe('MockProvider', () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = createMockProvider({
      'NQ:1m': sampleCandles,
    });
  });

  it('starts disconnected', () => {
    expect(provider.connected).toBe(false);
  });

  it('connects and disconnects', async () => {
    await provider.connect();
    expect(provider.connected).toBe(true);
    await provider.disconnect();
    expect(provider.connected).toBe(false);
  });

  it('returns historical candles within date range', async () => {
    const start = new Date(1700000060000);
    const end = new Date(1700000180000);
    const candles = await provider.getHistorical('NQ', '1m', start, end);
    expect(candles).toHaveLength(3);
    expect(candles[0].timestamp).toBe(1700000060000);
    expect(candles[2].timestamp).toBe(1700000180000);
  });

  it('returns empty array for unknown symbol', async () => {
    const candles = await provider.getHistorical(
      'ES',
      '1m',
      new Date(0),
      new Date()
    );
    expect(candles).toHaveLength(0);
  });

  it('can load candles dynamically', () => {
    const newCandles: Candle[] = [
      { timestamp: 1700001000000, open: 200, high: 205, low: 195, close: 203, volume: 100 },
    ];
    provider.loadCandles('ES', '5m', newCandles);
    const result = provider.getAllCandles('ES', '5m');
    expect(result).toHaveLength(1);
    expect(result[0].open).toBe(200);
  });

  it('getAllCandles returns all without date filter', () => {
    const all = provider.getAllCandles('NQ', '1m');
    expect(all).toHaveLength(5);
  });
});
