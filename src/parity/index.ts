/**
 * Parity Testing Framework
 *
 * Compares local indicator engine output against TradingView reference data.
 * Used to verify that ported indicators produce identical (or near-identical)
 * results to the original Pine Script.
 */

export { ParityRunner, runParityTest } from './runner.js';
export type { ParityTestConfig, ParityResult, FieldComparison } from './runner.js';
