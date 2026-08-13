/**
 * Priisma Indicator Runtime
 *
 * Executes an IndicatorDefinition against a stream of candles,
 * producing OutputObjects.
 *
 * This is the core execution engine — platform-independent.
 */

import type { InputValues } from '../engine/inputs.js';
import { getDefaultValues } from '../engine/inputs.js';
import type {
  Color,
  IndicatorOutput,
  OutputObject,
  ZonePlot,
} from '../engine/output.js';
import type { Candle, Timeframe } from '../engine/types.js';
import type {
  CalculationContext,
  HLineOptions,
  IndicatorDefinition,
  LabelOptions,
  LineOptions,
  MathFunctions,
  PlotOptions,
  PlotShapeOptions,
  SignalOptions,
  TAFunctions,
  ZoneOptions,
} from './define-indicator.js';

// ─── Runtime State ───────────────────────────────────────────────────────────

export interface RuntimeConfig {
  symbol: string;
  timeframe: Timeframe;
  inputOverrides?: InputValues;
}

/**
 * Indicator Runtime — executes indicator logic bar-by-bar
 */
export class IndicatorRuntime {
  private definition: IndicatorDefinition;
  private config: RuntimeConfig;
  private inputValues: InputValues;

  // Execution state
  private candles: Candle[] = [];
  private state: Record<string, unknown> = {};
  private outputs: OutputObject[] = [];
  private seriesData: Map<string, Array<{ timestamp: number; value: number | null }>> = new Map();
  private zones: Map<string, ZonePlot> = new Map();
  private logs: string[] = [];
  private nextId = 0;

  constructor(definition: IndicatorDefinition, config: RuntimeConfig) {
    this.definition = definition;
    this.config = config;
    this.inputValues = {
      ...getDefaultValues({ inputs: definition.inputs }),
      ...config.inputOverrides,
    };
  }

  private generateId(): string {
    return `${this.definition.meta.name.replace(/\s+/g, '_')}_${this.nextId++}`;
  }

  // ─── Execution ───────────────────────────────────────────────────────

  reset(): void {
    this.candles = [];
    this.state = {};
    this.outputs = [];
    this.seriesData.clear();
    this.zones.clear();
    this.logs = [];
    this.nextId = 0;
  }

  /**
   * Process a batch of candles through the indicator
   */
  processBatch(candles: Candle[]): IndicatorOutput {
    this.reset();

    for (let i = 0; i < candles.length; i++) {
      this.processBar(candles[i], i, i === candles.length - 1);
    }

    return this.getOutput();
  }

  /**
   * Process a single new candle (for live updates)
   */
  processBar(candle: Candle, index: number, isLast: boolean): void {
    this.candles.push(candle);
    const ctx = this.buildContext(candle, index, isLast);

    if (index === 0 && this.definition.init) {
      this.definition.init(ctx);
    }

    this.definition.calculate(ctx);
  }

  /**
   * Get the current output state
   */
  getOutput(): IndicatorOutput {
    // Build final output objects
    const objects: OutputObject[] = [];

    // Add series plots
    for (const [name, values] of this.seriesData) {
      objects.push({
        type: 'series',
        id: `series_${name}`,
        name,
        values,
        visible: true,
        style: { color: { r: 33, g: 150, b: 243, a: 1 } },
        plotStyle: 'line',
      });
    }

    // Add zones
    for (const zone of this.zones.values()) {
      objects.push(zone);
    }

    // Add other accumulated outputs
    objects.push(...this.outputs);

    return {
      indicatorId: this.definition.meta.name,
      objects,
      lastCalculated: this.candles.length > 0
        ? this.candles[this.candles.length - 1].timestamp
        : 0,
      messages: this.logs.length > 0 ? [...this.logs] : undefined,
    };
  }

  // ─── Context Builder ─────────────────────────────────────────────────

  private buildContext(candle: Candle, index: number, isLast: boolean): CalculationContext {
    const openSeries = this.candles.map((c) => c.open);
    const highSeries = this.candles.map((c) => c.high);
    const lowSeries = this.candles.map((c) => c.low);
    const closeSeries = this.candles.map((c) => c.close);
    const volumeSeries = this.candles.map((c) => c.volume);

    const ta = this.buildTA(highSeries, lowSeries, closeSeries);
    const math = this.buildMath();

    const ctx: CalculationContext = {
      barIndex: index,
      candle,
      time: candle.timestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      openSeries,
      highSeries,
      lowSeries,
      closeSeries,
      volumeSeries,
      inputs: this.inputValues,
      isFirst: index === 0,
      isLast,
      isConfirmed: true, // historical data is always confirmed
      timeframe: this.config.timeframe,
      symbol: this.config.symbol,
      ta,
      math,
      state: this.state,

      // Output functions
      plot: (name, value, options) => this.handlePlot(name, value, candle.timestamp, options),
      hline: (price, options) => this.handleHLine(price, options),
      plotShape: (condition, options) => this.handlePlotShape(condition, candle, options),
      bgcolor: (color) => this.handleBgColor(color, candle.timestamp),
      zone: (id, upper, lower, options) => this.handleZone(id, upper, lower, candle.timestamp, options),
      removeZone: (id) => this.handleRemoveZone(id, candle.timestamp),
      label: (text, options) => this.handleLabel(text, candle, options),
      line: (x1, y1, x2, y2, options) => this.handleLine(x1, y1, x2, y2, options),
      signal: (direction, options) => this.handleSignal(direction, candle, options),
      log: (message) => this.logs.push(`[bar ${index}] ${message}`),
    };

    return ctx;
  }

