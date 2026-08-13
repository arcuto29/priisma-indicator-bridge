/**
 * Universal Indicator Output Model
 *
 * Indicators produce normalized visual objects that are platform-independent.
 * The visualization layer consumes these to render on any supported platform.
 */

// ─── Style Types ─────────────────────────────────────────────────────────────

export type LineStyle = 'solid' | 'dashed' | 'dotted';
export type PlotStyle = 'line' | 'stepline' | 'histogram' | 'cross' | 'circles' | 'area';
export type ShapeStyle = 'triangleup' | 'triangledown' | 'circle' | 'cross' | 'diamond' | 'square' | 'flag' | 'label_up' | 'label_down';
export type ShapeLocation = 'abovebar' | 'belowbar' | 'top' | 'bottom' | 'absolute';
export type HAlign = 'left' | 'center' | 'right';
export type VAlign = 'top' | 'middle' | 'bottom';

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number; // 0-1
}

export interface StyleConfig {
  color?: Color;
  lineWidth?: number;
  lineStyle?: LineStyle;
  opacity?: number;
}

// ─── Output Objects ──────────────────────────────────────────────────────────

/**
 * Base for all visual output objects
 */
export interface OutputObjectBase {
  /** Unique ID for tracking lifecycle */
  id: string;
  /** Visibility flag */
  visible: boolean;
}

/**
 * A continuous line series (e.g., EMA, SMA, custom calculations)
 */
export interface SeriesPlot extends OutputObjectBase {
  type: 'series';
  /** Series name/label */
  name: string;
  /** Array of { timestamp, value } pairs */
  values: Array<{ timestamp: number; value: number | null }>;
  style: StyleConfig;
  plotStyle: PlotStyle;
}

/**
 * A single horizontal level line
 */
export interface LevelLine extends OutputObjectBase {
  type: 'level';
  /** Price level */
  price: number;
  /** Optional label */
  label?: string;
  /** Start time (null = extend left) */
  startTime: number | null;
  /** End time (null = extend right) */
  endTime: number | null;
  style: StyleConfig;
}

/**
 * A price zone (rectangle between two price levels)
 */
export interface ZonePlot extends OutputObjectBase {
  type: 'zone';
  /** Zone classification */
  zoneType: 'support' | 'resistance' | 'neutral';
  /** Upper boundary price */
  upper: number;
  /** Lower boundary price */
  lower: number;
  /** Midpoint */
  midpoint: number;
  /** Start time (when zone was created) */
  startTime: number;
  /** End time (null = extends to current/right edge) */
  endTime: number | null;
  /** Whether the zone has been invalidated */
  invalidated: boolean;
  /** Optional label */
  label?: string;
  style: StyleConfig;
  /** Border style (separate from fill) */
  borderStyle?: StyleConfig;
}

/**
 * A histogram (bar chart at bottom, like volume or MACD histogram)
 */
export interface HistogramPlot extends OutputObjectBase {
  type: 'histogram';
  name: string;
  values: Array<{ timestamp: number; value: number; color?: Color }>;
  style: StyleConfig;
}

/**
 * A text label placed on the chart
 */
export interface LabelPlot extends OutputObjectBase {
  type: 'label';
  /** Timestamp position (x) */
  timestamp: number;
  /** Price position (y) */
  price: number;
  /** Text content */
  text: string;
  /** Text color */
  textColor: Color;
  /** Background color */
  backgroundColor?: Color;
  /** Horizontal alignment */
  hAlign: HAlign;
  /** Vertical alignment */
  vAlign: VAlign;
  /** Font size */
  fontSize?: number;
}

/**
 * A shape marker on a candle (arrow, triangle, etc.)
 */
export interface MarkerPlot extends OutputObjectBase {
  type: 'marker';
  /** Timestamp where the marker appears */
  timestamp: number;
  /** Price level (or null for auto-placement) */
  price: number | null;
  /** Shape type */
  shape: ShapeStyle;
  /** Location relative to bar */
  location: ShapeLocation;
  /** Color */
  color: Color;
  /** Size multiplier (1 = normal) */
  size: number;
  /** Optional text */
  text?: string;
}

/**
 * A background color region (full width at time range)
 */
export interface BackgroundRegion extends OutputObjectBase {
  type: 'background';
  /** Start timestamp */
  startTime: number;
  /** End timestamp (null = current bar) */
  endTime: number | null;
  /** Fill color */
  color: Color;
}

/**
 * A line segment between two points (not a series)
 */
export interface LinePlot extends OutputObjectBase {
  type: 'line';
  /** Start point */
  x1: number; // timestamp
  y1: number; // price
  /** End point */
  x2: number; // timestamp
  y2: number; // price
  /** Extend left */
  extendLeft: boolean;
  /** Extend right */
  extendRight: boolean;
  style: StyleConfig;
}

/**
 * A table overlay (like Pine's table.new)
 */
export interface TablePlot extends OutputObjectBase {
  type: 'table';
  /** Position on chart */
  position: 'top_left' | 'top_center' | 'top_right' | 'middle_left' | 'middle_center' | 'middle_right' | 'bottom_left' | 'bottom_center' | 'bottom_right';
  /** Table rows and columns */
  cells: Array<Array<{
    text: string;
    textColor?: Color;
    backgroundColor?: Color;
  }>>;
}

/**
 * A signal event (buy/sell/alert marker)
 */
export interface SignalPlot extends OutputObjectBase {
  type: 'signal';
  /** Signal direction */
  direction: 'long' | 'short' | 'neutral';
  /** Timestamp */
  timestamp: number;
  /** Price level */
  price: number;
  /** Signal message */
  message?: string;
  /** Strength (0-1) */
  strength?: number;
  color: Color;
}

// ─── Union Type ──────────────────────────────────────────────────────────────

/**
 * Any visual output object an indicator can produce
 */
export type OutputObject =
  | SeriesPlot
  | LevelLine
  | ZonePlot
  | HistogramPlot
  | LabelPlot
  | MarkerPlot
  | BackgroundRegion
  | LinePlot
  | TablePlot
  | SignalPlot;

/**
 * Complete output from an indicator execution
 */
export interface IndicatorOutput {
  /** Indicator identifier */
  indicatorId: string;
  /** All visual objects produced */
  objects: OutputObject[];
  /** Timestamp of last calculation */
  lastCalculated: number;
  /** Any warnings or info messages */
  messages?: string[];
}
