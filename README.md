# Priisma Indicator Bridge

**Local indicator calculation and visualization bridge for trading platforms.**

## What This Is

A standalone tool that:

1. Gets market data from supported APIs
2. Rebuilds indicator logic locally in TypeScript
3. Calculates levels/zones locally
4. Displays them in a companion overlay/window alongside your execution platform

## What This Is NOT

- Not a broker or execution engine
- Not a Pine Script runtime
- Not a trading bot
- No order placement, modification, or auto-trading
- Read-only market data access only

## Target Platforms

- TopstepX
- Tradovate
- TradeSea
- Any execution platform (overlay is independent)

## Current Status

**Phase 1: Awaiting Manual Zones Pine Script source**

The first milestone is reproducing the Manual Zones indicator locally with full TradingView parity.

## Project Structure

```
src/
  engine/          # Core types, candle utilities
    types.ts       # Candle, Zone, Provider interfaces
    candles.ts     # Candle helper functions
  indicators/      # Indicator engine implementations
    manual-zones.ts
  data/            # Market data providers
    provider.ts    # Provider interface
    mock-provider.ts
  ui/              # Companion UI (Phase 5+)
tests/
  unit/            # Unit tests
  parity/          # TradingView parity comparison tests
  fixtures/        # Historical candle data for testing
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run typecheck

# Build
npm run build
```

## Milestone 1 Criteria

1. Manual Zones Pine Script source provided
2. Ported to TypeScript
3. Fed identical historical candles
4. Local zone output matches TradingView
5. Automated parity tests pass

## Security

- Read-only data access
- No broker credentials committed
- No order placement capability
- Environment variables for any API keys
