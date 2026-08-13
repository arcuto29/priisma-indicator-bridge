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
