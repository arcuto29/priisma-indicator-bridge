/**
 * Unit tests for Manual Zones — static FIXED zone parsing and proximity
 */

import { describe, it, expect } from 'vitest';
import {
  parseZoneList,
  parseZoneArray,
  classifyZones,
  analyzeProximity,
  formatZoneDisplay,
  createManualZonesEngine,
} from '../../src/indicators/manual-zones.js';
import { NQ_ZONES_RAW, NQ_ZONE_COUNT } from '../../src/indicators/zone-data/nq-zones.js';

// ─── Sample data ─────────────────────────────────────────────────────────────

const SAMPLE_RAW = `30693.75,30688.75
30666.25,30662.50
30646.50,30641.00
30625.25,30621.75
30601.25,30598.00`;

const SAMPLE_ARRAY: Array<[number, number]> = [
  [30693.75, 30688.75],
  [30666.25, 30662.50],
  [30646.50, 30641.00],
  [30625.25, 30621.75],
  [30601.25, 30598.00],
];

// ─── parseZoneList ───────────────────────────────────────────────────────────

describe('parseZoneList', () => {
  it('parses a basic zone list string', () => {
    const zones = parseZoneList(SAMPLE_RAW);
    expect(zones).toHaveLength(5);
  });

  it('correctly sets upper/lower/midpoint', () => {
    const zones = parseZoneList(SAMPLE_RAW);
    expect(zones[0].upper).toBe(30693.75);
    expect(zones[0].lower).toBe(30688.75);
    expect(zones[0].midpoint).toBe((30693.75 + 30688.75) / 2);
    expect(zones[0].width).toBeCloseTo(5.0, 2);
  });

  it('assigns sequential IDs', () => {
    const zones = parseZoneList(SAMPLE_RAW);
    expect(zones[0].id).toBe('zone_0');
    expect(zones[4].id).toBe('zone_4');
  });

  it('handles whitespace and blank lines', () => {
    const messy = `
      30693.75, 30688.75

      30666.25, 30662.50
    `;
    const zones = parseZoneList(messy);
    expect(zones).toHaveLength(2);
    expect(zones[0].upper).toBe(30693.75);
  });

  it('ignores comment lines (# and //)', () => {
    const withComments = `# Header
30693.75,30688.75
// This is a comment
30666.25,30662.50`;
    const zones = parseZoneList(withComments);
    expect(zones).toHaveLength(2);
  });

  it('handles reversed order (lower,upper)', () => {
    const reversed = '30688.75,30693.75';
    const zones = parseZoneList(reversed);
    expect(zones[0].upper).toBe(30693.75);
    expect(zones[0].lower).toBe(30688.75);
  });

  it('skips invalid lines gracefully', () => {
    const withBad = `30693.75,30688.75
not,a,number
30666.25,30662.50
single_value`;
    const zones = parseZoneList(withBad);
    expect(zones).toHaveLength(2);
  });

  it('returns empty array for empty string', () => {
    expect(parseZoneList('')).toHaveLength(0);
  });

  it('parses the full NQ zone data correctly', () => {
    const zones = parseZoneList(NQ_ZONES_RAW);
    expect(zones).toHaveLength(NQ_ZONE_COUNT);
    expect(zones[0].upper).toBe(30693.75);
    expect(zones[0].lower).toBe(30688.75);
    expect(zones[zones.length - 1].upper).toBe(27199.75);
    expect(zones[zones.length - 1].lower).toBe(27193.25);
  });
});

// ─── parseZoneArray ──────────────────────────────────────────────────────────

describe('parseZoneArray', () => {
  it('parses a 2D array of zones', () => {
    const zones = parseZoneArray(SAMPLE_ARRAY);
    expect(zones).toHaveLength(5);
    expect(zones[0].upper).toBe(30693.75);
  });

  it('handles reversed pairs', () => {
    const reversed: Array<[number, number]> = [[100, 200]];
    const zones = parseZoneArray(reversed);
    expect(zones[0].upper).toBe(200);
    expect(zones[0].lower).toBe(100);
  });
});

