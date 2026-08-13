/**
 * Core types for the Priisma Indicator Bridge
 *
 * All indicator engines consume normalized Candle data
 * and produce normalized output specific to their indicator type.
 */

// ─── Market Data Types ───────────────────────────────────────────────────────

/**
 * Normalized candle/bar data.
 * All indicator engines receive data in this format regardless of source.
 */
export interface Candle {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Supported timeframe values.
 * Using string literals for flexibility with different data providers.
 */
export type Timeframe =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '1D'
  | '1W'
  | '1M';

/**
 * Symbol specification
 */
export interface SymbolInfo {
  /** Ticker symbol (e.g., "NQ", "ES", "MNQ") */
  symbol: string;
  /** Full name if available */
  name?: string;
  /** Tick size / minimum price increment */
  tickSize: number;
  /** Point value (dollar value per point) */
  pointValue: number;
  /** Exchange if known */
  exchange?: string;
}

// ─── Zone Types ──────────────────────────────────────────────────────────────

/**
 * Zone type classification
 */
export type ZoneType = 'support' | 'resistance';

/**
 * Zone status
 */
export type ZoneStatus = 'active' | 'invalidated';

/**
 * A calculated zone from the Manual Zones indicator.
 * This is the normalized output format.
 */
export interface Zone {
  /** Unique identifier for this zone */
  id: string;
  /** Whether this is support or resistance */
  type: ZoneType;
  /** Upper boundary of the zone */
  upper: number;
  /** Lower boundary of the zone */
  lower: number;
  /** Midpoint of the zone */
  midpoint: number;
  /** Timestamp when the zone was created (candle timestamp) */
  createdAt: number;
  /** Timestamp when the zone was invalidated (null if still active) */
  invalidatedAt: number | null;
  /** Current status */
  status: ZoneStatus;
  /** Timeframe this zone was calculated from */
  sourceTimeframe: Timeframe;
  /** Index of the candle that created this zone (for parity testing) */
  createdAtIndex: number;
  /** Index of the candle that invalidated this zone (for parity testing) */
  invalidatedAtIndex: number | null;
}

// ─── Indicator Engine Interface ──────────────────────────────────────────────

/**
 * Configuration/inputs for an indicator engine.
 * Each indicator defines its own specific config type.
 */
export interface IndicatorConfig {
  [key: string]: unknown;
}

/**
 * Base interface all indicator engines must implement.
 */
export interface IndicatorEngine<TConfig extends IndicatorConfig, TOutput> {
  /** Human-readable indicator name */
  readonly name: string;
  /** Current configuration */
  readonly config: TConfig;

  /**
   * Reset the engine state (clear all calculated values).
   */
  reset(): void;

  /**
   * Process a single new candle.
   * Call this sequentially for each candle in order.
   */
  processCandle(candle: Candle, index: number): void;

  /**
   * Process a batch of candles (e.g., historical data load).
   * Calls processCandle internally for each.
   */
  processBatch(candles: Candle[]): void;

  /**
   * Get current output state.
   */
  getOutput(): TOutput;
}

// ─── Data Provider Types ─────────────────────────────────────────────────────

/**
 * Subscription request for market data
 */
export interface Subscription {
  symbol: string;
  timeframe: Timeframe;
}

/**
 * Callback for new candle data
 */
export type CandleCallback = (candle: Candle, symbol: string, timeframe: Timeframe) => void;

/**
 * Callback for tick-level data (if needed)
 */
export type TickCallback = (price: number, volume: number, timestamp: number) => void;

/**
 * Market data provider abstraction.
 * All providers must implement this interface.
 */
export interface MarketDataProvider {
  /** Provider name for identification */
  readonly name: string;

  /** Whether the provider is currently connected */
  readonly connected: boolean;

  /** Connect to the data source */
  connect(): Promise<void>;

  /** Disconnect from the data source */
  disconnect(): Promise<void>;

  /** Subscribe to candle updates for a symbol/timeframe */
  subscribe(subscription: Subscription, onCandle: CandleCallback): Promise<void>;

  /** Unsubscribe from a symbol/timeframe */
  unsubscribe(subscription: Subscription): Promise<void>;

  /** Get historical candles */
  getHistorical(
    symbol: string,
    timeframe: Timeframe,
    start: Date,
    end: Date
  ): Promise<Candle[]>;

  /** Subscribe to tick data (optional, not all providers support this) */
  onTick?(symbol: string, callback: TickCallback): Promise<void>;
}
