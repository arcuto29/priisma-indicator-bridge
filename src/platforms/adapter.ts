/**
 * Platform Adapter Interface
 *
 * Platform adapters handle platform-specific concerns:
 * - Platform detection
 * - Chart geometry / time-price coordinate mapping
 * - Overlay positioning
 * - Symbol/timeframe synchronization
 *
 * They do NOT contain indicator calculations.
 */

import type { Timeframe } from '../engine/types.js';
import type { OutputObject } from '../engine/output.js';

// ─── Platform Info ───────────────────────────────────────────────────────────

export interface PlatformInfo {
  /** Platform identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Whether the platform is currently detected/connected */
  detected: boolean;
  /** Platform version if detectable */
  version?: string;
}

// ─── Chart Geometry ──────────────────────────────────────────────────────────

export interface ChartGeometry {
  /** Left edge time */
  timeStart: number;
  /** Right edge time */
  timeEnd: number;
  /** Top price */
  priceTop: number;
  /** Bottom price */
  priceBottom: number;
  /** Chart pixel width */
  widthPx: number;
  /** Chart pixel height */
  heightPx: number;
  /** Pixel position of chart on screen (for overlay alignment) */
  screenX: number;
  screenY: number;
}

// ─── Sync State ──────────────────────────────────────────────────────────────

export interface PlatformSyncState {
  /** Currently active symbol on the platform */
  symbol: string | null;
  /** Currently active timeframe */
  timeframe: Timeframe | null;
  /** Last known chart geometry */
  geometry: ChartGeometry | null;
  /** Whether sync is currently active */
  synced: boolean;
}

// ─── Platform Adapter Interface ──────────────────────────────────────────────

export interface PlatformAdapter {
  /** Platform information */
  readonly info: PlatformInfo;

  /**
   * Attempt to detect and connect to the platform.
   * Returns true if platform is detected and ready.
   */
  detect(): Promise<boolean>;

  /**
   * Get current sync state (symbol, timeframe, geometry).
   */
  getSyncState(): Promise<PlatformSyncState>;

  /**
   * Subscribe to sync state changes.
   */
  onSyncChange(callback: (state: PlatformSyncState) => void): void;

  /**
   * Convert a time/price coordinate to screen pixel position.
   * Used for overlay alignment.
   */
  toScreenCoords?(time: number, price: number): { x: number; y: number } | null;

  /**
   * Render output objects using platform-native drawing if supported.
   * Returns true if the platform handled rendering natively.
   */
  renderNative?(objects: OutputObject[]): boolean;

  /**
   * Disconnect/cleanup
   */
  disconnect(): void;
}

// ─── Visualization Mode ──────────────────────────────────────────────────────

export type VisualizationMode =
  | 'companion'     // Separate chart window
  | 'overlay'       // Transparent overlay on top of platform
  | 'native'        // Platform provides rendering API
  | 'panel';        // Side panel with zone list (no chart)
