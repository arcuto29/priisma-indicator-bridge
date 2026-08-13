/**
 * Parity Test Runner
 *
 * Runs an indicator against historical data and compares output
 * against TradingView reference values.
 */

import type { Candle, Timeframe } from '../engine/types.js';
import type { OutputObject, ZonePlot } from '../engine/output.js';
import type { IndicatorDefinition } from '../sdk/define-indicator.js';
import { IndicatorRuntime } from '../sdk/runtime.js';

// ─── Parity Types ────────────────────────────────────────────────────────────

/**
 * A single reference data point from TradingView
 */
export interface ReferenceZone {
  type: 'support' | 'resistance';
  upper: number;
  lower: number;
  midpoint?: number;
  createdAtTimestamp: number;
  invalidatedAtTimestamp?: number;
  /** Bar index where zone was created */
  createdAtBar?: number;
}

export interface ReferenceSeries {
  name: string;
  values: Array<{ timestamp: number; value: number | null }>;
}

export interface ReferenceData {
  zones?: ReferenceZone[];
  series?: ReferenceSeries[];
  signals?: Array<{ timestamp: number; direction: string }>;
}

/**
 * Parity test configuration
 */
export interface ParityTestConfig {
  /** Indicator definition to test */
  indicator: IndicatorDefinition;
  /** Historical candles to run */
  candles: Candle[];
  /** Symbol */
  symbol: string;
  /** Timeframe */
  timeframe: Timeframe;
  /** Input overrides */
  inputOverrides?: Record<string, unknown>;
  /** Reference data from TradingView */
  reference: ReferenceData;
  /** Price tolerance (for floating point comparison) */
  priceTolerance?: number;
  /** Time tolerance in ms (for timestamp comparison) */
  timeTolerance?: number;
}

/**
 * Comparison result for a single field
 */
export interface FieldComparison {
  field: string;
  expected: unknown;
  actual: unknown;
  match: boolean;
  tolerance?: number;
}

/**
 * Result of a parity test
 */
export interface ParityResult {
  /** Overall pass/fail */
  passed: boolean;
  /** Overall match percentage */
  matchPercent: number;
  /** Category-level results */
  categories: {
    name: string;
    matchCount: number;
    totalCount: number;
    matchPercent: number;
    comparisons: FieldComparison[];
  }[];
  /** Summary messages */
  summary: string[];
  /** Duration of test in ms */
  durationMs: number;
}

// ─── Parity Runner ───────────────────────────────────────────────────────────

export class ParityRunner {
  private config: ParityTestConfig;
  private priceTolerance: number;
  private timeTolerance: number;

  constructor(config: ParityTestConfig) {
    this.config = config;
    this.priceTolerance = config.priceTolerance ?? 0.01;
    this.timeTolerance = config.timeTolerance ?? 0;
  }

  run(): ParityResult {
    const startTime = Date.now();

    // Run indicator
    const runtime = new IndicatorRuntime(this.config.indicator, {
      symbol: this.config.symbol,
      timeframe: this.config.timeframe,
      inputOverrides: this.config.inputOverrides,
    });

    const output = runtime.processBatch(this.config.candles);
    const categories: ParityResult['categories'] = [];
    const summary: string[] = [];

    // Compare zones
    if (this.config.reference.zones) {
      const zoneResult = this.compareZones(output.objects, this.config.reference.zones);
      categories.push(zoneResult);
    }

    // Compare series
    if (this.config.reference.series) {
      for (const refSeries of this.config.reference.series) {
        const seriesResult = this.compareSeries(output.objects, refSeries);
        categories.push(seriesResult);
      }
    }

    // Calculate overall
    let totalMatch = 0;
    let totalCount = 0;
    for (const cat of categories) {
      totalMatch += cat.matchCount;
      totalCount += cat.totalCount;
    }

    const matchPercent = totalCount === 0 ? 100 : Math.round((totalMatch / totalCount) * 100 * 10) / 10;
    const passed = matchPercent >= 95;

    summary.push(`Overall compatibility: ${matchPercent}%`);
    for (const cat of categories) {
      summary.push(`  ${cat.name}: ${cat.matchPercent}% (${cat.matchCount}/${cat.totalCount})`);
    }
    if (!passed) {
      summary.push(`FAIL: Match percentage ${matchPercent}% is below 95% threshold`);
    }

    return {
      passed,
      matchPercent,
      categories,
      summary,
      durationMs: Date.now() - startTime,
    };
  }