// ─── classifyZones (position relative to price) ─────────────────────────────

describe('classifyZones', () => {
  const zones = parseZoneList(SAMPLE_RAW);

  it('zones above price get position=above', () => {
    const classified = classifyZones(zones, 30500);
    expect(classified.every((z) => z.position === 'above')).toBe(true);
  });

  it('zones below price get position=below', () => {
    const classified = classifyZones(zones, 30700);
    expect(classified.every((z) => z.position === 'below')).toBe(true);
  });

  it('zone containing price gets position=containing', () => {
    const classified = classifyZones(zones, 30691.00);
    const containing = classified.filter((z) => z.position === 'containing');
    expect(containing).toHaveLength(1);
    expect(containing[0].upper).toBe(30693.75);
  });

  it('correctly splits above/below around price', () => {
    const classified = classifyZones(zones, 30635);
    const above = classified.filter((z) => z.position === 'above');
    const below = classified.filter((z) => z.position === 'below');
    expect(above.length).toBe(3);
    expect(below.length).toBe(2);
  });

  it('calculates distance from price', () => {
    const classified = classifyZones(zones, 30650);
    const first = classified[0]; // upper: 30693.75, mid: 30691.25
    expect(first.distanceFromPrice).toBeCloseTo(Math.abs(30691.25 - 30650), 2);
  });
});

// ─── analyzeProximity ────────────────────────────────────────────────────────

describe('analyzeProximity', () => {
  const zones = parseZoneList(NQ_ZONES_RAW);

  it('finds 3 nearest zones above price', () => {
    const result = analyzeProximity(zones, 29900, 3);
    expect(result.nearestAbove).toHaveLength(3);
    // Sorted by distance (nearest first)
    expect(result.nearestAbove[0].distanceFromPrice)
      .toBeLessThanOrEqual(result.nearestAbove[1].distanceFromPrice);
    // All above price
    expect(result.nearestAbove.every((z) => z.lower > 29900)).toBe(true);
  });

  it('finds 3 nearest zones below price', () => {
    const result = analyzeProximity(zones, 29900, 3);
    expect(result.nearestBelow).toHaveLength(3);
    // All below price
    expect(result.nearestBelow.every((z) => z.upper < 29900)).toBe(true);
    // Nearest first
    expect(result.nearestBelow[0].distanceFromPrice)
      .toBeLessThanOrEqual(result.nearestBelow[1].distanceFromPrice);
  });

  it('detects containing zone when price is inside', () => {
    const result = analyzeProximity(zones, 29895.00);
    expect(result.containingZone).not.toBeNull();
    expect(result.containingZone!.upper).toBe(29898.00);
    expect(result.containingZone!.lower).toBe(29893.50);
  });

  it('returns null containingZone when price is between zones', () => {
    const result = analyzeProximity(zones, 29910.00);
    expect(result.containingZone).toBeNull();
  });

  it('marks nearest zones with isNearest=true', () => {
    const result = analyzeProximity(zones, 29900, 3);
    const nearestCount = result.zones.filter((z) => z.isNearest).length;
    // 3 above + 3 below = 6
    expect(nearestCount).toBe(6);
  });

  it('handles price above all zones', () => {
    const result = analyzeProximity(zones, 31000, 3);
    expect(result.nearestAbove).toHaveLength(0);
    expect(result.nearestBelow).toHaveLength(3);
  });

  it('handles price below all zones', () => {
    const result = analyzeProximity(zones, 27000, 3);
    expect(result.nearestBelow).toHaveLength(0);
    expect(result.nearestAbove).toHaveLength(3);
  });

  it('stores currentPrice in result', () => {
    const result = analyzeProximity(zones, 29500);
    expect(result.currentPrice).toBe(29500);
  });

  it('zones array is always the full set (fixed)', () => {
    const result = analyzeProximity(zones, 29500);
    expect(result.zones).toHaveLength(NQ_ZONE_COUNT);
  });
});

