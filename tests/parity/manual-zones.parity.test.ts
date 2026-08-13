/**
 * LVN Zones Parity Tests
 *
 * Since LVN Zones is a FIXED zone list, parity means:
 * 1. All 148 zones are parsed correctly
 * 2. Zones never change regardless of price
 * 3. Proximity info is correct
 * 4. SDK runtime renders all zones
 */

import { describe, it, expect } from 'vitest';
import { createManualZonesEngine, parseZoneList } from '../../src/indicators/manual-zones.js';
import { manualZonesDefinition } from '../../src/indicators/manual-zones.js';
import { createRuntime } from '../../src/sdk/runtime.js';
import { NQ_ZONES_RAW, NQ_ZONE_COUNT } from '../../src/indicators/zone-data/nq-zones.js';
import type { Candle } from '../../src/engine/types.js';

describe('LVN Zones - Fixed Zone Integrity', () => {
  describe('Zone Data', () => {
    const zones = parseZoneList(NQ_ZONES_RAW);

    it('parses exactly 148 zones', () => {
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
        expect(zones[i - 1].lower).toBeGreaterThan(zones[i].upper);
      }
    });

    it('zone widths are 1-10 points', () => {
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

    it('price range spans ~3500 points', () => {
      const range = zones[0].upper - zones[zones.length - 1].lower;
      expect(range).toBeGreaterThan(3400);
      expect(range).toBeLessThan(3600);
    });

    it('average gap between zones is ~23 points', () => {
      let totalGap = 0;
      for (let i = 1; i < zones.length; i++) {
        totalGap += zones[i - 1].lower - zones[i].upper;
      }
      const avgGap = totalGap / (zones.length - 1);
      expect(avgGap).toBeGreaterThan(15);
      expect(avgGap).toBeLessThan(30);
    });
  });

  describe('Zones are FIXED (never change)', () => {
    it('same zones at any price', () => {
      const engine = createManualZonesEngine(NQ_ZONES_RAW);
      const zones = engine.getZones();

      // Analyze at wildly different prices — zones themselves stay the same
      engine.analyze(25000);
      expect(engine.getZones()).toEqual(zones);
      engine.analyze(35000);
      expect(engine.getZones()).toEqual(zones);
      engine.analyze(29500);
      expect(engine.getZones()).toEqual(zones);
    });

    it('zone count never changes', () => {
      const engine = createManualZonesEngine(NQ_ZONES_RAW);
      expect(engine.zoneCount).toBe(NQ_ZONE_COUNT);
      engine.analyze(30000);
      expect(engine.zoneCount).toBe(NQ_ZONE_COUNT);
    });
  });

  describe('Proximity at Known Prices', () => {
    const engine = createManualZonesEngine(NQ_ZONES_RAW);

    it('price 29895 is inside zone 29898.00-29893.50', () => {
      const result = engine.analyze(29895.00);
      expect(result.containingZone).not.toBeNull();
      expect(result.containingZone!.upper).toBe(29898.00);
      expect(result.containingZone!.lower).toBe(29893.50);
    });

    it('price at exact upper boundary counts as inside', () => {
      const result = engine.analyze(30693.75);
      expect(result.containingZone).not.toBeNull();
    });

    it('price at exact lower boundary counts as inside', () => {
      const result = engine.analyze(30688.75);
      expect(result.containingZone).not.toBeNull();
    });

    it('nearest 3 above are correct at 29900', () => {
      const result = engine.analyze(29900, 3);
      expect(result.nearestAbove[0].lower).toBe(29915.25);
      expect(result.nearestAbove[1].lower).toBe(29938.00);
      expect(result.nearestAbove[2].lower).toBe(29969.75);
    });

    it('nearest 3 below are correct at 29900', () => {
      const result = engine.analyze(29900, 3);
      expect(result.nearestBelow[0].upper).toBe(29898.00);
      expect(result.nearestBelow[1].upper).toBe(29877.00);
      expect(result.nearestBelow[2].upper).toBe(29851.50);
    });
  });

  describe('SDK Runtime', () => {
    it('renders all zones on first bar', () => {
      const candles: Candle[] = [
        { timestamp: 1700000000000, open: 29890, high: 29910, low: 29885, close: 29900, volume: 1000 },
        { timestamp: 1700000060000, open: 29900, high: 29920, low: 29895, close: 29915, volume: 1200 },
      ];

      const runtime = createRuntime(manualZonesDefinition, {
        symbol: 'NQ',
        timeframe: '1m',
        inputOverrides: { zoneData: NQ_ZONES_RAW },
      });

      const output = runtime.processBatch(candles);
      const zones = output.objects.filter((o) => o.type === 'zone');

      // All 148 zones should be rendered (they're fixed)
      expect(zones.length).toBe(NQ_ZONE_COUNT);
    });
  });
});
