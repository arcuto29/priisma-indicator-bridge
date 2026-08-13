/**
 * Manual Zones Indicator — LVN (Low Volume Nodes)
 *
 * This indicator displays pre-defined FIXED Low Volume Node zones.
 * LVNs are thin areas in the volume profile where little volume traded —
 * price tends to move through them quickly or react at their edges.
 *
 * These zones are permanent horizontal bands that never move, never reclassify,
 * never invalidate, and never disappear. They are derived from volume profile
 * analysis and provided as a fixed list.
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
 * Zone with distance info relative to current price.
 * NOTE: The zone itself does NOT change. Only the distance is calculated.
 */
export interface ClassifiedZone extends StaticZone {
  /** Position relative to price (for display convenience only — zone stays fixed) */
  position: 'above' | 'below' | 'containing';
  /** Distance from current price to zone midpoint */
  distanceFromPrice: number;
  /** Whether this is one of the nearest zones to current price */
  isNearest: boolean;
}

/**
 * Proximity analysis result.
 * Zones are FIXED — this just tells you where price is relative to them.
 */
export interface ZoneProximityResult {
  /** All zones (always the same, never changes) */
  zones: ClassifiedZone[];
  /** Nearest zone(s) above price */
  nearestAbove: ClassifiedZone[];
  /** Nearest zone(s) below price */
  nearestBelow: ClassifiedZone[];
  /** Zone that price is currently inside (if any) */
  containingZone: ClassifiedZone | null;
  /** Current price used for distance calculation */
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

// ─── Zone Position Relative to Price ─────────────────────────────────────────

/**
 * Calculate where price is relative to each fixed zone.
 * The zones themselves NEVER change — only the distance/position info updates.
 */
export function classifyZones(zones: StaticZone[], currentPrice: number): ClassifiedZone[] {
  return zones.map((zone) => {
    let position: 'above' | 'below' | 'containing';

    if (currentPrice >= zone.lower && currentPrice <= zone.upper) {
      position = 'containing';
    } else if (zone.lower > currentPrice) {
      position = 'above';
    } else {
      position = 'below';
    }

    const distanceFromPrice = Math.abs(zone.midpoint - currentPrice);

    return {
      ...zone,
      position,
      distanceFromPrice,
      isNearest: false,
    };
  });
}

// ─── Zone Proximity ──────────────────────────────────────────────────────────

/**
 * Find where price is relative to the fixed zones.
 * Zones NEVER move — this just calculates distances.
 *
 * @param zones - Fixed zone list (never changes)
 * @param currentPrice - Where price is right now
 * @param nearestCount - How many nearest zones to highlight above/below (default: 3)
 */
export function analyzeProximity(
  zones: StaticZone[],
  currentPrice: number,
  nearestCount: number = 3
): ZoneProximityResult {
  const classified = classifyZones(zones, currentPrice);

  // Find nearest zones above price (sorted by distance ascending)
  const aboveZones = classified
    .filter((z) => z.position === 'above')
    .sort((a, b) => a.distanceFromPrice - b.distanceFromPrice);

  const nearestAbove = aboveZones.slice(0, nearestCount);
  for (const z of nearestAbove) {
    z.isNearest = true;
  }

  // Find nearest zones below price (sorted by distance ascending)
  const belowZones = classified
    .filter((z) => z.position === 'below')
    .sort((a, b) => a.distanceFromPrice - b.distanceFromPrice);

  const nearestBelow = belowZones.slice(0, nearestCount);
  for (const z of nearestBelow) {
    z.isNearest = true;
  }

  // Find containing zone (price is inside)
  const containingZone = classified.find((z) => z.position === 'containing') ?? null;
  if (containingZone) {
    containingZone.isNearest = true;
  }

  return {
    zones: classified,
    nearestAbove,
    nearestBelow,
    containingZone,
    currentPrice,
  };
}

// ─── Display Formatting ──────────────────────────────────────────────────────

/**
 * Format the fixed LVN zone list as a compact display string.
 * Zones are always shown. Price position is informational only.
 */
export function formatZoneDisplay(
  result: ZoneProximityResult,
  options: { symbol?: string; showAll?: boolean; maxDisplay?: number } = {}
): string {
  const { symbol = 'NQ', showAll = false, maxDisplay = 20 } = options;
  const lines: string[] = [];

  lines.push(`═══ ${symbol} LVN Zones ═══`);
  lines.push(`Price: ${result.currentPrice.toFixed(2)}`);
  lines.push('');

  // Show if price is inside a zone
  if (result.containingZone) {
    lines.push('▶ IN ZONE:');
    lines.push(`  ${result.containingZone.upper.toFixed(2)} – ${result.containingZone.lower.toFixed(2)}`);
    lines.push('');
  }

  // Nearest zones above price
  if (result.nearestAbove.length > 0) {
    lines.push('▲ NEXT ABOVE:');
    for (const z of result.nearestAbove) {
      const dist = (z.lower - result.currentPrice).toFixed(2);
      lines.push(`  ${z.upper.toFixed(2)} – ${z.lower.toFixed(2)}  (+${dist})`);
    }
    lines.push('');
  }

  // Nearest zones below price
  if (result.nearestBelow.length > 0) {
    lines.push('▼ NEXT BELOW:');
    for (const z of result.nearestBelow) {
      const dist = (result.currentPrice - z.upper).toFixed(2);
      lines.push(`  ${z.upper.toFixed(2)} – ${z.lower.toFixed(2)}  (-${dist})`);
    }
    lines.push('');
  }

  // Show all zones if requested (they're always fixed)
  if (showAll) {
    lines.push('─── All Zones (fixed) ───');
    const displayZones = result.zones
      .sort((a, b) => b.upper - a.upper)
      .slice(0, maxDisplay);

    for (const z of displayZones) {
      const marker = z.isNearest ? '→' : ' ';
      lines.push(`${marker} ${z.upper.toFixed(2)} – ${z.lower.toFixed(2)}`);
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
    key: 'zoneColor',
    label: 'Zone Color',
    type: 'color',
    defaultValue: { r: 33, g: 150, b: 243, a: 0.2 },
    group: 'Style',
  },
];

/**
 * Manual Zones indicator using the Priisma SDK.
 *
 * Displays static pre-defined zones with classification relative to current price.
 */
export const manualZonesDefinition: IndicatorDefinition = defineIndicator({
  name: 'LVN Zones',
  version: '1.0.0',
  description: 'Fixed Low Volume Node zones from volume profile analysis',
  overlay: true,

  inputs: MANUAL_ZONES_INPUTS,

  init(ctx) {
    const raw = ctx.inputs.zoneData as string;
    ctx.state.zones = parseZoneList(raw);
    ctx.state.renderedZoneIds = new Set<string>();
  },

  calculate(ctx) {
    const zones = ctx.state.zones as StaticZone[];
    const zoneColor = ctx.inputs.zoneColor as Color;

    if (zones.length === 0) return;

    // Render ALL zones on the first bar — they are FIXED and never change.
    if (!ctx.isFirst) return;

    for (const zone of zones) {
      ctx.zone(zone.id, zone.upper, zone.lower, {
        type: 'neutral',
        color: zoneColor,
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
  readonly name = 'LVN Zones';
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
