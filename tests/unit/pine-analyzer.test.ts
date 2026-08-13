/**
 * Unit tests for Pine Script Compatibility Analyzer
 */

import { describe, it, expect } from 'vitest';
import { analyzePineScript } from '../../src/pine-compat/analyzer.js';
import { getOverallStats, getFeatureStatus } from '../../src/pine-compat/supported-features.js';

describe('Pine Analyzer', () => {
  it('detects basic indicator features', () => {
    const script = `
//@version=5
indicator("Test", overlay=true)
src = input.source(close, "Source")
length = input.int(14, "Length")
smaValue = ta.sma(src, length)
plot(smaValue, color=color.blue)
`;
    const report = analyzePineScript(script);

    expect(report.totalFeatures).toBeGreaterThan(0);
    expect(report.supported).toBeGreaterThan(0);
    expect(report.overallPercent).toBeGreaterThan(80);
    expect(report.recommendation).toBe('full');
  });

  it('flags unsupported features', () => {
    const script = `
//@version=5
indicator("Complex", overlay=true)
import TradingView/ta/7
m = matrix.new<float>(3, 3)
request.financial(syminfo.tickerid, "EARNINGS", "TTM")
`;
    const report = analyzePineScript(script);

    expect(report.unsupported).toBeGreaterThan(0);
    expect(report.unsupportedFeatures.length).toBeGreaterThan(0);
    expect(report.recommendation).not.toBe('full');
  });

  it('handles strategy scripts correctly', () => {
    const script = `
//@version=5
strategy("My Strategy", overlay=true)
ta.crossover(ta.sma(close, 14), ta.sma(close, 28))
`;
    const report = analyzePineScript(script);

    expect(report.unsupportedFeatures.some(f => f.includes('strategy'))).toBe(true);
  });

  it('reports high compatibility for simple indicators', () => {
    const script = `
//@version=5
indicator("RSI", overlay=false)
length = input.int(14, "Length")
src = input.source(close, "Source")
rsiVal = ta.rsi(src, length)
plot(rsiVal)
hline(70)
hline(30)
bgcolor(rsiVal > 70 ? color.new(color.red, 90) : na)
`;
    const report = analyzePineScript(script);

    expect(report.overallPercent).toBeGreaterThanOrEqual(90);
    expect(report.recommendation).toBe('full');
  });

  it('handles empty script', () => {
    const report = analyzePineScript('');
    expect(report.totalFeatures).toBe(0);
    expect(report.overallPercent).toBe(100);
  });

  it('detects drawing objects', () => {
    const script = `
line.new(bar_index[1], high[1], bar_index, high)
label.new(bar_index, high, "Hi")
box.new(bar_index[10], high, bar_index, low)
`;
    const report = analyzePineScript(script);

    expect(report.supported).toBeGreaterThanOrEqual(3);
  });

  it('detects array operations', () => {
    const script = `
var a = array.new_float(0)
array.push(a, close)
array.get(a, 0)
array.size(a)
array.sort(a)
`;
    const report = analyzePineScript(script);

    expect(report.supported).toBeGreaterThanOrEqual(3);
  });
});

describe('Feature Manifest', () => {
  it('has overall stats', () => {
    const stats = getOverallStats();
    expect(stats.total).toBeGreaterThan(50);
    expect(stats.supported).toBeGreaterThan(20);
  });

  it('can lookup feature status', () => {
    const sma = getFeatureStatus('ta.sma()');
    expect(sma).toBeDefined();
    expect(sma?.status).toBe('supported');

    const matrix = getFeatureStatus('matrix.new()');
    expect(matrix).toBeDefined();
    expect(matrix?.status).toBe('unsupported');
  });
});
