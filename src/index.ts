/**
 * Priisma Indicator Bridge
 *
 * Local indicator calculation and visualization bridge
 * for trading platforms (TopstepX, Tradovate, TradeSea, etc.)
 *
 * This project does NOT:
 * - Execute trades
 * - Modify orders
 * - Access broker accounts beyond read-only market data
 * - Inject code into trading platforms
 * - Run Pine Script directly
 *
 * It DOES:
 * - Calculate indicator levels locally from market data
 * - Display calculated zones in a companion overlay/window
 * - Remain platform-independent
 */

export * from './engine/index.js';
export * from './indicators/index.js';
export * from './data/index.js';

console.log('Priisma Indicator Bridge v0.1.0');
console.log('Status: Awaiting Manual Zones Pine Script source for Phase 1');