  // ─── Output Handlers ─────────────────────────────────────────────────

  private handlePlot(name: string, value: number | null, timestamp: number, _options?: PlotOptions): void {
    if (!this.seriesData.has(name)) {
      this.seriesData.set(name, []);
    }
    this.seriesData.get(name)!.push({ timestamp, value });
  }

  private handleHLine(price: number, options?: HLineOptions): void {
    const id = `hline_${price}_${this.generateId()}`;
    // Only add once (hlines are static)
    if (!this.outputs.some((o) => o.type === 'level' && (o as any).price === price)) {
      this.outputs.push({
        type: 'level',
        id,
        price,
        label: options?.title,
        startTime: null,
        endTime: null,
        visible: true,
        style: {
          color: options?.color ?? { r: 128, g: 128, b: 128, a: 1 },
          lineWidth: options?.lineWidth ?? 1,
          lineStyle: options?.lineStyle ?? 'dashed',
        },
      });
    }
  }

  private handlePlotShape(condition: boolean, candle: Candle, options?: PlotShapeOptions): void {
    if (!condition) return;
    this.outputs.push({
      type: 'marker',
      id: this.generateId(),
      timestamp: candle.timestamp,
      price: null,
      shape: options?.shape ?? 'triangleup',
      location: options?.location ?? 'abovebar',
      color: options?.color ?? { r: 0, g: 150, b: 136, a: 1 },
      size: options?.size ?? 1,
      text: options?.text,
      visible: true,
    });
  }

  private handleBgColor(color: Color | null, timestamp: number): void {
    if (!color) return;
    this.outputs.push({
      type: 'background',
      id: this.generateId(),
      startTime: timestamp,
      endTime: null,
      color,
      visible: true,
    });
  }

  private handleZone(id: string, upper: number, lower: number, timestamp: number, options?: ZoneOptions): void {
    const zone: ZonePlot = {
      type: 'zone',
      id: `zone_${id}`,
      zoneType: options?.type ?? 'neutral',
      upper,
      lower,
      midpoint: (upper + lower) / 2,
      startTime: timestamp,
      endTime: null,
      invalidated: false,
      label: options?.label,
      visible: true,
      style: {
        color: options?.color ?? { r: 33, g: 150, b: 243, a: 0.2 },
      },
      borderStyle: options?.borderColor
        ? { color: options.borderColor }
        : undefined,
    };
    this.zones.set(id, zone);
  }

  private handleRemoveZone(id: string, timestamp: number): void {
    const zone = this.zones.get(id);
    if (zone) {
      zone.endTime = timestamp;
      zone.invalidated = true;
    }
  }

  private handleLabel(text: string, candle: Candle, options?: LabelOptions): void {
    this.outputs.push({
      type: 'label',
      id: this.generateId(),
      timestamp: candle.timestamp,
      price: options?.price ?? candle.high,
      text,
      textColor: options?.textColor ?? { r: 255, g: 255, b: 255, a: 1 },
      backgroundColor: options?.color,
      hAlign: 'center',
      vAlign: 'bottom',
      visible: true,
    });
  }

  private handleLine(x1: number, y1: number, x2: number, y2: number, options?: LineOptions): void {
    this.outputs.push({
      type: 'line',
      id: this.generateId(),
      x1, y1, x2, y2,
      extendLeft: options?.extendLeft ?? false,
      extendRight: options?.extendRight ?? false,
      visible: true,
      style: {
        color: options?.color ?? { r: 128, g: 128, b: 128, a: 1 },
        lineWidth: options?.lineWidth ?? 1,
        lineStyle: options?.lineStyle ?? 'solid',
      },
    });
  }

  private handleSignal(direction: 'long' | 'short' | 'neutral', candle: Candle, options?: SignalOptions): void {
    this.outputs.push({
      type: 'signal',
      id: this.generateId(),
      direction,
      timestamp: candle.timestamp,
      price: options?.price ?? candle.close,
      message: options?.message,
      strength: options?.strength,
      color: options?.color ?? { r: 0, g: 150, b: 136, a: 1 },
      visible: true,
    });
  }

