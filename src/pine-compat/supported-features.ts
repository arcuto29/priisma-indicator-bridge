/**
 * Pine Script Compatibility Layer — Supported Features
 *
 * Tracks which Pine Script features are supported by the Priisma transpiler/runtime.
 * Used for:
 * 1. Analyzing a Pine script to determine compatibility percentage
 * 2. Generating warnings for unsupported features
 * 3. Guiding transpilation
 */

// ─── Feature Categories ──────────────────────────────────────────────────────

export type FeatureStatus = 'supported' | 'partial' | 'planned' | 'unsupported';

export interface PineFeature {
  /** Pine function/keyword name */
  name: string;
  /** Support status */
  status: FeatureStatus;
  /** Notes about limitations or differences */
  notes?: string;
}

// ─── Supported Feature Manifest ──────────────────────────────────────────────

export const PINE_FEATURES: Record<string, PineFeature[]> = {
  // ─── Core Language ─────────────────────────────────────────────────
  language: [
    { name: 'indicator()', status: 'supported' },
    { name: 'strategy()', status: 'unsupported', notes: 'Priisma is indicator-only, no execution' },
    { name: 'library()', status: 'unsupported', notes: 'Libraries must be inlined' },
    { name: 'var', status: 'supported', notes: 'Persistent variables via state' },
    { name: 'varip', status: 'partial', notes: 'Behaves like var in historical mode' },
    { name: 'if/else', status: 'supported' },
    { name: 'for', status: 'supported' },
    { name: 'while', status: 'supported' },
    { name: 'switch', status: 'supported' },
    { name: 'function definitions', status: 'supported' },
    { name: 'type definitions (UDT)', status: 'planned' },
    { name: 'method definitions', status: 'planned' },
    { name: 'import', status: 'unsupported', notes: 'External libraries not supported' },
    { name: 'export', status: 'unsupported' },
  ],

  // ─── Input Functions ───────────────────────────────────────────────
  inputs: [
    { name: 'input.int()', status: 'supported' },
    { name: 'input.float()', status: 'supported' },
    { name: 'input.bool()', status: 'supported' },
    { name: 'input.string()', status: 'supported' },
    { name: 'input.color()', status: 'supported' },
    { name: 'input.timeframe()', status: 'supported' },
    { name: 'input.symbol()', status: 'supported' },
    { name: 'input.source()', status: 'supported' },
    { name: 'input.session()', status: 'partial', notes: 'Basic session filtering supported' },
    { name: 'input.text_area()', status: 'supported' },
    { name: 'input.price()', status: 'planned' },
    { name: 'input.time()', status: 'planned' },
  ],

  // ─── Plot Functions ────────────────────────────────────────────────
  plots: [
    { name: 'plot()', status: 'supported' },
    { name: 'plotshape()', status: 'supported' },
    { name: 'plotchar()', status: 'supported' },
    { name: 'plotarrow()', status: 'supported' },
    { name: 'plotbar()', status: 'planned' },
    { name: 'plotcandle()', status: 'planned' },
    { name: 'bgcolor()', status: 'supported' },
    { name: 'barcolor()', status: 'supported' },
    { name: 'hline()', status: 'supported' },
    { name: 'fill()', status: 'partial', notes: 'Basic fill between plots supported' },
  ],

  // ─── Technical Analysis (ta.*) ─────────────────────────────────────
  ta: [
    { name: 'ta.sma()', status: 'supported' },
    { name: 'ta.ema()', status: 'supported' },
    { name: 'ta.wma()', status: 'planned' },
    { name: 'ta.vwma()', status: 'planned' },
    { name: 'ta.rma()', status: 'supported', notes: 'Used internally for ATR/RSI' },
    { name: 'ta.rsi()', status: 'supported' },
    { name: 'ta.atr()', status: 'supported' },
    { name: 'ta.macd()', status: 'planned' },
    { name: 'ta.bb()', status: 'planned' },
    { name: 'ta.stoch()', status: 'planned' },
    { name: 'ta.cci()', status: 'planned' },
    { name: 'ta.highest()', status: 'supported' },
    { name: 'ta.lowest()', status: 'supported' },
    { name: 'ta.highestbars()', status: 'planned' },
    { name: 'ta.lowestbars()', status: 'planned' },
    { name: 'ta.stdev()', status: 'supported' },
    { name: 'ta.variance()', status: 'planned' },
    { name: 'ta.crossover()', status: 'supported' },
    { name: 'ta.crossunder()', status: 'supported' },
    { name: 'ta.cross()', status: 'supported' },
    { name: 'ta.change()', status: 'supported' },
    { name: 'ta.roc()', status: 'supported' },
    { name: 'ta.mom()', status: 'supported' },
    { name: 'ta.cum()', status: 'planned' },
    { name: 'ta.pivothigh()', status: 'planned' },
    { name: 'ta.pivotlow()', status: 'planned' },
    { name: 'ta.vwap()', status: 'supported' },
    { name: 'ta.supertrend()', status: 'planned' },
    { name: 'ta.dmi()', status: 'planned' },
    { name: 'ta.tr()', status: 'supported' },
    { name: 'ta.valuewhen()', status: 'planned' },
    { name: 'ta.barssince()', status: 'planned' },
  ],

  // ─── Math Functions ────────────────────────────────────────────────
  math: [
    { name: 'math.abs()', status: 'supported' },
    { name: 'math.ceil()', status: 'supported' },
    { name: 'math.floor()', status: 'supported' },
    { name: 'math.round()', status: 'supported' },
    { name: 'math.max()', status: 'supported' },
    { name: 'math.min()', status: 'supported' },
    { name: 'math.pow()', status: 'supported' },
    { name: 'math.sqrt()', status: 'supported' },
    { name: 'math.log()', status: 'supported' },
    { name: 'math.log10()', status: 'supported' },
    { name: 'math.sign()', status: 'supported' },
    { name: 'math.avg()', status: 'supported' },
    { name: 'math.sum()', status: 'supported' },
    { name: 'math.random()', status: 'supported' },
    { name: 'math.todegrees()', status: 'supported' },
    { name: 'math.toradians()', status: 'supported' },
    { name: 'math.sin()', status: 'supported' },
    { name: 'math.cos()', status: 'supported' },
    { name: 'math.tan()', status: 'supported' },
    { name: 'math.asin()', status: 'supported' },
    { name: 'math.acos()', status: 'supported' },
    { name: 'math.atan()', status: 'supported' },
  ],

  // ─── Request / Multi-Timeframe ─────────────────────────────────────
  request: [
    { name: 'request.security()', status: 'partial', notes: 'Simple MTF lookups; no barmerge options yet' },
    { name: 'request.security_lower_tf()', status: 'unsupported' },
    { name: 'request.financial()', status: 'unsupported' },
    { name: 'request.economic()', status: 'unsupported' },
    { name: 'request.quandl()', status: 'unsupported' },
    { name: 'request.dividends()', status: 'unsupported' },
    { name: 'request.earnings()', status: 'unsupported' },
    { name: 'request.splits()', status: 'unsupported' },
  ],

  // ─── Drawing Objects ───────────────────────────────────────────────
  drawings: [
    { name: 'line.new()', status: 'supported' },
    { name: 'label.new()', status: 'supported' },
    { name: 'box.new()', status: 'supported', notes: 'Maps to zone output' },
    { name: 'table.new()', status: 'partial', notes: 'Basic table support' },
    { name: 'polyline.new()', status: 'planned' },
    { name: 'linefill.new()', status: 'planned' },
  ],

  // ─── Arrays ────────────────────────────────────────────────────────
  arrays: [
    { name: 'array.new()', status: 'supported' },
    { name: 'array.push()', status: 'supported' },
    { name: 'array.pop()', status: 'supported' },
    { name: 'array.get()', status: 'supported' },
    { name: 'array.set()', status: 'supported' },
    { name: 'array.size()', status: 'supported' },
    { name: 'array.remove()', status: 'supported' },
    { name: 'array.insert()', status: 'supported' },
    { name: 'array.slice()', status: 'supported' },
    { name: 'array.sort()', status: 'supported' },
    { name: 'array.avg()', status: 'supported' },
    { name: 'array.max()', status: 'supported' },
    { name: 'array.min()', status: 'supported' },
    { name: 'array.sum()', status: 'supported' },
    { name: 'array.includes()', status: 'supported' },
    { name: 'array.indexof()', status: 'supported' },
    { name: 'array.clear()', status: 'supported' },
    { name: 'array.shift()', status: 'supported' },
    { name: 'array.unshift()', status: 'supported' },
  ],

  // ─── Matrix (Advanced) ─────────────────────────────────────────────
  matrix: [
    { name: 'matrix.new()', status: 'unsupported', notes: 'Matrix operations not yet supported' },
    { name: 'matrix.*', status: 'unsupported' },
  ],

  // ─── String ────────────────────────────────────────────────────────
  strings: [
    { name: 'str.tostring()', status: 'supported' },
    { name: 'str.tonumber()', status: 'supported' },
    { name: 'str.format()', status: 'partial' },
    { name: 'str.contains()', status: 'supported' },
    { name: 'str.length()', status: 'supported' },
    { name: 'str.replace()', status: 'supported' },
    { name: 'str.split()', status: 'supported' },
    { name: 'str.upper()', status: 'supported' },
    { name: 'str.lower()', status: 'supported' },
  ],

  // ─── Time / Session ────────────────────────────────────────────────
  time: [
    { name: 'time', status: 'supported' },
    { name: 'time_close', status: 'supported' },
    { name: 'timestamp()', status: 'supported' },
    { name: 'year()', status: 'supported' },
    { name: 'month()', status: 'supported' },
    { name: 'dayofmonth()', status: 'supported' },
    { name: 'dayofweek()', status: 'supported' },
    { name: 'hour()', status: 'supported' },
    { name: 'minute()', status: 'supported' },
    { name: 'second()', status: 'supported' },
    { name: 'timeframe.period', status: 'supported' },
    { name: 'timeframe.multiplier', status: 'supported' },
    { name: 'syminfo.*', status: 'partial', notes: 'Basic symbol info available' },
  ],

  // ─── Bar State ─────────────────────────────────────────────────────
  barState: [
    { name: 'barstate.isconfirmed', status: 'supported' },
    { name: 'barstate.islast', status: 'supported' },
    { name: 'barstate.isfirst', status: 'supported' },
    { name: 'barstate.ishistory', status: 'supported' },
    { name: 'barstate.isrealtime', status: 'supported' },
    { name: 'barstate.isnew', status: 'partial' },
    { name: 'bar_index', status: 'supported' },
    { name: 'last_bar_index', status: 'supported' },
  ],

  // ─── Color ─────────────────────────────────────────────────────────
  color: [
    { name: 'color.new()', status: 'supported' },
    { name: 'color.rgb()', status: 'supported' },
    { name: 'color constants', status: 'supported' },
  ],

  // ─── Alerts ────────────────────────────────────────────────────────
  alerts: [
    { name: 'alert()', status: 'partial', notes: 'Maps to signal output; no broker webhooks' },
    { name: 'alertcondition()', status: 'partial', notes: 'Maps to signal output' },
  ],
};

