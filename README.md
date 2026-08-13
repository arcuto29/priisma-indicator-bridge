# Priisma Indicator Bridge

**Your indicators follow you to your execution platform.**

A universal indicator bridge that lets traders use custom indicator logic across trading platforms that do not natively support TradingView Pine Script.

## Product Vision

Bring your indicator once → use it across supported trading platforms.

```
Indicator Definition
  → Priisma Indicator Engine
    → Normalized Market Data
      → Calculated Indicator Output
        → Platform-Agnostic Visual Layer
          → Supported Trading Platform
```

## Target Platforms

- TopstepX
- Tradovate
- TradeSea
- NinjaTrader web
- Other browser-based trading platforms

## Indicator Support Levels

| Level | Source | Status |
|-------|--------|--------|
| **Level 1** | Pine Script (source available) | Analyzer + manual port |
| **Level 2** | Native Priisma SDK indicators | Full `defineIndicator()` SDK |
| **Level 3** | Protected/invite-only indicators | Only if author provides source or Priisma module |

## What This Is NOT

- Not a Pine Script runtime hack
- Not a broker or execution engine
- Not an auto-trading system
- Does not bypass TradingView protections
- Does not extract hidden indicator source
- **Read-only** — no order placement

## Current Status

**Phase 1: Awaiting Manual Zones Pine Script source**

Architecture is built and proven with 64 passing tests.

## Project Structure

```
src/
  engine/              # Core types, candle utils, output model, input system
    types.ts           # Candle, Timeframe, MarketDataProvider
    candles.ts         # Candle helper functions
    output.ts          # Universal output model (Zone, Series, Label, etc.)
    inputs.ts          # Input/settings type system
  sdk/                 # Priisma Indicator SDK
    define-indicator.ts  # defineIndicator() API
    runtime.ts         # Indicator execution runtime
  indicators/          # Indicator implementations
    manual-zones.ts    # First indicator (stub, awaiting Pine)
  pine-compat/         # Pine Script compatibility layer
    supported-features.ts  # Feature manifest (100+ features tracked)
    analyzer.ts        # Static compatibility analyzer
  platforms/           # Platform adapters
    adapter.ts         # Platform adapter interface
    topstepx/          # TopstepX adapter
    tradovate/         # Tradovate adapter
    tradesea/          # TradeSea adapter
  data/                # Market data providers
    provider.ts        # Provider interface
    mock-provider.ts   # Testing provider
  parity/              # Parity testing framework
    runner.ts          # Compare local output vs TradingView reference
  visualization/       # UI layer (Phase 5+)
tests/
  unit/                # 59 unit tests
  parity/             # 5 parity framework tests
  fixtures/           # Historical candle data
```

## Development

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run parity tests only
npm run test:parity

# Type check
npm run typecheck

# Build
npm run build
```

## Architecture Highlights

### Indicator SDK

```ts
const myIndicator = defineIndicator({
  name: "EMA Crossover",
  overlay: true,
  inputs: [
    { key: 'fast', label: 'Fast', type: 'integer', defaultValue: 9 },
    { key: 'slow', label: 'Slow', type: 'integer', defaultValue: 21 },
  ],
  calculate(ctx) {
    const fast = ctx.ta.ema(ctx.closeSeries, ctx.inputs.fast as number);
    const slow = ctx.ta.ema(ctx.closeSeries, ctx.inputs.slow as number);
    ctx.plot('fast', fast, { color: { r: 0, g: 150, b: 136, a: 1 } });
    ctx.plot('slow', slow, { color: { r: 244, g: 67, b: 54, a: 1 } });
    if (ctx.ta.crossover(ctx.closeSeries, ctx.closeSeries)) {
      ctx.signal('long', { message: 'EMA Cross Up' });
    }
  },
});
```

### Pine Compatibility Analysis

```ts
const report = analyzePineScript(pineSource);
// { overallPercent: 96, supported: 12, partial: 1, unsupported: 0, ... }
```

### Parity Testing

```ts
const result = runParityTest({
  indicator: manualZonesDefinition,
  candles: historicalData,
  symbol: 'NQ',
  timeframe: '5m',
  reference: { zones: tradingViewZones },
});
// { passed: true, matchPercent: 99.2, categories: [...] }
```

## Pine Feature Support

Currently tracking 100+ Pine features across categories:

- ✓ Core language (var, if/else, for, functions)
- ✓ Inputs (int, float, bool, string, color, timeframe, source)
- ✓ Plots (plot, plotshape, bgcolor, hline)
- ✓ TA functions (sma, ema, rsi, atr, highest, lowest, crossover, vwap)
- ✓ Math functions (full coverage)
- ✓ Arrays (new, push, pop, get, set, sort, etc.)
- ✓ Drawing objects (line, label, box)
- ~ Partial: request.security (simple MTF), fill, table
- ✗ Unsupported: strategy, matrix, import/export

## Milestone 1 Criteria

1. ~~Architecture designed~~ ✓
2. ~~SDK runtime working~~ ✓
3. ~~Pine analyzer working~~ ✓
4. ~~Parity framework working~~ ✓
5. Manual Zones Pine source provided (WAITING)
6. Ported to TypeScript
7. Fed identical historical candles
8. Local zone output matches TradingView
9. Automated parity tests pass

## Security

- Read-only data access only
- No broker credentials committed
- No order placement capability
- Environment variables for any API keys
- Indicator sandbox (one broken indicator cannot crash the app)
