/**
 * Priisma Indicator Bridge — Demo
 *
 * Shows the LVN Zones engine with FIXED zones.
 * Zones never move, never change. Only price moves through them.
 *
 * Run with: npx tsx demo.ts
 */

import { createManualZonesEngine } from './src/indicators/manual-zones.js';
import { NQ_ZONES_RAW } from './src/indicators/zone-data/nq-zones.js';

// Create the engine with all NQ zones (these are FIXED — never change)
const engine = createManualZonesEngine(NQ_ZONES_RAW);

console.log(`\n📐 Loaded ${engine.zoneCount} FIXED zones for NQ`);
console.log(`   Range: ${engine.getZones()[0].upper} → ${engine.getZones()[engine.zoneCount - 1].lower}`);
console.log(`   These zones NEVER move.\n`);

// Show what the companion display looks like at different prices
const testPrices = [30500, 30000, 29900, 29500, 29000];

for (const price of testPrices) {
  console.log('─'.repeat(40));
  console.log(engine.display(price, { symbol: 'NQ' }));
  console.log('');
}

// Show that zones never change regardless of price
console.log('═══ PROOF: ZONES ARE FIXED ═══\n');
const z1 = engine.getZones();
engine.analyze(25000);
const z2 = engine.getZones();
engine.analyze(35000);
const z3 = engine.getZones();
console.log(`Zones at price 25000: ${z2.length} zones, first=${z2[0].upper}-${z2[0].lower}`);
console.log(`Zones at price 35000: ${z3.length} zones, first=${z3[0].upper}-${z3[0].lower}`);
console.log(`Same? ${JSON.stringify(z1) === JSON.stringify(z2) && JSON.stringify(z2) === JSON.stringify(z3)}`);
console.log('\nZones are permanent. Price moves. Zones don\'t.\n');
