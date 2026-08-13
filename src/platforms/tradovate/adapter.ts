/**
 * Tradovate Platform Adapter
 *
 * Handles Tradovate-specific platform detection and sync.
 *
 * NOTES:
 * - Tradovate has a documented REST + WebSocket API
 * - Well-known endpoint structure for market data
 * - This adapter is a STUB — will be fleshed out when Tradovate support is prioritized
 */

import type { Timeframe } from '../../engine/types.js';
import type { PlatformAdapter, PlatformInfo, PlatformSyncState } from '../adapter.js';

export class TradovateAdapter implements PlatformAdapter {
  readonly info: PlatformInfo = {
    id: 'tradovate',
    name: 'Tradovate',
    detected: false,
  };

  private syncCallbacks: Array<(state: PlatformSyncState) => void> = [];
  private currentState: PlatformSyncState = {
    symbol: null,
    timeframe: null,
    geometry: null,
    synced: false,
  };

  configure(symbol: string, timeframe: Timeframe): void {
    this.currentState = {
      symbol,
      timeframe,
      geometry: null,
      synced: true,
    };
    this.info.detected = true;
  }

  async detect(): Promise<boolean> {
    return this.info.detected;
  }

  async getSyncState(): Promise<PlatformSyncState> {
    return { ...this.currentState };
  }

  onSyncChange(callback: (state: PlatformSyncState) => void): void {
    this.syncCallbacks.push(callback);
  }

  disconnect(): void {
    this.currentState.synced = false;
    this.info.detected = false;
    this.syncCallbacks = [];
  }
}

export function createTradovateAdapter(): TradovateAdapter {
  return new TradovateAdapter();
}
