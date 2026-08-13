/**
 * Mock Market Data Provider
 *
 * Provides historical candle data from JSON fixtures for testing.
 * Used for parity testing against TradingView outputs.
 */

import type {
  Candle,
  CandleCallback,
  MarketDataProvider,
  Subscription,
  TickCallback,
  Timeframe,
} from '../engine/types.js';

export interface MockProviderOptions {
  /** Pre-loaded candle data keyed by "symbol:timeframe" */
  data: Record<string, Candle[]>;
}

export class MockProvider implements MarketDataProvider {
  readonly name = 'Mock Provider';
  private _connected = false;
  private data: Record<string, Candle[]>;

  constructor(options: MockProviderOptions) {
    this.data = options.data;
  }

  get connected(): boolean {
    return this._connected;
  }

  async connect(): Promise<void> {
    this._connected = true;
  }

  async disconnect(): Promise<void> {
    this._connected = false;
  }

  async subscribe(_subscription: Subscription, _onCandle: CandleCallback): Promise<void> {
    // Mock provider doesn't stream - use getHistorical instead
  }

  async unsubscribe(_subscription: Subscription): Promise<void> {
    // No-op for mock
  }

  async getHistorical(
    symbol: string,
    timeframe: Timeframe,
    start: Date,
    end: Date
  ): Promise<Candle[]> {
    const key = `${symbol}:${timeframe}`;
    const candles = this.data[key] || [];

    return candles.filter(
      (c) => c.timestamp >= start.getTime() && c.timestamp <= end.getTime()
    );
  }

  async onTick(_symbol: string, _callback: TickCallback): Promise<void> {
    // Not supported by mock provider
  }

  /**
   * Load candle data directly (for testing convenience)
   */
  loadCandles(symbol: string, timeframe: Timeframe, candles: Candle[]): void {
    const key = `${symbol}:${timeframe}`;
    this.data[key] = candles;
  }

  /**
   * Get all loaded candles for a symbol/timeframe (bypass date filter)
   */
  getAllCandles(symbol: string, timeframe: Timeframe): Candle[] {
    const key = `${symbol}:${timeframe}`;
    return this.data[key] || [];
  }
}

/**
 * Create a mock provider with optional pre-loaded data
 */
export function createMockProvider(data: Record<string, Candle[]> = {}): MockProvider {
  return new MockProvider({ data });
}