  // ─── TA Functions ────────────────────────────────────────────────────

  private buildTA(
    _highSeries: number[],
    _lowSeries: number[],
    _closeSeries: number[]
  ): TAFunctions {
    return {
      sma: (source, length) => {
        if (source.length < length) return null;
        const slice = source.slice(-length);
        return slice.reduce((a, b) => a + b, 0) / length;
      },
      ema: (source, length) => {
        if (source.length < length) return null;
        const k = 2 / (length + 1);
        let ema = source.slice(0, length).reduce((a, b) => a + b, 0) / length;
        for (let i = length; i < source.length; i++) {
          ema = source[i] * k + ema * (1 - k);
        }
        return ema;
      },
      rsi: (source, length) => {
        if (source.length < length + 1) return null;
        let avgGain = 0;
        let avgLoss = 0;
        for (let i = 1; i <= length; i++) {
          const change = source[i] - source[i - 1];
          if (change > 0) avgGain += change;
          else avgLoss += Math.abs(change);
        }
        avgGain /= length;
        avgLoss /= length;
        for (let i = length + 1; i < source.length; i++) {
          const change = source[i] - source[i - 1];
          avgGain = (avgGain * (length - 1) + (change > 0 ? change : 0)) / length;
          avgLoss = (avgLoss * (length - 1) + (change < 0 ? Math.abs(change) : 0)) / length;
        }
        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
      },
      atr: (length) => {
        if (this.candles.length < length + 1) return null;
        const trs: number[] = [];
        for (let i = 1; i < this.candles.length; i++) {
          const c = this.candles[i];
          const pc = this.candles[i - 1];
          const tr = Math.max(
            c.high - c.low,
            Math.abs(c.high - pc.close),
            Math.abs(c.low - pc.close)
          );
          trs.push(tr);
        }
        if (trs.length < length) return null;
        // RMA (Wilder's smoothing)
        let atr = trs.slice(0, length).reduce((a, b) => a + b, 0) / length;
        for (let i = length; i < trs.length; i++) {
          atr = (atr * (length - 1) + trs[i]) / length;
        }
        return atr;
      },
      highest: (source, length) => {
        if (source.length < length) return null;
        return Math.max(...source.slice(-length));
      },
      lowest: (source, length) => {
        if (source.length < length) return null;
        return Math.min(...source.slice(-length));
      },
      stdev: (source, length) => {
        if (source.length < length) return null;
        const slice = source.slice(-length);
        const mean = slice.reduce((a, b) => a + b, 0) / length;
        const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / length;
        return Math.sqrt(variance);
      },
      crossover: (a, b) => {
        if (a.length < 2 || b.length < 2) return false;
        return a[a.length - 1] > b[b.length - 1] && a[a.length - 2] <= b[b.length - 2];
      },
      crossunder: (a, b) => {
        if (a.length < 2 || b.length < 2) return false;
        return a[a.length - 1] < b[b.length - 1] && a[a.length - 2] >= b[b.length - 2];
      },
      change: (source, length = 1) => {
        if (source.length <= length) return null;
        return source[source.length - 1] - source[source.length - 1 - length];
      },
      roc: (source, length) => {
        if (source.length <= length) return null;
        const prev = source[source.length - 1 - length];
        if (prev === 0) return null;
        return ((source[source.length - 1] - prev) / prev) * 100;
      },
      vwap: () => {
        if (this.candles.length === 0) return null;
        let cumulativeTPV = 0;
        let cumulativeVolume = 0;
        for (const c of this.candles) {
          const tp = (c.high + c.low + c.close) / 3;
          cumulativeTPV += tp * c.volume;
          cumulativeVolume += c.volume;
        }
        if (cumulativeVolume === 0) return null;
        return cumulativeTPV / cumulativeVolume;
      },
    };
  }

  private buildMath(): MathFunctions {
    return {
      abs: Math.abs,
      ceil: Math.ceil,
      floor: Math.floor,
      round: (x, precision = 0) => {
        const mult = Math.pow(10, precision);
        return Math.round(x * mult) / mult;
      },
      max: (...values) => Math.max(...values),
      min: (...values) => Math.min(...values),
      pow: Math.pow,
      sqrt: Math.sqrt,
      log: Math.log,
      log10: Math.log10,
      sign: Math.sign,
      avg: (...values) => values.reduce((a, b) => a + b, 0) / values.length,
      sum: (source, length) => {
        if (source.length < length) return 0;
        return source.slice(-length).reduce((a, b) => a + b, 0);
      },
    };
  }
}

/**
 * Create a runtime for an indicator definition
 */
export function createRuntime(definition: IndicatorDefinition, config: RuntimeConfig): IndicatorRuntime {
  return new IndicatorRuntime(definition, config);
}