// ─── Compatibility Analysis ──────────────────────────────────────────────────

export interface CompatibilityReport {
  /** Overall compatibility percentage */
  overallPercent: number;
  /** Total features detected in script */
  totalFeatures: number;
  /** Features fully supported */
  supported: number;
  /** Features partially supported */
  partial: number;
  /** Features planned */
  planned: number;
  /** Features not supported */
  unsupported: number;
  /** List of unsupported features found */
  unsupportedFeatures: string[];
  /** List of partially supported features */
  partialFeatures: Array<{ name: string; notes: string }>;
  /** Recommendation */
  recommendation: 'full' | 'partial' | 'manual_review' | 'not_supported';
}

/**
 * Get the support status of a specific Pine feature
 */
export function getFeatureStatus(featureName: string): PineFeature | undefined {
  for (const category of Object.values(PINE_FEATURES)) {
    const found = category.find(
      (f) => f.name === featureName || f.name.replace('()', '') === featureName
    );
    if (found) return found;
  }
  return undefined;
}

/**
 * Get overall statistics on supported features
 */
export function getOverallStats(): { total: number; supported: number; partial: number; planned: number; unsupported: number } {
  let total = 0;
  let supported = 0;
  let partial = 0;
  let planned = 0;
  let unsupported = 0;

  for (const category of Object.values(PINE_FEATURES)) {
    for (const feature of category) {
      total++;
      switch (feature.status) {
        case 'supported': supported++; break;
        case 'partial': partial++; break;
        case 'planned': planned++; break;
        case 'unsupported': unsupported++; break;
      }
    }
  }

  return { total, supported, partial, planned, unsupported };
}
