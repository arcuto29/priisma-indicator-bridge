/**
 * TopstepX Platform Adapter
 *
 * Handles TopstepX-specific platform detection and sync.
 *
 * NOTES:
 * - TopstepX is a web-based platform (Chromium/Electron)
 * - Uses an embedded TradingView chart that does NOT support custom Pine
 * - We do NOT inject into or modify the TopstepX DOM
 * - We do NOT intercept order events
 * - This adapter is for SYNC purposes only (detect symbol, timeframe, chart geometry)
 *
 * IMPORTANT: This is a STUB awaiting TopstepX API documentation.
 * Initial implementation will use manual symbol/timeframe configuration.
 */

import type { Timeframe } from '../../engine/types.js';
import type { PlatformAdapter, PlatformInfo, PlatformSyncState } from '../adapter.js';

export class TopstepXAdapter implements PlatformAdapter {
  readonly info: PlatformInfo = {
    id: 'topstepx',
    name: 'TopstepX',
    detected: false,
  };

  private syncCallbacks: Array<(state: PlatformSyncState) => void> = [];
  private currentState: PlatformSyncState = {
    symbol: null,
    timeframe: null,
    geometry: null,
    synced: false,
  };

  /**
   * Manual configuration for initial version.
   * Eventually this could auto-detect from the platform.
   */
  configure(symbol: string, timeframe: Timeframe): void {
    this.currentState = {
      symbol,
      timeframe,
      geometry: null,
      synced: true,
    };
    this.info.detected = true;
    this.notifyCallbacks();
  }

  async detect(): Promise<boolean> {
    // STUB: In a real implementation, this would check if TopstepX is running
    // For now, rely on manual configuration via configure()
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

  private notifyCallbacks(): void {
    for (const cb of this.syncCallbacks) {
      cb({ ...this.currentState });
    }
  }
}

export function createTopstepXAdapter(): TopstepXAdapter {
  return new TopstepXAdapter();
}
