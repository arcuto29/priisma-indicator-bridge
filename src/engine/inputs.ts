/**
 * Indicator Input/Settings Type System
 *
 * Supports TradingView-style indicator inputs:
 * integer, float, boolean, string, dropdown, color,
 * timeframe, symbol, source, line style, visibility
 */

import type { Color, LineStyle } from './output.js';
import type { Timeframe } from './types.js';

// ─── Input Types ─────────────────────────────────────────────────────────────

export type SourceField = 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4' | 'hlcc4' | 'volume';

export interface InputBase {
  /** Internal key name */
  key: string;
  /** Display label */
  label: string;
  /** Tooltip / description */
  tooltip?: string;
  /** Group name for organizing in settings panel */
  group?: string;
  /** Whether this input is visible in the settings UI */
  visible?: boolean;
}

export interface IntegerInput extends InputBase {
  type: 'integer';
  defaultValue: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
}

export interface FloatInput extends InputBase {
  type: 'float';
  defaultValue: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
}

export interface BooleanInput extends InputBase {
  type: 'boolean';
  defaultValue: boolean;
}

export interface StringInput extends InputBase {
  type: 'string';
  defaultValue: string;
  /** If set, show as a multiline text area */
  multiline?: boolean;
}

export interface DropdownInput extends InputBase {
  type: 'dropdown';
  defaultValue: string;
  options: Array<{ label: string; value: string }>;
}

export interface ColorInput extends InputBase {
  type: 'color';
  defaultValue: Color;
}

export interface TimeframeInput extends InputBase {
  type: 'timeframe';
  defaultValue: Timeframe | '';
}

export interface SymbolInput extends InputBase {
  type: 'symbol';
  defaultValue: string;
}

export interface SourceInput extends InputBase {
  type: 'source';
  defaultValue: SourceField;
}

export interface LineStyleInput extends InputBase {
  type: 'line_style';
  defaultValue: LineStyle;
}

/**
 * Union of all supported input types
 */
export type IndicatorInput =
  | IntegerInput
  | FloatInput
  | BooleanInput
  | StringInput
  | DropdownInput
  | ColorInput
  | TimeframeInput
  | SymbolInput
  | SourceInput
  | LineStyleInput;

/**
 * Resolved input values (runtime values after user configuration)
 */
export type InputValues = Record<string, unknown>;

/**
 * Extract the value type from an input definition
 */
export type InputValueType<T extends IndicatorInput> =
  T extends IntegerInput ? number :
  T extends FloatInput ? number :
  T extends BooleanInput ? boolean :
  T extends StringInput ? string :
  T extends DropdownInput ? string :
  T extends ColorInput ? Color :
  T extends TimeframeInput ? Timeframe | '' :
  T extends SymbolInput ? string :
  T extends SourceInput ? SourceField :
  T extends LineStyleInput ? LineStyle :
  never;

// ─── Input Schema ────────────────────────────────────────────────────────────

/**
 * Complete input schema for an indicator.
 * Defines all configurable settings.
 */
export interface InputSchema {
  /** Ordered list of inputs */
  inputs: IndicatorInput[];
}

/**
 * Helper to create an input schema
 */
export function defineInputs(inputs: IndicatorInput[]): InputSchema {
  return { inputs };
}

/**
 * Get default values from an input schema
 */
export function getDefaultValues(schema: InputSchema): InputValues {
  const values: InputValues = {};
  for (const input of schema.inputs) {
    values[input.key] = input.defaultValue;
  }
  return values;
}

/**
 * Validate input values against schema.
 * Returns array of validation error messages (empty if valid).
 */
export function validateInputs(schema: InputSchema, values: InputValues): string[] {
  const errors: string[] = [];

  for (const input of schema.inputs) {
    const value = values[input.key];

    if (value === undefined) {
      errors.push(`Missing required input: ${input.key}`);
      continue;
    }

    switch (input.type) {
      case 'integer':
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          errors.push(`${input.key}: expected integer`);
        } else {
          if (input.minValue !== undefined && value < input.minValue) {
            errors.push(`${input.key}: minimum is ${input.minValue}`);
          }
          if (input.maxValue !== undefined && value > input.maxValue) {
            errors.push(`${input.key}: maximum is ${input.maxValue}`);
          }
        }
        break;
      case 'float':
        if (typeof value !== 'number') {
          errors.push(`${input.key}: expected number`);
        } else {
          if (input.minValue !== undefined && value < input.minValue) {
            errors.push(`${input.key}: minimum is ${input.minValue}`);
          }
          if (input.maxValue !== undefined && value > input.maxValue) {
            errors.push(`${input.key}: maximum is ${input.maxValue}`);
          }
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${input.key}: expected boolean`);
        }
        break;
      case 'string':
      case 'symbol':
        if (typeof value !== 'string') {
          errors.push(`${input.key}: expected string`);
        }
        break;
      case 'dropdown':
        if (typeof value !== 'string') {
          errors.push(`${input.key}: expected string`);
        } else if (!input.options.some((opt) => opt.value === value)) {
          errors.push(`${input.key}: invalid option "${value}"`);
        }
        break;
      case 'color':
        if (typeof value !== 'object' || value === null) {
          errors.push(`${input.key}: expected color object`);
        }
        break;
      case 'timeframe':
        // Allow empty string (current timeframe)
        if (typeof value !== 'string') {
          errors.push(`${input.key}: expected timeframe string`);
        }
        break;
      case 'source':
        if (typeof value !== 'string') {
          errors.push(`${input.key}: expected source field`);
        }
        break;
      case 'line_style':
        if (!['solid', 'dashed', 'dotted'].includes(value as string)) {
          errors.push(`${input.key}: expected line style`);
        }
        break;
    }
  }

  return errors;
}
