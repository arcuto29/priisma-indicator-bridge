/**
 * Unit tests for Manual Zones — static zone parsing, classification, and proximity
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

  it('assigns sequential index values', () => {
    const zones = parseZoneList(SAMPLE_RAW);
    expect(zones[0].index).toBe(0);
    expect(zones[4].index).toBe(4);
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
    // Highest zone
    expect(zones[0].upper).toBe(30693.75);
    expect(zones[0].lower).toBe(30688.75);
    // Lowest zone
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
    expect(zones[0].lower).toBe(30688.75);
  });

  it('handles reversed pairs', () => {
    const reversed: Array<[number, number]> = [[100, 200]];
    const zones = parseZoneArray(reversed);
    expect(zones[0].upper).toBe(200);
    expect(zones[0].lower).toBe(100);
  });
});

// ─── classifyZones ───────────────────────────────────────────────────────────

describe('classifyZones', () => {
  const zones = parseZoneList(SAMPLE_RAW);

  it('classifies zones above price as resistance', () => {
    const classified = classifyZones(zones, 30500);
    // All 5 zones are above 30500
    expect(classified.every((z) => z.type === 'resistance')).toBe(true);
  });

  it('classifies zones below price as support', () => {
    const classified = classifyZones(zones, 30700);
    // All 5 zones are below 30700
    expect(classified.every((z) => z.type === 'support')).toBe(true);
  });

  it('classifies zone as active when price is inside', () => {
    // Price inside the first zone (30688.75 – 30693.75)
    const classified = classifyZones(zones, 30691.00);
    const active = classified.filter((z) => z.type === 'active');
    expect(active).toHaveLength(1);
    expect(active[0].upper).toBe(30693.75);
  });

  it('correctly splits resistance and support around price', () => {
    // Price between zone[2] and zone[3]: 30641-30646.50 ... 30621.75-30625.25
    const classified = classifyZones(zones, 30635);
    const resistance = classified.filter((z) => z.type === 'resistance');
    const support = classified.filter((z) => z.type === 'support');
    expect(resistance.length).toBe(3); // zones 0, 1, 2
    expect(support.length).toBe(2); // zones 3, 4
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

  it('finds nearest resistance zones', () => {
    const result = analyzeProximity(zones, 29900, 3);
    expect(result.nearestResistance).toHaveLength(3);
    // They should be sorted by distance (nearest first)
    expect(result.nearestResistance[0].distanceFromPrice)
      .toBeLessThanOrEqual(result.nearestResistance[1].distanceFromPrice);
    // They should all be above price
    expect(result.nearestResistance.every((z) => z.lower > 29900)).toBe(true);
  });

  it('finds nearest support zones', () => {
    const result = analyzeProximity(zones, 29900, 3);
    expect(result.nearestSupport).toHaveLength(3);
    // They should all be below price
    expect(result.nearestSupport.every((z) => z.upper < 29900)).toBe(true);
    // Nearest first
    expect(result.nearestSupport[0].distanceFromPrice)
      .toBeLessThanOrEqual(result.nearestSupport[1].distanceFromPrice);
  });

  it('detects active zone when price is inside one', () => {
    // Put price inside a known zone: 29898.00,29893.50
    const result = analyzeProximity(zones, 29895.00);
    expect(result.activeZone).not.toBeNull();
    expect(result.activeZone!.upper).toBe(29898.00);
    expect(result.activeZone!.lower).toBe(29893.50);
  });

  it('returns null activeZone when price is between zones', () => {
    // Price between zones (not inside any)
    const result = analyzeProximity(zones, 29910.00);
    expect(result.activeZone).toBeNull();
  });

  it('marks nearest zones with isNearest=true', () => {
    const result = analyzeProximity(zones, 29900, 2);
    const nearestCount = result.zones.filter((z) => z.isNearest).length;
    // Should be 2 resistance + 2 support (or +1 if active)
    expect(nearestCount).toBeGreaterThanOrEqual(4);
    expect(nearestCount).toBeLessThanOrEqual(5);
  });

  it('handles price above all zones', () => {
    const result = analyzeProximity(zones, 31000);
    expect(result.nearestResistance).toHaveLength(0);
    expect(result.nearestSupport).toHaveLength(3);
  });

  it('handles price below all zones', () => {
    const result = analyzeProximity(zones, 27000);
    expect(result.nearestSupport).toHaveLength(0);
    expect(result.nearestResistance).toHaveLength(3);
  });

  it('stores currentPrice in result', () => {
    const result = analyzeProximity(zones, 29500);
    expect(result.currentPrice).toBe(29500);
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
    expect(display).toContain('RESISTANCE');
    expect(display).toContain('SUPPORT');
  });

  it('shows active zone when price is inside one', () => {
    const result = analyzeProximity(zones, 29895.00);
    const display = formatZoneDisplay(result);

    expect(display).toContain('IN ZONE');
    expect(display).toContain('29898.00');
    expect(display).toContain('29893.50');
  });

  it('shows distance from price', () => {
    const result = analyzeProximity(zones, 29900, 3);
    const display = formatZoneDisplay(result);

    // Should contain + and - distance values
    expect(display).toMatch(/\+\d+\.\d+/);
    expect(display).toMatch(/-\d+\.\d+/);
  });

  it('respects showAll option', () => {
    const result = analyzeProximity(zones, 29900, 3);
    const display = formatZoneDisplay(result, { showAll: true, maxDisplay: 200 });

    expect(display).toContain('All Zones');
    expect(display).toContain('[R]');
    expect(display).toContain('[S]');
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

  it('analyze returns proximity result', () => {
    const engine = createManualZonesEngine(NQ_ZONES_RAW);
    const result = engine.analyze(29900, 3);

    expect(result.currentPrice).toBe(29900);
    expect(result.nearestResistance.length).toBe(3);
    expect(result.nearestSupport.length).toBe(3);
  });

  it('display returns formatted string', () => {
    const engine = createManualZonesEngine(NQ_ZONES_RAW);
    const display = engine.display(29900, { symbol: 'NQ' });

    expect(display).toContain('NQ Manual Zones');
    expect(display).toContain('RESISTANCE');
    expect(display).toContain('SUPPORT');
  });

  it('getZones returns all parsed zones', () => {
    const engine = createManualZonesEngine(SAMPLE_RAW);
    const zones = engine.getZones();
    expect(zones).toHaveLength(5);
    expect(zones[0].upper).toBe(30693.75);
  });

  it('loadFromArray replaces existing zones', () => {
    const engine = createManualZonesEngine(NQ_ZONES_RAW);
    expect(engine.zoneCount).toBe(NQ_ZONE_COUNT);
    engine.loadFromArray(SAMPLE_ARRAY);
    expect(engine.zoneCount).toBe(5);
  });
});
