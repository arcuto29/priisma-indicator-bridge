/**
 * Market Data Provider Interface
 *
 * All market data providers must implement the MarketDataProvider interface.
 * This abstraction allows the indicator engine to work with any data source:
 * - TopstepX / ProjectX API
 * - Tradovate API
 * - TradeSea API
 * - CSV/JSON historical data files
 * - Mock data for testing
 */

export type { MarketDataProvider } from '../engine/types.js';

// Re-export related types for convenience
export type {
  Candle,
  CandleCallback,
  Subscription,
  TickCallback,
  Timeframe,
} from '../engine/types.js';
