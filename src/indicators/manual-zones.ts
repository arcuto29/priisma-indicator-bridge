/**
 * Manual Zones Indicator
 *
 * This indicator displays pre-defined static price zones provided by the user.
 * These zones represent support/resistance levels that are NOT calculated from
 * price action — they are a fixed grid of levels provided externally.
 *
 * The indicator:
 * 1. Parses a zone list (upper,lower per line)
 * 2. Classifies zones as support/resistance relative to current price
 * 3. Displays them with proximity awareness
 * 4. Highlights the nearest zones above and below price
 */

import type { Color } from '../engine/output.js';
import { defineIndicator } from '../sdk/define-indicator.js';
import type { IndicatorDefinition } from '../sdk/define-indicator.js';
import type { IndicatorInput } from '../engine/inputs.js';

// ─── Zone Data ───────────────────────────────────────────────────────────────

/**
 * A single static zone (upper/lower boundary pair)
 */
export interface StaticZone {
  /** Unique ID */
  id: string;
  /** Upper boundary price */
  upper: number;
  /** Lower boundary price */
  lower: number;
  /** Midpoint */
  midpoint: number;
  /** Zone width in points */
  width: number;
  /** Index in the original list (0 = highest) */
  index: number;
}

/**
 * Zone classified relative to current price
 */
export interface ClassifiedZone extends StaticZone {
  /** Support (below price) or resistance (above price) */
  type: 'support' | 'resistance' | 'active';
  /** Distance from current price to zone midpoint */
  distanceFromPrice: number;
  /** Whether this is one of the nearest zones to current price */
  isNearest: boolean;
}

/**
 * Proximity analysis result
 */
export interface ZoneProximityResult {
  /** All classified zones */
  zones: ClassifiedZone[];
  /** Nearest resistance zone(s) above price */
  nearestResistance: ClassifiedZone[];
  /** Nearest support zone(s) below price */
  nearestSupport: ClassifiedZone[];
  /** Zone that price is currently inside (if any) */
  activeZone: ClassifiedZone | null;
  /** Current price used for classification */
  currentPrice: number;
}

// ─── Zone Parsing ────────────────────────────────────────────────────────────

/**
 * Parse a raw zone list string into StaticZone objects.
 *
 * Accepted format (one zone per line):
 *   upper,lower
 *   30693.75,30688.75
 *   30666.25,30662.50
 *   ...
 *
 * Lines are expected to be ordered from highest to lowest.
 * Blank lines and whitespace are ignored.
 */
export function parseZoneList(raw: string): StaticZone[] {
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'));

  const zones: StaticZone[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(',').map((p) => p.trim());

    if (parts.length < 2) continue;

    const val1 = parseFloat(parts[0]);
    const val2 = parseFloat(parts[1]);

    if (isNaN(val1) || isNaN(val2)) continue;

    // Upper is always the higher value
    const upper = Math.max(val1, val2);
    const lower = Math.min(val1, val2);

    zones.push({
      id: `zone_${i}`,
      upper,
      lower,
      midpoint: (upper + lower) / 2,
      width: upper - lower,
      index: i,
    });
  }

  return zones;
}

/**
 * Parse zone data from a 2D array (for programmatic input)
 */
export function parseZoneArray(data: Array<[number, number]>): StaticZone[] {
  return data.map(([val1, val2], i) => {
    const upper = Math.max(val1, val2);
    const lower = Math.min(val1, val2);
    return {
      id: `zone_${i}`,
      upper,
      lower,
      midpoint: (upper + lower) / 2,
      width: upper - lower,
      index: i,
    };
  });
}

// ─── Zone Classification ─────────────────────────────────────────────────────

/**
 * Classify zones as support/resistance relative to current price.
 *
 * - Resistance: zone is above current price (zone.lower > price)
 * - Support: zone is below current price (zone.upper < price)
 * - Active: price is currently inside the zone
 */
export function classifyZones(zones: StaticZone[], currentPrice: number): ClassifiedZone[] {
  return zones.map((zone) => {
    let type: 'support' | 'resistance' | 'active';

    if (currentPrice >= zone.lower && currentPrice <= zone.upper) {
      type = 'active';
    } else if (zone.lower > currentPrice) {
      type = 'resistance';
    } else {
      type = 'support';
    }

    const distanceFromPrice = Math.abs(zone.midpoint - currentPrice);

    return {
      ...zone,
      type,
      distanceFromPrice,
      isNearest: false, // will be set by proximity analysis
    };
  });
}

// ─── Zone Proximity ──────────────────────────────────────────────────────────

