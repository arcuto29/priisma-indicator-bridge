/**
 * Priisma Indicator SDK — defineIndicator
 *
 * The primary API for creating native Priisma indicators.
 * This is Level 2 support: indicators written directly against the Priisma SDK.
 *
 * Example:
 *
 * ```ts
 * const myIndicator = defineIndicator({
 *   name: "EMA Crossover",
 *   version: "1.0.0",
 *   author: "trader",
 *   inputs: [...],
 *   calculate(ctx) {
 *     const fast = ctx.ta.ema(ctx.close, ctx.inputs.fastLength);
 *     const slow = ctx.ta.ema(ctx.close, ctx.inputs.slowLength);
 *     ctx.plot('fast', fast, { color: ctx.inputs.fastColor });
 *     ctx.plot('slow', slow, { color: ctx.inputs.slowColor });
 *   }
 * });
 * ```
 */

import type { IndicatorInput, InputValues } from '../engine/inputs.js';
import type { Color, LineStyle, PlotStyle, ShapeLocation, ShapeStyle } from '../engine/output.js';
import type { Candle, Timeframe } from '../engine/types.js';

// ─── Indicator Definition ────────────────────────────────────────────────────

/**
 * Metadata for an indicator definition
 */
export interface IndicatorMetadata {
  /** Indicator display name */
  name: string;
  /** Version string */
  version?: string;
  /** Author name */
  author?: string;
  /** Short description */
  description?: string;
  /** Whether this indicator overlays on the price chart */
  overlay: boolean;
  /** Maximum number of bars to look back */
  maxBarsBack?: number;
}

/**
 * Technical Analysis functions available in the calculation context
 */
export interface TAFunctions {
  sma(source: number[], length: number): number | null;
  ema(source: number[], length: number): number | null;
  rsi(source: number[], length: number): number | null;
  atr(length: number): number | null;
  highest(source: number[], length: number): number | null;
  lowest(source: number[], length: number): number | null;
  stdev(source: number[], length: number): number | null;
  crossover(a: number[], b: number[]): boolean;
  crossunder(a: number[], b: number[]): boolean;
  change(source: number[], length?: number): number | null;
  roc(source: number[], length: number): number | null;
  vwap(): number | null;
}

/**
 * Math functions available in the calculation context
 */
export interface MathFunctions {
  abs(x: number): number;
  ceil(x: number): number;
  floor(x: number): number;
  round(x: number, precision?: number): number;
  max(...values: number[]): number;
  min(...values: number[]): number;
  pow(base: number, exp: number): number;
  sqrt(x: number): number;
  log(x: number): number;
  log10(x: number): number;
  sign(x: number): number;
  avg(...values: number[]): number;
  sum(source: number[], length: number): number;
}

/**
 * Context passed to the indicator's calculate function on each bar
 */
export interface CalculationContext {
  // ─── Current Bar Data ────────────────────────────────────────────────
  /** Current bar index (0-based from start of data) */
  barIndex: number;
  /** Current candle */
  candle: Candle;
  /** Current bar timestamp */
  time: number;
  /** OHLCV shorthand */
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  /** Source series (for historical lookback) */
  openSeries: number[];
  highSeries: number[];
  lowSeries: number[];
  closeSeries: number[];
  volumeSeries: number[];

  // ─── Resolved Input Values ───────────────────────────────────────────
  inputs: InputValues;

  // ─── Bar State ───────────────────────────────────────────────────────
  /** Is this the first bar? */
  isFirst: boolean;
  /** Is this the last bar in the dataset? */
  isLast: boolean;
  /** Is this bar confirmed (closed)? */
  isConfirmed: boolean;
  /** Current timeframe */
  timeframe: Timeframe;
  /** Symbol */
  symbol: string;

  // ─── Technical Analysis ──────────────────────────────────────────────
  ta: TAFunctions;
  math: MathFunctions;

  // ─── Persistent State ────────────────────────────────────────────────
  /** Read/write persistent state across bars (like Pine's `var`) */
  state: Record<string, unknown>;

  // ─── Output Functions ────────────────────────────────────────────────
  /** Plot a series value */
  plot(name: string, value: number | null, options?: PlotOptions): void;
  /** Plot a horizontal line */
  hline(price: number, options?: HLineOptions): void;
  /** Plot a shape on the bar */
  plotShape(condition: boolean, options?: PlotShapeOptions): void;
  /** Set background color for this bar */
  bgcolor(color: Color | null): void;
  /** Create/update a zone */
  zone(id: string, upper: number, lower: number, options?: ZoneOptions): void;
  /** Remove/invalidate a zone */
  removeZone(id: string): void;
  /** Add a label */
  label(text: string, options?: LabelOptions): void;
  /** Add a line between two points */
  line(x1: number, y1: number, x2: number, y2: number, options?: LineOptions): void;
  /** Emit a signal */
  signal(direction: 'long' | 'short' | 'neutral', options?: SignalOptions): void;
  /** Log a debug message (not shown in production) */
  log(message: string): void;
}

// ─── Output Option Types ─────────────────────────────────────────────────────

export interface PlotOptions {
  color?: Color;
  lineWidth?: number;
  style?: PlotStyle;
  title?: string;
}

export interface HLineOptions {
  color?: Color;
  lineStyle?: LineStyle;
  lineWidth?: number;
  title?: string;
}

export interface PlotShapeOptions {
  shape?: ShapeStyle;
  location?: ShapeLocation;
  color?: Color;
  size?: number;
  text?: string;
}

export interface ZoneOptions {
  type?: 'support' | 'resistance' | 'neutral';
  color?: Color;
  borderColor?: Color;
  label?: string;
}

export interface LabelOptions {
  price?: number;
  color?: Color;
  textColor?: Color;
  style?: 'label_up' | 'label_down' | 'none';
}

export interface LineOptions {
  color?: Color;
  lineWidth?: number;
  lineStyle?: LineStyle;
  extendLeft?: boolean;
  extendRight?: boolean;
}

export interface SignalOptions {
  price?: number;
  message?: string;
  strength?: number;
  color?: Color;
}

// ─── Indicator Definition ────────────────────────────────────────────────────

/**
 * Complete indicator definition
 */
export interface IndicatorDefinition {
  /** Metadata */
  meta: IndicatorMetadata;
  /** Input schema */
  inputs: IndicatorInput[];
  /** Calculation function called for each bar */
  calculate: (ctx: CalculationContext) => void;
  /** Optional initialization (called once before processing) */
  init?: (ctx: CalculationContext) => void;
  /** Optional cleanup */
  destroy?: () => void;
}

/**
 * Define a native Priisma indicator.
 *
 * This is the primary SDK entry point for creating indicators.
 */
export function defineIndicator(definition: {
  name: string;
  version?: string;
  author?: string;
  description?: string;
  overlay?: boolean;
  maxBarsBack?: number;
  inputs?: IndicatorInput[];
  calculate: (ctx: CalculationContext) => void;
  init?: (ctx: CalculationContext) => void;
  destroy?: () => void;
}): IndicatorDefinition {
  return {
    meta: {
      name: definition.name,
      version: definition.version ?? '1.0.0',
      author: definition.author,
      description: definition.description,
      overlay: definition.overlay ?? true,
      maxBarsBack: definition.maxBarsBack,
    },
    inputs: definition.inputs ?? [],
    calculate: definition.calculate,
    init: definition.init,
    destroy: definition.destroy,
  };
}
