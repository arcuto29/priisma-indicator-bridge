/**
 * Unit tests for Indicator Input/Settings system
 */

import { describe, it, expect } from 'vitest';
import {
  defineInputs,
  getDefaultValues,
  validateInputs,
} from '../../src/engine/inputs.js';
import type { IndicatorInput } from '../../src/engine/inputs.js';

const sampleInputs: IndicatorInput[] = [
  { key: 'length', label: 'Length', type: 'integer', defaultValue: 14, minValue: 1, maxValue: 500 },
  { key: 'multiplier', label: 'Multiplier', type: 'float', defaultValue: 2.0, minValue: 0.1, maxValue: 10.0 },
  { key: 'showLabels', label: 'Show Labels', type: 'boolean', defaultValue: true },
  { key: 'source', label: 'Source', type: 'source', defaultValue: 'close' },
  {
    key: 'maType',
    label: 'MA Type',
    type: 'dropdown',
    defaultValue: 'SMA',
    options: [
      { label: 'SMA', value: 'SMA' },
      { label: 'EMA', value: 'EMA' },
      { label: 'WMA', value: 'WMA' },
    ],
  },
  { key: 'lineStyle', label: 'Line Style', type: 'line_style', defaultValue: 'solid' },
];

describe('Input System', () => {
  describe('defineInputs', () => {
    it('creates an input schema', () => {
      const schema = defineInputs(sampleInputs);
      expect(schema.inputs).toHaveLength(6);
      expect(schema.inputs[0].key).toBe('length');
    });
  });

  describe('getDefaultValues', () => {
    it('extracts default values from schema', () => {
      const schema = defineInputs(sampleInputs);
      const defaults = getDefaultValues(schema);

      expect(defaults.length).toBe(14);
      expect(defaults.multiplier).toBe(2.0);
      expect(defaults.showLabels).toBe(true);
      expect(defaults.source).toBe('close');
      expect(defaults.maType).toBe('SMA');
      expect(defaults.lineStyle).toBe('solid');
    });
  });

  describe('validateInputs', () => {
    it('passes valid inputs', () => {
      const schema = defineInputs(sampleInputs);
      const values = getDefaultValues(schema);
      const errors = validateInputs(schema, values);
      expect(errors).toHaveLength(0);
    });

    it('catches missing inputs', () => {
      const schema = defineInputs(sampleInputs);
      const errors = validateInputs(schema, {});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('Missing'))).toBe(true);
    });

    it('catches integer out of range', () => {
      const schema = defineInputs(sampleInputs);
      const values = { ...getDefaultValues(schema), length: 1000 };
      const errors = validateInputs(schema, values);
      expect(errors.some(e => e.includes('maximum'))).toBe(true);
    });

    it('catches invalid dropdown value', () => {
      const schema = defineInputs(sampleInputs);
      const values = { ...getDefaultValues(schema), maType: 'INVALID' };
      const errors = validateInputs(schema, values);
      expect(errors.some(e => e.includes('invalid option'))).toBe(true);
    });

    it('catches non-integer for integer type', () => {
      const schema = defineInputs(sampleInputs);
      const values = { ...getDefaultValues(schema), length: 3.5 };
      const errors = validateInputs(schema, values);
      expect(errors.some(e => e.includes('expected integer'))).toBe(true);
    });

    it('catches invalid line style', () => {
      const schema = defineInputs(sampleInputs);
      const values = { ...getDefaultValues(schema), lineStyle: 'wavy' };
      const errors = validateInputs(schema, values);
      expect(errors.some(e => e.includes('expected line style'))).toBe(true);
    });
  });
});
