/**
 * Manual Zones Parity Tests
 *
 * Since Manual Zones is a static zone list (not calculated from price action),
 * parity testing here means:
 * 1. All 151 zones are parsed correctly
 * 2. Classification matches expected behavior at known prices
 * 3. The SDK runtime renders zones correctly
 */

import { describe, it, expect } from 'vitest';
import { createManualZonesEngine, parseZoneList } from '../../src/indicators/manual-zones.js';
import { manualZonesDefinition } from '../../src/indicators/manual-zones.js';
import { createRuntime } from '../../src/sdk/runtime.js';
import { NQ_ZONES_RAW, NQ_ZONE_COUNT } from '../../src/indicators/zone-data/nq-zones.js';
import type { Candle } from '../../src/engine/types.js';

describe('Manual Zones - Parity', () => {
  describe('Zone Data Integrity', () => {
    const zones = parseZoneList(NQ_ZONES_RAW);

    it('parses exactly 151 zones', () => {
      expect(zones).toHaveLength(NQ_ZONE_COUNT);
    });

    it('all zones have upper > lower', () => {
      for (const z of zones) {
        expect(z.upper).toBeGreaterThan(z.lower);
      }
    });

    it('zones are ordered from highest to lowest', () => {
      for (let i = 1; i < zones.length; i++) {
        expect(zones[i - 1].upper).toBeGreaterThan(zones[i].upper);
      }
    });

    it('no overlapping zones', () => {
      for (let i = 1; i < zones.length; i++) {
        // Previous zone's lower should be above current zone's upper
        expect(zones[i - 1].lower).toBeGreaterThan(zones[i].upper);
      }
    });

    it('zone widths are reasonable (1-10 points)', () => {
      for (const z of zones) {
        expect(z.width).toBeGreaterThanOrEqual(1);
        expect(z.width).toBeLessThanOrEqual(10);
      }
    });

    it('midpoints are correctly calculated', () => {
      for (const z of zones) {
        expect(z.midpoint).toBeCloseTo((z.upper + z.lower) / 2, 10);
      }
    });

    it('highest zone is 30693.75-30688.75', () => {
      expect(zones[0].upper).toBe(30693.75);
      expect(zones[0].lower).toBe(30688.75);
    });

    it('lowest zone is 27199.75-27193.25', () => {
      expect(zones[zones.length - 1].upper).toBe(27199.75);
      expect(zones[zones.length - 1].lower).toBe(27193.25);
    });

    it('price range spans approximately 3500 points', () => {
      const range = zones[0].upper - zones[zones.length - 1].lower;
      expect(range).toBeGreaterThan(3400);
      expect(range).toBeLessThan(3600);
    });

    it('average gap between zones is approximately 23 points', () => {
      let totalGap = 0;
      for (let i = 1; i < zones.length; i++) {
        totalGap += zones[i - 1].lower - zones[i].upper;
      }
      const avgGap = totalGap / (zones.length - 1);
      expect(avgGap).toBeGreaterThan(15);
      expect(avgGap).toBeLessThan(30);
    });
  });

  describe('Classification at Known Prices', () => {
    const engine = createManualZonesEngine(NQ_ZONES_RAW);

    it('price 30000 — classifies zones correctly', () => {
      const result = engine.analyze(30000);
      const resistanceCount = result.zones.filter((z) => z.type === 'resistance').length;
      const supportCount = result.zones.filter((z) => z.type === 'support').length;

      // 30000 is between zone 28 (30024.50-30020.00) and zone 29 (30003.25-29996.75)
      // So zones 0-28 are resistance, zone 29 might be active (30003.25 > 30000), zones 30+ support
      expect(resistanceCount).toBeGreaterThan(25);
      expect(supportCount).toBeGreaterThan(100);
    });

    it('price 29000 — mostly resistance above', () => {
      const result = engine.analyze(29000);
      const resistanceCount = result.zones.filter((z) => z.type === 'resistance').length;
      expect(resistanceCount).toBeGreaterThan(60);
    });

    it('price inside zone 29898.00-29893.50', () => {
      const result = engine.analyze(29895.00);
      expect(result.activeZone).not.toBeNull();
      expect(result.activeZone!.upper).toBe(29898.00);
      expect(result.activeZone!.lower).toBe(29893.50);
    });

    it('price at exact zone boundary (upper)', () => {
      // 30693.75 is the upper of zone 0
      const result = engine.analyze(30693.75);
      expect(result.activeZone).not.toBeNull();
    });

    it('price at exact zone boundary (lower)', () => {
      // 30688.75 is the lower of zone 0
      const result = engine.analyze(30688.75);
      expect(result.activeZone).not.toBeNull();
    });
  });

  describe('SDK Runtime Integration', () => {
    it('renders zones via SDK runtime on last bar', () => {
      const candles: Candle[] = [
        { timestamp: 1700000000000, open: 29890, high: 29910, low: 29885, close: 29900, volume: 1000 },
        { timestamp: 1700000060000, open: 29900, high: 29920, low: 29895, close: 29915, volume: 1200 },
        { timestamp: 1700000120000, open: 29915, high: 29925, low: 29905, close: 29910, volume: 800 },
      ];

      const runtime = createRuntime(manualZonesDefinition, {
        symbol: 'NQ',
        timeframe: '1m',
        inputOverrides: {
          zoneData: NQ_ZONES_RAW,
          nearestCount: 3,
        },
      });

      const output = runtime.processBatch(candles);
      const zones = output.objects.filter((o) => o.type === 'zone');

      // Should have rendered many zones
      expect(zones.length).toBeGreaterThan(0);
    });
  });
});
