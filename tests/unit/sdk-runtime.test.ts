/**
 * Unit tests for the Priisma SDK Runtime
 */

import { describe, it, expect } from 'vitest';
import { defineIndicator } from '../../src/sdk/define-indicator.js';
import { createRuntime } from '../../src/sdk/runtime.js';
import type { Candle } from '../../src/engine/types.js';

const sampleCandles: Candle[] = [
  { timestamp: 1700000000000, open: 100, high: 105, low: 95, close: 103, volume: 500 },
  { timestamp: 1700000060000, open: 103, high: 108, low: 101, close: 106, volume: 600 },
  { timestamp: 1700000120000, open: 106, high: 110, low: 104, close: 109, volume: 700 },
  { timestamp: 1700000180000, open: 109, high: 112, low: 107, close: 111, volume: 550 },
  { timestamp: 1700000240000, open: 111, high: 113, low: 108, close: 110, volume: 450 },
  { timestamp: 1700000300000, open: 110, high: 114, low: 109, close: 113, volume: 650 },
  { timestamp: 1700000360000, open: 113, high: 116, low: 112, close: 115, volume: 700 },
  { timestamp: 1700000420000, open: 115, high: 118, low: 113, close: 117, volume: 800 },
  { timestamp: 1700000480000, open: 117, high: 120, low: 115, close: 119, volume: 900 },
  { timestamp: 1700000540000, open: 119, high: 121, low: 116, close: 118, volume: 750 },
  { timestamp: 1700000600000, open: 118, high: 120, low: 115, close: 116, volume: 600 },
  { timestamp: 1700000660000, open: 116, high: 119, low: 114, close: 117, volume: 550 },
  { timestamp: 1700000720000, open: 117, high: 121, low: 116, close: 120, volume: 800 },
  { timestamp: 1700000780000, open: 120, high: 123, low: 118, close: 122, volume: 850 },
  { timestamp: 1700000840000, open: 122, high: 125, low: 120, close: 124, volume: 900 },
];