/**
 * Perform full proximity analysis on zones relative to current price.
 *
 * @param zones - Parsed static zones
 * @param currentPrice - Current market price
 * @param nearestCount - How many nearest zones to highlight above/below (default: 3)
 */
export function analyzeProximity(
  zones: StaticZone[],
  currentPrice: number,
  nearestCount: number = 3
): ZoneProximityResult {
  const classified = classifyZones(zones, currentPrice);

  // Find nearest resistance (above price, sorted by distance ascending)
  const resistanceZones = classified
    .filter((z) => z.type === 'resistance')
    .sort((a, b) => a.distanceFromPrice - b.distanceFromPrice);

  const nearestResistance = resistanceZones.slice(0, nearestCount);
  for (const z of nearestResistance) {
    z.isNearest = true;
  }

  // Find nearest support (below price, sorted by distance ascending)
  const supportZones = classified
    .filter((z) => z.type === 'support')
    .sort((a, b) => a.distanceFromPrice - b.distanceFromPrice);

  const nearestSupport = supportZones.slice(0, nearestCount);
  for (const z of nearestSupport) {
    z.isNearest = true;
  }

  // Find active zone (price is inside)
  const activeZone = classified.find((z) => z.type === 'active') ?? null;
  if (activeZone) {
    activeZone.isNearest = true;
  }

  return {
    zones: classified,
    nearestResistance,
    nearestSupport,
    activeZone,
    currentPrice,
  };
}

// ─── Display Formatting ──────────────────────────────────────────────────────

/**
 * Format the zone proximity result as a compact display string.
 * This is what the companion UI will show.
 */
export function formatZoneDisplay(
  result: ZoneProximityResult,
  options: { symbol?: string; showAll?: boolean; maxDisplay?: number } = {}
): string {
  const { symbol = 'NQ', showAll = false, maxDisplay = 20 } = options;
  const lines: string[] = [];

  lines.push(`═══ ${symbol} Manual Zones ═══`);
  lines.push(`Price: ${result.currentPrice.toFixed(2)}`);
  lines.push('');

  // Active zone
  if (result.activeZone) {
    lines.push('▶ IN ZONE:');
    lines.push(`  ${result.activeZone.upper.toFixed(2)} – ${result.activeZone.lower.toFixed(2)}`);
    lines.push('');
  }

  // Nearest resistance (ascending from price)
  if (result.nearestResistance.length > 0) {
    lines.push('▲ RESISTANCE (nearest above):');
    for (const z of result.nearestResistance) {
      const dist = (z.lower - result.currentPrice).toFixed(2);
      lines.push(`  ${z.upper.toFixed(2)} – ${z.lower.toFixed(2)}  (+${dist})`);
    }
    lines.push('');
  }

  // Nearest support (ascending from price = closest first)
  if (result.nearestSupport.length > 0) {
    lines.push('▼ SUPPORT (nearest below):');
    for (const z of result.nearestSupport) {
      const dist = (result.currentPrice - z.upper).toFixed(2);
      lines.push(`  ${z.upper.toFixed(2)} – ${z.lower.toFixed(2)}  (-${dist})`);
    }
    lines.push('');
  }

  // Show all zones if requested
  if (showAll) {
    lines.push('─── All Zones ───');
    const displayZones = result.zones
      .sort((a, b) => b.upper - a.upper)
      .slice(0, maxDisplay);

    for (const z of displayZones) {
      const marker = z.isNearest ? '→' : ' ';
      const typeChar = z.type === 'resistance' ? 'R' : z.type === 'support' ? 'S' : 'A';
      lines.push(`${marker} [${typeChar}] ${z.upper.toFixed(2)} – ${z.lower.toFixed(2)}`);
    }

    if (result.zones.length > maxDisplay) {
      lines.push(`  ... +${result.zones.length - maxDisplay} more zones`);
    }
  }

  lines.push('═══════════════════════════');

  return lines.join('\n');
}

// ─── SDK Definition ──────────────────────────────────────────────────────────

