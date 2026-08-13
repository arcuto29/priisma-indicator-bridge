/**
 * Interactive LVN Zone Tester
 *
 * Pass a price as argument to see the nearest zones:
 *   npx tsx test-it.ts 29850
 *   npx tsx test-it.ts 30100.50
 *
 * Or pass no argument to see zones at several common levels.
 */

import { createManualZonesEngine } from './src/indicators/manual-zones.js';
import { NQ_ZONES_RAW } from './src/indicators/zone-data/nq-zones.js';

const engine = createManualZonesEngine(NQ_ZONES_RAW);

const priceArg = process.argv[2];

if (priceArg) {
  const price = parseFloat(priceArg);
  if (isNaN(price)) {
    console.error(`Invalid price: "${priceArg}". Use a number like: npx tsx test-it.ts 29850`);
    process.exit(1);
  }

  console.log('');
  console.log(engine.display(price, { symbol: 'NQ' }));

  // Also show raw zone data for the nearest ones
  const result = engine.analyze(price);
  console.log('');
  if (result.containingZone) {
    console.log(`⚡ Price ${price} is INSIDE LVN zone ${result.containingZone.upper}–${result.containingZone.lower}`);
    console.log(`   Width: ${result.containingZone.width.toFixed(2)} pts`);
    console.log(`   Midpoint: ${result.containingZone.midpoint.toFixed(2)}`);
  } else {
    // Distance to nearest zone in either direction
    const aboveDist = result.nearestAbove.length > 0
      ? (result.nearestAbove[0].lower - price).toFixed(2)
      : 'none';
    const belowDist = result.nearestBelow.length > 0
      ? (price - result.nearestBelow[0].upper).toFixed(2)
      : 'none';
    console.log(`📍 Price ${price} is between zones`);
    console.log(`   Distance to next LVN above: ${aboveDist} pts`);
    console.log(`   Distance to next LVN below: ${belowDist} pts`);
  }
} else {
  console.log(`\n📐 ${engine.zoneCount} NQ LVN zones loaded`);
  console.log(`\nUsage: npx tsx test-it.ts <price>`);
  console.log(`\nExamples:`);
  console.log(`  npx tsx test-it.ts 29850`);
  console.log(`  npx tsx test-it.ts 30100`);
  console.log(`  npx tsx test-it.ts 29500`);
  console.log(`  npx tsx test-it.ts 28750\n`);
}