// ─── formatZoneDisplay ───────────────────────────────────────────────────────

describe('formatZoneDisplay', () => {
  const zones = parseZoneList(NQ_ZONES_RAW);

  it('produces formatted display string', () => {
    const result = analyzeProximity(zones, 29900, 3);
    const display = formatZoneDisplay(result, { symbol: 'NQ' });

    expect(display).toContain('NQ Manual Zones');
    expect(display).toContain('29900.00');
    expect(display).toContain('NEXT ABOVE');
    expect(display).toContain('NEXT BELOW');
  });

  it('shows containing zone when price is inside one', () => {
    const result = analyzeProximity(zones, 29895.00);
    const display = formatZoneDisplay(result);

    expect(display).toContain('IN ZONE');
    expect(display).toContain('29898.00');
    expect(display).toContain('29893.50');
  });

  it('shows distance from price', () => {
    const result = analyzeProximity(zones, 29900, 3);
    const display = formatZoneDisplay(result);

    expect(display).toMatch(/\+\d+\.\d+/);
    expect(display).toMatch(/-\d+\.\d+/);
  });

  it('respects showAll option', () => {
    const result = analyzeProximity(zones, 29900, 3);
    const display = formatZoneDisplay(result, { showAll: true, maxDisplay: 200 });

    expect(display).toContain('All Zones (fixed)');
  });

  it('shows zone count overflow message when limited', () => {
    const result = analyzeProximity(zones, 29900);
    const display = formatZoneDisplay(result, { showAll: true, maxDisplay: 10 });

    expect(display).toContain('more zones');
  });
});

// ─── ManualZonesEngine (standalone) ──────────────────────────────────────────

describe('ManualZonesEngine', () => {
  it('creates from raw string', () => {
    const engine = createManualZonesEngine(NQ_ZONES_RAW);
    expect(engine.zoneCount).toBe(NQ_ZONE_COUNT);
  });

  it('creates from array', () => {
    const engine = createManualZonesEngine(SAMPLE_ARRAY);
    expect(engine.zoneCount).toBe(5);
  });

  it('creates empty and loads later', () => {
    const engine = createManualZonesEngine();
    expect(engine.zoneCount).toBe(0);
    engine.loadFromString(SAMPLE_RAW);
    expect(engine.zoneCount).toBe(5);
  });

  it('analyze returns proximity result with nearest 3', () => {
    const engine = createManualZonesEngine(NQ_ZONES_RAW);
    const result = engine.analyze(29900);

    expect(result.currentPrice).toBe(29900);
    expect(result.nearestAbove.length).toBe(3);
    expect(result.nearestBelow.length).toBe(3);
  });

  it('display returns formatted string', () => {
    const engine = createManualZonesEngine(NQ_ZONES_RAW);
    const display = engine.display(29900, { symbol: 'NQ' });

    expect(display).toContain('NQ Manual Zones');
    expect(display).toContain('NEXT ABOVE');
    expect(display).toContain('NEXT BELOW');
  });

  it('getZones returns all parsed zones (never changes)', () => {
    const engine = createManualZonesEngine(SAMPLE_RAW);
    const zones = engine.getZones();
    expect(zones).toHaveLength(5);
    expect(zones[0].upper).toBe(30693.75);
  });

  it('zones are the same regardless of price', () => {
    const engine = createManualZonesEngine(NQ_ZONES_RAW);
    const zones1 = engine.getZones();
    engine.analyze(25000); // price far below
    const zones2 = engine.getZones();
    engine.analyze(35000); // price far above
    const zones3 = engine.getZones();

    // Zones never change
    expect(zones1).toEqual(zones2);
    expect(zones2).toEqual(zones3);
  });
});