export const MANUAL_ZONES_INPUTS: IndicatorInput[] = [
  {
    key: 'zoneData',
    label: 'Zone Data',
    type: 'string',
    defaultValue: '',
    tooltip: 'Paste zone list (upper,lower per line)',
    multiline: true,
    group: 'Zones',
  },
  {
    key: 'nearestCount',
    label: 'Nearest Zones to Highlight',
    type: 'integer',
    defaultValue: 3,
    minValue: 1,
    maxValue: 10,
    group: 'Display',
  },
  {
    key: 'showResistance',
    label: 'Show Resistance',
    type: 'boolean',
    defaultValue: true,
    group: 'Display',
  },
  {
    key: 'showSupport',
    label: 'Show Support',
    type: 'boolean',
    defaultValue: true,
    group: 'Display',
  },
  {
    key: 'resistanceColor',
    label: 'Resistance Color',
    type: 'color',
    defaultValue: { r: 244, g: 67, b: 54, a: 0.25 },
    group: 'Style',
  },
  {
    key: 'supportColor',
    label: 'Support Color',
    type: 'color',
    defaultValue: { r: 76, g: 175, b: 80, a: 0.25 },
    group: 'Style',
  },
  {
    key: 'activeColor',
    label: 'Active Zone Color',
    type: 'color',
    defaultValue: { r: 255, g: 235, b: 59, a: 0.35 },
    group: 'Style',
  },
];

/**
 * Manual Zones indicator using the Priisma SDK.
 *
 * Displays static pre-defined zones with classification relative to current price.
 */
export const manualZonesDefinition: IndicatorDefinition = defineIndicator({
  name: 'Manual Zones',
  version: '1.0.0',
  description: 'Static support/resistance zones from a pre-defined zone list',
  overlay: true,

  inputs: MANUAL_ZONES_INPUTS,

  init(ctx) {
    const raw = ctx.inputs.zoneData as string;
    ctx.state.zones = parseZoneList(raw);
    ctx.state.renderedZoneIds = new Set<string>();
  },

  calculate(ctx) {
    const zones = ctx.state.zones as StaticZone[];
    const nearestCount = ctx.inputs.nearestCount as number;
    const showResistance = ctx.inputs.showResistance as boolean;
    const showSupport = ctx.inputs.showSupport as boolean;
    const resistanceColor = ctx.inputs.resistanceColor as Color;
    const supportColor = ctx.inputs.supportColor as Color;
    const activeColor = ctx.inputs.activeColor as Color;

    if (zones.length === 0) return;

    // Only render zones on the last bar (they're static — only classification changes)
    if (!ctx.isLast) return;

    const proximity = analyzeProximity(zones, ctx.close, nearestCount);

    // Render each zone
    for (const zone of proximity.zones) {
      // Filter by type visibility
      if (zone.type === 'resistance' && !showResistance) continue;
      if (zone.type === 'support' && !showSupport) continue;

      let color: Color;
      if (zone.type === 'active') {
        color = activeColor;
      } else if (zone.type === 'resistance') {
        color = zone.isNearest
          ? { ...resistanceColor, a: Math.min(1, resistanceColor.a * 2) }
          : resistanceColor;
      } else {
        color = zone.isNearest
          ? { ...supportColor, a: Math.min(1, supportColor.a * 2) }
          : supportColor;
      }

      ctx.zone(zone.id, zone.upper, zone.lower, {
        type: zone.type === 'active' ? 'support' : zone.type,
        color,
        label: zone.isNearest ? `${zone.upper.toFixed(2)}–${zone.lower.toFixed(2)}` : undefined,
      });
    }
  },
});

// ─── Standalone Engine ───────────────────────────────────────────────────────

/**
 * Standalone Manual Zones engine for direct use.
 * Simpler than the full SDK runtime — just manages zones and proximity.
 */
export class ManualZonesEngine {
  readonly name = 'Manual Zones';
  private zones: StaticZone[] = [];

  constructor(zoneData?: string | Array<[number, number]>) {
    if (typeof zoneData === 'string') {
      this.zones = parseZoneList(zoneData);
    } else if (Array.isArray(zoneData)) {
      this.zones = parseZoneArray(zoneData);
    }
  }

  /** Load zones from a raw string */
  loadFromString(raw: string): void {
    this.zones = parseZoneList(raw);
  }

  /** Load zones from an array */
  loadFromArray(data: Array<[number, number]>): void {
    this.zones = parseZoneArray(data);
  }

  /** Get all parsed zones */
  getZones(): StaticZone[] {
    return [...this.zones];
  }

  /** Get zone count */
  get zoneCount(): number {
    return this.zones.length;
  }

  /** Analyze proximity to a given price */
  analyze(currentPrice: number, nearestCount: number = 3): ZoneProximityResult {
    return analyzeProximity(this.zones, currentPrice, nearestCount);
  }

  /** Get formatted display string */
  display(currentPrice: number, options?: { symbol?: string; showAll?: boolean }): string {
    const result = this.analyze(currentPrice);
    return formatZoneDisplay(result, options);
  }
}

/**
 * Create a Manual Zones engine with the provided zone data
 */
export function createManualZonesEngine(zoneData?: string | Array<[number, number]>): ManualZonesEngine {
  return new ManualZonesEngine(zoneData);
}
