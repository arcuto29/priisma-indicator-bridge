/**
 * TradeSea Platform Adapter
 *
 * Handles TradeSea-specific platform detection and sync.
 *
 * NOTES:
 * - TradeSea is a browser-based trading platform
 * - This adapter is a STUB — will be fleshed out when TradeSea support is prioritized
 */

import type { Timeframe } from '../../engine/types.js';
import type { PlatformAdapter, PlatformInfo, PlatformSyncState } from '../adapter.js';

export class TradeSeaAdapter implements PlatformAdapter {
  readonly info: PlatformInfo = {
    id: 'tradesea',
    name: 'TradeSea',
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

export function createTradeSeaAdapter(): TradeSeaAdapter {
  return new TradeSeaAdapter();
}
