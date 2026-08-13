/**
 * Unit tests for Platform Adapters
 */

import { describe, it, expect } from 'vitest';
import { createTopstepXAdapter } from '../../src/platforms/topstepx/adapter.js';
import { createTradovateAdapter } from '../../src/platforms/tradovate/adapter.js';
import { createTradeSeaAdapter } from '../../src/platforms/tradesea/adapter.js';

describe('Platform Adapters', () => {
  describe('TopstepX Adapter', () => {
    it('initializes with correct info', () => {
      const adapter = createTopstepXAdapter();
      expect(adapter.info.id).toBe('topstepx');
      expect(adapter.info.name).toBe('TopstepX');
      expect(adapter.info.detected).toBe(false);
    });

    it('starts undetected', async () => {
      const adapter = createTopstepXAdapter();
      const detected = await adapter.detect();
      expect(detected).toBe(false);
    });

    it('can be manually configured', async () => {
      const adapter = createTopstepXAdapter();
      adapter.configure('NQ', '5m');

      const state = await adapter.getSyncState();
      expect(state.symbol).toBe('NQ');
      expect(state.timeframe).toBe('5m');
      expect(state.synced).toBe(true);
    });

    it('notifies on sync change', async () => {
      const adapter = createTopstepXAdapter();
      let notified = false;

      adapter.onSyncChange(() => {
        notified = true;
      });

      adapter.configure('ES', '1m');
      expect(notified).toBe(true);
    });

    it('disconnect resets state', async () => {
      const adapter = createTopstepXAdapter();
      adapter.configure('NQ', '5m');
      adapter.disconnect();

      const state = await adapter.getSyncState();
      expect(state.synced).toBe(false);
      expect(adapter.info.detected).toBe(false);
    });
  });

  describe('Tradovate Adapter', () => {
    it('initializes with correct info', () => {
      const adapter = createTradovateAdapter();
      expect(adapter.info.id).toBe('tradovate');
      expect(adapter.info.name).toBe('Tradovate');
    });

    it('can be configured', async () => {
      const adapter = createTradovateAdapter();
      adapter.configure('ES', '15m');

      const state = await adapter.getSyncState();
      expect(state.symbol).toBe('ES');
      expect(state.timeframe).toBe('15m');
      expect(state.synced).toBe(true);
    });
  });

  describe('TradeSea Adapter', () => {
    it('initializes with correct info', () => {
      const adapter = createTradeSeaAdapter();
      expect(adapter.info.id).toBe('tradesea');
      expect(adapter.info.name).toBe('TradeSea');
    });

    it('can be configured', async () => {
      const adapter = createTradeSeaAdapter();
      adapter.configure('NQ', '1m');

      const state = await adapter.getSyncState();
      expect(state.symbol).toBe('NQ');
      expect(state.timeframe).toBe('1m');
    });
  });
});
