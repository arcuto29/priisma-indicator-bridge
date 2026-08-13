/**
 * Pine Script Compatibility Analyzer
 *
 * Analyzes a Pine Script source string to determine which features it uses
 * and produces a compatibility report.
 *
 * NOTE: This is a BASIC static analyzer. It uses pattern matching, not a full parser.
 * It is sufficient for compatibility estimation but not for transpilation.
 * A full Pine parser/transpiler will be built separately.
 */

import { PINE_FEATURES } from './supported-features.js';
import type { CompatibilityReport, PineFeature } from './supported-features.js';

/**
 * Common Pine patterns to detect
 */
const FEATURE_PATTERNS: Array<{ pattern: RegExp; featureName: string }> = [
  // Core language
  { pattern: /\bindicator\s*\(/, featureName: 'indicator()' },
  { pattern: /\bstrategy\s*\(/, featureName: 'strategy()' },
  { pattern: /\blibrary\s*\(/, featureName: 'library()' },
  { pattern: /\bvar\s+/, featureName: 'var' },
  { pattern: /\bvarip\s+/, featureName: 'varip' },
  { pattern: /\bimport\s+/, featureName: 'import' },
  { pattern: /\bexport\s+/, featureName: 'export' },
  { pattern: /\btype\s+\w+/, featureName: 'type definitions (UDT)' },
  { pattern: /\bmethod\s+/, featureName: 'method definitions' },

  // Inputs
  { pattern: /\binput\.int\s*\(/, featureName: 'input.int()' },
  { pattern: /\binput\.float\s*\(/, featureName: 'input.float()' },
  { pattern: /\binput\.bool\s*\(/, featureName: 'input.bool()' },
  { pattern: /\binput\.string\s*\(/, featureName: 'input.string()' },
  { pattern: /\binput\.color\s*\(/, featureName: 'input.color()' },
  { pattern: /\binput\.timeframe\s*\(/, featureName: 'input.timeframe()' },
  { pattern: /\binput\.symbol\s*\(/, featureName: 'input.symbol()' },
  { pattern: /\binput\.source\s*\(/, featureName: 'input.source()' },
  { pattern: /\binput\.session\s*\(/, featureName: 'input.session()' },

  // Plots
  { pattern: /\bplot\s*\(/, featureName: 'plot()' },
  { pattern: /\bplotshape\s*\(/, featureName: 'plotshape()' },
  { pattern: /\bplotchar\s*\(/, featureName: 'plotchar()' },
  { pattern: /\bplotarrow\s*\(/, featureName: 'plotarrow()' },
  { pattern: /\bplotbar\s*\(/, featureName: 'plotbar()' },
  { pattern: /\bplotcandle\s*\(/, featureName: 'plotcandle()' },
  { pattern: /\bbgcolor\s*\(/, featureName: 'bgcolor()' },
  { pattern: /\bbarcolor\s*\(/, featureName: 'barcolor()' },
  { pattern: /\bhline\s*\(/, featureName: 'hline()' },
  { pattern: /\bfill\s*\(/, featureName: 'fill()' },

  // TA
  { pattern: /\bta\.sma\s*\(/, featureName: 'ta.sma()' },
  { pattern: /\bta\.ema\s*\(/, featureName: 'ta.ema()' },
  { pattern: /\bta\.wma\s*\(/, featureName: 'ta.wma()' },
  { pattern: /\bta\.vwma\s*\(/, featureName: 'ta.vwma()' },
  { pattern: /\bta\.rma\s*\(/, featureName: 'ta.rma()' },
  { pattern: /\bta\.rsi\s*\(/, featureName: 'ta.rsi()' },
  { pattern: /\bta\.atr\s*\(/, featureName: 'ta.atr()' },
  { pattern: /\bta\.macd\s*\(/, featureName: 'ta.macd()' },
  { pattern: /\bta\.bb\s*\(/, featureName: 'ta.bb()' },
  { pattern: /\bta\.stoch\s*\(/, featureName: 'ta.stoch()' },
  { pattern: /\bta\.highest\s*\(/, featureName: 'ta.highest()' },
  { pattern: /\bta\.lowest\s*\(/, featureName: 'ta.lowest()' },
  { pattern: /\bta\.stdev\s*\(/, featureName: 'ta.stdev()' },
  { pattern: /\bta\.crossover\s*\(/, featureName: 'ta.crossover()' },
  { pattern: /\bta\.crossunder\s*\(/, featureName: 'ta.crossunder()' },
  { pattern: /\bta\.change\s*\(/, featureName: 'ta.change()' },
  { pattern: /\bta\.roc\s*\(/, featureName: 'ta.roc()' },
  { pattern: /\bta\.vwap\s*\(/, featureName: 'ta.vwap()' },
  { pattern: /\bta\.tr\s*\(/, featureName: 'ta.tr()' },
  { pattern: /\bta\.pivothigh\s*\(/, featureName: 'ta.pivothigh()' },
  { pattern: /\bta\.pivotlow\s*\(/, featureName: 'ta.pivotlow()' },
  { pattern: /\bta\.valuewhen\s*\(/, featureName: 'ta.valuewhen()' },
  { pattern: /\bta\.barssince\s*\(/, featureName: 'ta.barssince()' },
  { pattern: /\bta\.supertrend\s*\(/, featureName: 'ta.supertrend()' },

  // Request/MTF
  { pattern: /\brequest\.security\s*\(/, featureName: 'request.security()' },
  { pattern: /\brequest\.security_lower_tf\s*\(/, featureName: 'request.security_lower_tf()' },
  { pattern: /\brequest\.financial\s*\(/, featureName: 'request.financial()' },

  // Drawing
  { pattern: /\bline\.new\s*\(/, featureName: 'line.new()' },
  { pattern: /\blabel\.new\s*\(/, featureName: 'label.new()' },
  { pattern: /\bbox\.new\s*\(/, featureName: 'box.new()' },
  { pattern: /\btable\.new\s*\(/, featureName: 'table.new()' },
  { pattern: /\bpolyline\.new\s*\(/, featureName: 'polyline.new()' },

  // Arrays
  { pattern: /\barray\.new/, featureName: 'array.new()' },
  { pattern: /\barray\.push\s*\(/, featureName: 'array.push()' },
  { pattern: /\barray\.pop\s*\(/, featureName: 'array.pop()' },
  { pattern: /\barray\.get\s*\(/, featureName: 'array.get()' },
  { pattern: /\barray\.set\s*\(/, featureName: 'array.set()' },
  { pattern: /\barray\.size\s*\(/, featureName: 'array.size()' },
  { pattern: /\barray\.remove\s*\(/, featureName: 'array.remove()' },
  { pattern: /\barray\.sort\s*\(/, featureName: 'array.sort()' },

  // Matrix
  { pattern: /\bmatrix\.new\s*\(/, featureName: 'matrix.new()' },
  { pattern: /\bmatrix\./, featureName: 'matrix.*' },

  // Alert
  { pattern: /\balert\s*\(/, featureName: 'alert()' },
  { pattern: /\balertcondition\s*\(/, featureName: 'alertcondition()' },
];

/**
 * Analyze a Pine Script source string for compatibility
 */
export function analyzePineScript(source: string): CompatibilityReport {
  const detectedFeatures = new Set<string>();

  // Detect features by pattern
  for (const { pattern, featureName } of FEATURE_PATTERNS) {
    if (pattern.test(source)) {
      detectedFeatures.add(featureName);
    }
  }

  // Look up support status
  let supported = 0;
  let partial = 0;
  let planned = 0;
  let unsupported = 0;
  const unsupportedFeatures: string[] = [];
  const partialFeatures: Array<{ name: string; notes: string }> = [];

  const allPineFeatures: PineFeature[] = [];
  for (const category of Object.values(PINE_FEATURES)) {
    allPineFeatures.push(...category);
  }

  for (const featureName of detectedFeatures) {
    const feature = allPineFeatures.find(
      (f) => f.name === featureName || f.name.replace('()', '') === featureName
    );

    if (!feature) {
      // Unknown feature — treat as unsupported
      unsupported++;
      unsupportedFeatures.push(featureName);
    } else {
      switch (feature.status) {
        case 'supported':
          supported++;
          break;
        case 'partial':
          partial++;
          partialFeatures.push({ name: feature.name, notes: feature.notes ?? '' });
          break;
        case 'planned':
          planned++;
          unsupportedFeatures.push(`${feature.name} (planned)`);
          break;
        case 'unsupported':
          unsupported++;
          unsupportedFeatures.push(feature.name);
          break;
      }
    }
  }

  const totalFeatures = detectedFeatures.size;
  const overallPercent = totalFeatures === 0
    ? 100
    : Math.round(((supported + partial * 0.7) / totalFeatures) * 100);

  let recommendation: CompatibilityReport['recommendation'];
  if (overallPercent >= 95 && unsupported === 0) {
    recommendation = 'full';
  } else if (overallPercent >= 75) {
    recommendation = 'partial';
  } else if (overallPercent >= 50) {
    recommendation = 'manual_review';
  } else {
    recommendation = 'not_supported';
  }

  return {
    overallPercent,
    totalFeatures,
    supported,
    partial,
    planned,
    unsupported,
    unsupportedFeatures,
    partialFeatures,
    recommendation,
  };
}
