/**
 * Pine Script Compatibility Layer
 *
 * Handles:
 * - Analysis of Pine scripts for compatibility
 * - Feature detection
 * - Compatibility reporting
 */

export {
  PINE_FEATURES,
  getFeatureStatus,
  getOverallStats,
} from './supported-features.js';

export type {
  CompatibilityReport,
  FeatureStatus,
  PineFeature,
} from './supported-features.js';

export { analyzePineScript } from './analyzer.js';