describe('SDK Runtime', () => {
  describe('defineIndicator', () => {
    it('creates an indicator definition with defaults', () => {
      const ind = defineIndicator({
        name: 'Test Indicator',
        calculate: () => {},
      });

      expect(ind.meta.name).toBe('Test Indicator');
      expect(ind.meta.version).toBe('1.0.0');
      expect(ind.meta.overlay).toBe(true);
      expect(ind.inputs).toHaveLength(0);
    });

    it('respects provided metadata', () => {
      const ind = defineIndicator({
        name: 'Custom',
        version: '2.0.0',
        author: 'tester',
        overlay: false,
        calculate: () => {},
      });

      expect(ind.meta.version).toBe('2.0.0');
      expect(ind.meta.author).toBe('tester');
      expect(ind.meta.overlay).toBe(false);
    });
  });

  describe('createRuntime', () => {
    it('processes a batch of candles and produces output', () => {
      const indicator = defineIndicator({
        name: 'Simple Plot',
        calculate(ctx) {
          ctx.plot('close', ctx.close);
        },
      });

      const runtime = createRuntime(indicator, {
        symbol: 'NQ',
        timeframe: '1m',
      });

      const output = runtime.processBatch(sampleCandles);
      expect(output.indicatorId).toBe('Simple Plot');
      expect(output.objects.length).toBeGreaterThan(0);

      const series = output.objects.find((o) => o.type === 'series');
      expect(series).toBeDefined();
      if (series && series.type === 'series') {
        expect(series.values).toHaveLength(sampleCandles.length);
        expect(series.values[0].value).toBe(103);
      }
    });

    it('supports persistent state across bars', () => {
      const indicator = defineIndicator({
        name: 'State Test',
        init(ctx) {
          ctx.state.counter = 0;
        },
        calculate(ctx) {
          ctx.state.counter = (ctx.state.counter as number) + 1;
          ctx.plot('counter', ctx.state.counter as number);
        },
      });

      const runtime = createRuntime(indicator, {
        symbol: 'NQ',
        timeframe: '1m',
      });

      const output = runtime.processBatch(sampleCandles);
      const series = output.objects.find((o) => o.type === 'series') as any;
      expect(series.values[0].value).toBe(1);
      expect(series.values[14].value).toBe(15);
    });

    it('supports zone creation and removal', () => {
      const indicator = defineIndicator({
        name: 'Zone Test',
        calculate(ctx) {
          if (ctx.barIndex === 2) {
            ctx.zone('test_zone', 110, 105, { type: 'resistance' });
          }
          if (ctx.barIndex === 8) {
            ctx.removeZone('test_zone');
          }
        },
      });

      const runtime = createRuntime(indicator, {
        symbol: 'NQ',
        timeframe: '1m',
      });

      const output = runtime.processBatch(sampleCandles);
      const zones = output.objects.filter((o) => o.type === 'zone');
      expect(zones).toHaveLength(1);

      const zone = zones[0];
      if (zone.type === 'zone') {
        expect(zone.upper).toBe(110);
        expect(zone.lower).toBe(105);
        expect(zone.zoneType).toBe('resistance');
        expect(zone.invalidated).toBe(true);
      }
    });

    it('ta.sma calculates correctly', () => {
      const indicator = defineIndicator({
        name: 'SMA Test',
        calculate(ctx) {
          const sma5 = ctx.ta.sma(ctx.closeSeries, 5);
          ctx.plot('sma5', sma5);
        },
      });

      const runtime = createRuntime(indicator, {
        symbol: 'NQ',
        timeframe: '1m',
      });

      const output = runtime.processBatch(sampleCandles);
      const series = output.objects.find((o) => o.type === 'series') as any;

      // First 4 bars should be null (not enough data for 5-period SMA)
      expect(series.values[0].value).toBeNull();
      expect(series.values[3].value).toBeNull();

      // 5th bar: (103+106+109+111+110)/5 = 107.8
      expect(series.values[4].value).toBeCloseTo(107.8, 1);
    });

    it('ta.atr calculates correctly', () => {
      const indicator = defineIndicator({
        name: 'ATR Test',
        calculate(ctx) {
          const atr5 = ctx.ta.atr(5);
          ctx.plot('atr5', atr5);
        },
      });

      const runtime = createRuntime(indicator, {
        symbol: 'NQ',
        timeframe: '1m',
      });

      const output = runtime.processBatch(sampleCandles);
      const series = output.objects.find((o) => o.type === 'series') as any;

      // First 5 bars should be null
      expect(series.values[0].value).toBeNull();
      expect(series.values[4].value).toBeNull();

      // 6th bar should have a value
      expect(series.values[5].value).not.toBeNull();
      expect(series.values[5].value).toBeGreaterThan(0);
    });

    it('supports plotShape with condition', () => {
      const indicator = defineIndicator({
        name: 'Shape Test',
        calculate(ctx) {
          // Plot a marker whenever close > 115
          ctx.plotShape(ctx.close > 115, { shape: 'triangleup', location: 'belowbar' });
        },
      });

      const runtime = createRuntime(indicator, {
        symbol: 'NQ',
        timeframe: '1m',
      });

      const output = runtime.processBatch(sampleCandles);
      const markers = output.objects.filter((o) => o.type === 'marker');
      // Candles with close > 115: indices 6(115 no),7(117),8(119),9(118),10(116),11(117),12(120),13(122),14(124)
      // Actually: close values are 103,106,109,111,110,113,115,117,119,118,116,117,120,122,124
      // > 115: indices 7,8,9,10,11,12,13,14 = 8 markers (116 > 115 yes)
      expect(markers.length).toBe(8);
    });

    it('supports inputs with overrides', () => {
      const indicator = defineIndicator({
        name: 'Input Test',
        inputs: [
          { key: 'length', label: 'Length', type: 'integer', defaultValue: 10 },
        ],
        calculate(ctx) {
          const len = ctx.inputs.length as number;
          ctx.plot('len', len);
        },
      });

      // Test with override
      const runtime = createRuntime(indicator, {
        symbol: 'NQ',
        timeframe: '1m',
        inputOverrides: { length: 20 },
      });

      const output = runtime.processBatch(sampleCandles.slice(0, 3));
      const series = output.objects.find((o) => o.type === 'series') as any;
      expect(series.values[0].value).toBe(20);
    });
  });
});