  private compareZones(
    objects: OutputObject[],
    referenceZones: ReferenceZone[]
  ): ParityResult['categories'][0] {
    const localZones = objects.filter((o): o is ZonePlot => o.type === 'zone');
    const comparisons: FieldComparison[] = [];
    let matchCount = 0;
    let totalCount = 0;

    // Compare zone count
    totalCount++;
    const countMatch = localZones.length === referenceZones.length;
    if (countMatch) matchCount++;
    comparisons.push({
      field: 'zone_count',
      expected: referenceZones.length,
      actual: localZones.length,
      match: countMatch,
    });

    // Compare each reference zone to best-matching local zone
    for (let i = 0; i < referenceZones.length; i++) {
      const ref = referenceZones[i];
      const bestMatch = this.findBestMatchingZone(ref, localZones);

      if (!bestMatch) {
        totalCount += 4; // upper, lower, type, creation time
        comparisons.push({
          field: `zone[${i}]`,
          expected: `${ref.type} ${ref.upper}-${ref.lower}`,
          actual: 'NOT FOUND',
          match: false,
        });
        continue;
      }

      // Type match
      totalCount++;
      const typeMatch = ref.type === bestMatch.zoneType;
      if (typeMatch) matchCount++;
      comparisons.push({
        field: `zone[${i}].type`,
        expected: ref.type,
        actual: bestMatch.zoneType,
        match: typeMatch,
      });

      // Upper boundary
      totalCount++;
      const upperMatch = Math.abs(ref.upper - bestMatch.upper) <= this.priceTolerance;
      if (upperMatch) matchCount++;
      comparisons.push({
        field: `zone[${i}].upper`,
        expected: ref.upper,
        actual: bestMatch.upper,
        match: upperMatch,
        tolerance: this.priceTolerance,
      });

      // Lower boundary
      totalCount++;
      const lowerMatch = Math.abs(ref.lower - bestMatch.lower) <= this.priceTolerance;
      if (lowerMatch) matchCount++;
      comparisons.push({
        field: `zone[${i}].lower`,
        expected: ref.lower,
        actual: bestMatch.lower,
        match: lowerMatch,
        tolerance: this.priceTolerance,
      });

      // Creation time
      totalCount++;
      const timeMatch = Math.abs(ref.createdAtTimestamp - bestMatch.startTime) <= this.timeTolerance;
      if (timeMatch) matchCount++;
      comparisons.push({
        field: `zone[${i}].createdAt`,
        expected: ref.createdAtTimestamp,
        actual: bestMatch.startTime,
        match: timeMatch,
        tolerance: this.timeTolerance,
      });
    }

    const matchPercent = totalCount === 0 ? 100 : Math.round((matchCount / totalCount) * 100);

    return {
      name: 'Zone Locations',
      matchCount,
      totalCount,
      matchPercent,
      comparisons,
    };
  }

  private findBestMatchingZone(ref: ReferenceZone, localZones: ZonePlot[]): ZonePlot | null {
    let bestMatch: ZonePlot | null = null;
    let bestScore = Infinity;

    for (const zone of localZones) {
      const score =
        Math.abs(ref.upper - zone.upper) +
        Math.abs(ref.lower - zone.lower) +
        (ref.type === zone.zoneType ? 0 : 1000);
      if (score < bestScore) {
        bestScore = score;
        bestMatch = zone;
      }
    }

    return bestMatch;
  }

  private compareSeries(
    objects: OutputObject[],
    refSeries: ReferenceSeries
  ): ParityResult['categories'][0] {
    const localSeries = objects.find(
      (o) => o.type === 'series' && (o as any).name === refSeries.name
    ) as any;

    const comparisons: FieldComparison[] = [];
    let matchCount = 0;
    let totalCount = 0;

    if (!localSeries) {
      return {
        name: `Series: ${refSeries.name}`,
        matchCount: 0,
        totalCount: refSeries.values.length,
        matchPercent: 0,
        comparisons: [{ field: 'series', expected: refSeries.name, actual: 'NOT FOUND', match: false }],
      };
    }

    // Sample comparison (compare every Nth point for efficiency)
    const step = Math.max(1, Math.floor(refSeries.values.length / 50));
    for (let i = 0; i < refSeries.values.length; i += step) {
      const ref = refSeries.values[i];
      const local = localSeries.values?.[i];
      totalCount++;

      if (!local || ref.value === null) {
        if (ref.value === null && (local?.value === null || local?.value === undefined)) {
          matchCount++;
          comparisons.push({
            field: `${refSeries.name}[${i}]`,
            expected: null,
            actual: local?.value ?? null,
            match: true,
          });
        }
        continue;
      }

      const match = Math.abs((ref.value ?? 0) - (local.value ?? 0)) <= this.priceTolerance;
      if (match) matchCount++;
      comparisons.push({
        field: `${refSeries.name}[${i}]`,
        expected: ref.value,
        actual: local.value,
        match,
        tolerance: this.priceTolerance,
      });
    }

    const matchPercent = totalCount === 0 ? 100 : Math.round((matchCount / totalCount) * 100);

    return {
      name: `Series: ${refSeries.name}`,
      matchCount,
      totalCount,
      matchPercent,
      comparisons,
    };
  }
}

/**
 * Convenience function to run a parity test
 */
export function runParityTest(config: ParityTestConfig): ParityResult {
  return new ParityRunner(config).run();
}

/**
 * Format a parity result as a readable string (for CLI/test output)
 */
export function formatParityReport(result: ParityResult): string {
  const lines: string[] = [];
  lines.push('═══════════════════════════════════════');
  lines.push('  PRIISMA PARITY TEST REPORT');
  lines.push('═══════════════════════════════════════');
  lines.push('');
  lines.push(`Overall: ${result.matchPercent}% ${result.passed ? '✓ PASS' : '✗ FAIL'}`);
  lines.push(`Duration: ${result.durationMs}ms`);
  lines.push('');

  for (const cat of result.categories) {
    const icon = cat.matchPercent >= 95 ? '✓' : cat.matchPercent >= 70 ? '~' : '✗';
    lines.push(`${icon} ${cat.name.padEnd(25)} ${cat.matchPercent}% (${cat.matchCount}/${cat.totalCount})`);
  }

  lines.push('');

  // Show failures
  const failures = result.categories.flatMap((c) => c.comparisons.filter((comp) => !comp.match));
  if (failures.length > 0) {
    lines.push('─── Mismatches ───');
    for (const f of failures.slice(0, 20)) {
      lines.push(`  ${f.field}: expected ${f.expected}, got ${f.actual}`);
    }
    if (failures.length > 20) {
      lines.push(`  ... and ${failures.length - 20} more`);
    }
  }

  lines.push('');
  lines.push('═══════════════════════════════════════');
  return lines.join('\n');
}
