/**
 * Priisma Indicator Bridge
 *
 * A universal indicator bridge that lets traders use custom indicator logic
 * across trading platforms that do not natively support TradingView Pine Script.
 *
 * Architecture:
 *   Indicator Definition
 *   → Priisma Indicator Engine
 *   → Normalized Market Data
 *   → Calculated Indicator Output
 *   → Platform-Agnostic Visual Layer
 *   → Supported Trading Platform
 *
 * This project is NOT:
 * - A Pine Script runtime hack
 * - A broker / execution engine
 * - An auto-trading system
 *
 * It IS:
 * - A local indicator calculation + visualization bridge
 * - Platform-independent
 * - Read-only (no order placement)
 */

// Core engine
export * from './engine/index.js';

// Indicator SDK
export * from './sdk/index.js';

// Indicators
export * from './indicators/index.js';

// Data providers
export * from './data/index.js';

// Platform adapters
export * from './platforms/index.js';

// Pine compatibility
export * from './pine-compat/index.js';

// Parity testing
export * from './parity/index.js';
