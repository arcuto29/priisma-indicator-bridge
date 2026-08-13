/**
 * Priisma Indicator Bridge — Demo
 *
 * Demonstrates the Manual Zones engine working with the NQ zone data.
 * Run with: npx tsx demo.ts
 */

import { createManualZonesEngine } from './src/indicators/manual-zones.js';
import { NQ_ZONES_RAW } from './src/indicators/zone-data/nq-zones.js';

// Create the engine with all NQ zones
const engine = createManualZonesEngine(NQ_ZONES_RAW);

console.log(`\nLoaded ${engine.zoneCount} zones for NQ\n`);

// Simulate different price levels to show zone classification
const testPrices = [30500, 30000, 29900, 29500, 29000, 28500];

for (const price of testPrices) {
  console.log('─'.repeat(50));
  console.log(engine.display(price, { symbol: 'NQ' }));
  console.log('');
}

// Demonstrate proximity analysis at a specific price
console.log('\n═══ DETAILED PROXIMITY ANALYSIS ═══\n');
const price = 29895.00; // Inside a zone
const result = engine.analyze(price, 5);

if (result.activeZone) {
  console.log(`⚡ PRICE IS INSIDE A ZONE!`);
  console.log(`   Zone: ${result.activeZone.upper} – ${result.activeZone.lower}`);
  console.log(`   Midpoint: ${result.activeZone.midpoint}`);
  console.log(`   Width: ${result.activeZone.width.toFixed(2)} points`);
  console.log('');
}

console.log(`📈 Next ${result.nearestResistance.length} Resistance Zones:`);
for (const z of result.nearestResistance) {
  console.log(`   ${z.upper.toFixed(2)} – ${z.lower.toFixed(2)} (${(z.lower - price).toFixed(2)} pts away)`);
}

console.log(`\n📉 Next ${result.nearestSupport.length} Support Zones:`);
for (const z of result.nearestSupport) {
  console.log(`   ${z.upper.toFixed(2)} – ${z.lower.toFixed(2)} (${(price - z.upper).toFixed(2)} pts away)`);
}

console.log(`\n📊 Summary:`);
console.log(`   Total zones: ${result.zones.length}`);
console.log(`   Resistance above: ${result.zones.filter(z => z.type === 'resistance').length}`);
console.log(`   Support below: ${result.zones.filter(z => z.type === 'support').length}`);
console.log(`   Active (price inside): ${result.activeZone ? 1 : 0}`);
