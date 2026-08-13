/**
 * Priisma LVN Zones — Chrome Extension Content Script
 *
 * Draws fixed LVN zones directly on the TradingView chart embedded in TopstepX.
 *
 * How it works:
 * 1. Finds the TradingView chart container on the page
 * 2. Reads the price scale (Y axis) to map prices → pixel positions
 * 3. Creates a transparent overlay div on top of the chart
 * 4. Draws each LVN zone as a horizontal band at the correct pixel position
 * 5. Redraws whenever the chart scrolls/zooms/resizes
 */

// ═══════════════════════════════════════════════════════════════════════════════
// LVN ZONE DATA — 148 fixed zones for NQ
// ═══════════════════════════════════════════════════════════════════════════════

const NQ_ZONES = [
  [30693.75, 30688.75],
  [30666.25, 30662.50],
  [30646.50, 30641.00],
  [30625.25, 30621.75],
  [30601.25, 30598.00],
  [30579.75, 30576.75],
  [30553.00, 30549.00],
  [30531.00, 30525.75],
  [30508.00, 30504.50],
  [30483.75, 30478.25],
  [30459.75, 30455.25],
  [30432.00, 30426.50],
  [30405.00, 30400.25],
  [30387.50, 30384.00],
  [30360.75, 30356.00],
  [30339.25, 30334.00],
  [30311.25, 30307.25],
  [30293.00, 30288.50],
  [30267.00, 30263.00],
  [30251.25, 30248.75],
  [30235.25, 30231.75],
  [30218.75, 30214.75],
  [30199.25, 30194.50],
  [30166.00, 30160.75],
  [30142.75, 30136.75],
  [30113.50, 30108.00],
  [30087.50, 30082.25],
  [30058.00, 30053.25],
  [30024.50, 30020.00],
  [30003.25, 29996.75],
  [29974.75, 29969.75],
  [29942.75, 29938.00],
  [29920.25, 29915.25],
  [29898.00, 29893.50],
  [29877.00, 29872.00],
  [29851.50, 29845.50],
  [29824.25, 29820.00],
  [29806.00, 29801.25],
  [29782.75, 29778.00],
  [29754.50, 29750.00],
  [29725.00, 29720.50],
  [29704.25, 29700.00],
  [29671.25, 29665.75],
  [29650.00, 29645.50],
  [29628.75, 29624.00],
  [29597.25, 29592.50],
  [29581.00, 29576.50],
  [29558.00, 29552.25],
  [29529.50, 29524.25],
  [29504.50, 29499.50],
  [29471.25, 29466.75],
  [29445.00, 29439.50],
  [29417.25, 29412.25],
  [29388.75, 29383.00],
  [29363.00, 29359.00],
  [29342.25, 29338.00],
  [29320.00, 29315.75],
  [29301.00, 29296.25],
  [29269.75, 29265.00],
  [29247.75, 29242.50],
  [29225.25, 29220.75],
  [29208.75, 29203.75],
  [29188.50, 29182.50],
  [29162.75, 29157.75],
  [29141.25, 29136.50],
  [29121.00, 29116.25],
  [29095.75, 29090.00],
  [29057.50, 29052.00],
  [29039.00, 29034.25],
  [29012.50, 29007.00],
  [28984.75, 28979.25],
  [28957.25, 28952.75],
  [28931.25, 28925.50],
  [28900.75, 28895.25],
  [28875.25, 28870.50],
  [28848.25, 28843.50],
  [28827.00, 28822.25],
  [28793.50, 28788.75],
  [28765.75, 28759.75],
  [28737.00, 28731.50],
  [28703.75, 28698.25],
  [28675.75, 28669.50],
  [28647.25, 28641.75],
  [28620.50, 28613.25],
  [28603.75, 28598.00],
  [28580.00, 28575.25],
  [28562.00, 28559.50],
  [28542.25, 28537.25],
  [28518.25, 28513.50],
  [28480.75, 28476.00],
  [28448.75, 28444.50],
  [28429.50, 28425.25],
  [28406.00, 28401.50],
  [28385.75, 28382.75],
  [28371.25, 28368.00],
  [28353.25, 28349.25],
  [28329.75, 28325.50],
  [28304.25, 28298.75],
  [28279.00, 28274.25],
  [28264.50, 28258.50],
  [28242.50, 28238.25],
  [28221.50, 28216.50],
  [28194.75, 28191.25],
  [28177.00, 28173.50],
  [28163.50, 28159.75],
  [28146.25, 28141.25],
  [28121.75, 28117.00],
  [28101.75, 28096.75],
  [28086.00, 28082.25],
  [28061.75, 28056.50],
  [28045.25, 28040.50],
  [28028.00, 28023.25],
  [28000.75, 27995.00],
  [27982.25, 27977.25],
  [27960.75, 27956.25],
  [27937.50, 27932.75],
  [27912.75, 27907.00],
  [27883.75, 27879.00],
  [27865.00, 27860.00],
  [27850.50, 27847.25],
  [27833.75, 27828.50],
  [27803.25, 27798.75],
  [27783.50, 27778.25],
  [27760.75, 27756.25],
  [27741.50, 27737.50],
  [27727.25, 27722.75],
  [27700.50, 27695.25],
  [27677.00, 27671.25],
  [27651.00, 27645.00],
  [27630.50, 27624.75],
  [27606.50, 27599.50],
  [27572.75, 27566.00],
  [27545.75, 27540.25],
  [27521.25, 27516.50],
  [27497.25, 27492.75],
  [27481.25, 27476.50],
  [27460.50, 27455.50],
  [27439.25, 27434.25],
  [27421.75, 27416.25],
  [27397.00, 27390.00],
  [27368.75, 27363.25],
  [27341.50, 27336.00],
  [27317.25, 27311.25],
  [27286.75, 27281.50],
  [27264.50, 27260.25],
  [27240.25, 27236.75],
  [27216.00, 27211.50],
  [27199.75, 27193.25],
];

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

let overlay = null;
let chartContainer = null;
let isEnabled = true;
let retryCount = 0;
const MAX_RETRIES = 60; // Try for 60 seconds

// ═══════════════════════════════════════════════════════════════════════════════
// CHART DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Find the TradingView chart container on the page.
 * TopstepX embeds TradingView in an iframe or directly.
 */
function findChartContainer() {
  // Try common TradingView selectors
  const selectors = [
    '.chart-container',
    '.layout__area--center',
    '[class*="chart-container"]',
    '[class*="chartContainer"]',
    '.tv-chart-container',
    '#tv_chart_container',
    '[data-name="legend"]',
    '.chart-markup-table',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }

  // Try finding the main canvas (TradingView renders to canvas)
  const canvases = document.querySelectorAll('canvas');
  for (const canvas of canvases) {
    if (canvas.width > 400 && canvas.height > 200) {
      return canvas.parentElement;
    }
  }

  return null;
}

/**
 * Find the price scale element to read price range
 */
function findPriceScale() {
  // TradingView price axis selectors
  const selectors = [
    '.price-axis',
    '[class*="priceAxis"]',
    '[class*="price-axis"]',
    '.pane-legend-line',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }

  return null;
}

/**
 * Extract visible price range from the chart's price axis labels.
 * Reads the text content of price labels on the Y axis.
 */
function getPriceRange() {
  // Strategy 1: Find price labels on the axis
  const priceLabels = document.querySelectorAll(
    '[class*="priceAxis"] [class*="label"], ' +
    '[class*="price-axis"] span, ' +
    '.price-axis span'
  );

  if (priceLabels.length >= 2) {
    const prices = [];
    for (const label of priceLabels) {
      const text = label.textContent.trim().replace(/[^0-9.]/g, '');
      const price = parseFloat(text);
      if (!isNaN(price) && price > 1000) {
        prices.push(price);
      }
    }
    if (prices.length >= 2) {
      return {
        high: Math.max(...prices),
        low: Math.min(...prices),
      };
    }
  }

  // Strategy 2: Look for any elements with price-like values near the right edge
  const rightSideElements = document.querySelectorAll(
    '[class*="price"] span, [class*="axis"] span, [class*="scale"] span'
  );

  const prices = [];
  for (const el of rightSideElements) {
    const text = el.textContent.trim().replace(/[^0-9.]/g, '');
    const price = parseFloat(text);
    if (!isNaN(price) && price > 20000 && price < 40000) {
      prices.push(price);
    }
  }

  if (prices.length >= 2) {
    return {
      high: Math.max(...prices),
      low: Math.min(...prices),
    };
  }

  // Strategy 3: Try to read from the crosshair/cursor price display
  const crosshairPrice = document.querySelector(
    '[class*="crosshair"] [class*="price"], [class*="cursor"] [class*="price"]'
  );
  if (crosshairPrice) {
    const price = parseFloat(crosshairPrice.textContent.replace(/[^0-9.]/g, ''));
    if (!isNaN(price) && price > 20000) {
      // Estimate a range around the crosshair price
      return { high: price + 50, low: price - 50 };
    }
  }

  return null;
}

/**
 * Alternative: Extract price range from the chart canvas by reading
 * the price axis rendering. Uses the last known price from the chart header.
 */
function getPriceFromHeader() {
  // TradingView often shows the current price in the chart header
  const headerSelectors = [
    '[class*="headerRow"] [class*="last"]',
    '[class*="header"] [class*="price"]',
    '[class*="legendValue"]',
    '[class*="item-value"]',
    '.tv-symbol-price-quote__value',
  ];

  for (const sel of headerSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.textContent.trim().replace(/[^0-9.]/g, '');
      const price = parseFloat(text);
      if (!isNaN(price) && price > 20000 && price < 40000) {
        return price;
      }
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERLAY DRAWING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create the overlay container
 */
function createOverlay() {
  if (overlay) {
    overlay.remove();
  }

  overlay = document.createElement('div');
  overlay.className = 'priisma-zone-overlay';
  overlay.id = 'priisma-lvn-overlay';

  // Position relative to the chart container
  if (chartContainer) {
    const style = window.getComputedStyle(chartContainer);
    if (style.position === 'static') {
      chartContainer.style.position = 'relative';
    }
    chartContainer.appendChild(overlay);
  }

  return overlay;
}

/**
 * Draw all LVN zones on the overlay
 */
function drawZones() {
  if (!overlay || !chartContainer) return;
  if (!isEnabled) {
    overlay.classList.add('priisma-hidden');
    return;
  }

  overlay.classList.remove('priisma-hidden');

  // Get chart dimensions
  const rect = chartContainer.getBoundingClientRect();
  const chartHeight = rect.height;

  // Get visible price range
  const priceRange = getPriceRange();
  if (!priceRange) {
    // Can't determine price range yet — try using a fallback
    const headerPrice = getPriceFromHeader();
    if (!headerPrice) {
      console.log('[Priisma] Cannot determine price range yet, retrying...');
      return;
    }
    // Use header price with estimated range based on chart height
    // Assume ~100-200 point visible range for NQ on typical chart
    const estimatedRange = 150;
    priceRange = {
      high: headerPrice + estimatedRange / 2,
      low: headerPrice - estimatedRange / 2,
    };
  }

  const { high, low } = priceRange;
  const pricePerPixel = (high - low) / chartHeight;

  // Clear existing zones
  overlay.innerHTML = '';

  // Draw each zone that's in the visible range
  let drawnCount = 0;
  for (const [upper, lower] of NQ_ZONES) {
    // Skip zones outside visible range
    if (lower > high || upper < low) continue;

    // Calculate pixel positions (top of chart = highest price)
    const topPx = Math.max(0, (high - upper) / pricePerPixel);
    const bottomPx = Math.min(chartHeight, (high - lower) / pricePerPixel);
    const heightPx = bottomPx - topPx;

    if (heightPx < 0.5) continue; // Too small to see

    // Create zone element
    const zoneEl = document.createElement('div');
    zoneEl.className = 'priisma-zone';
    zoneEl.style.top = `${topPx}px`;
    zoneEl.style.height = `${Math.max(1, heightPx)}px`;

    const bandEl = document.createElement('div');
    bandEl.className = 'priisma-zone-band';
    zoneEl.appendChild(bandEl);

    // Add label for wider zones
    if (heightPx > 8) {
      const labelEl = document.createElement('div');
      labelEl.className = 'priisma-zone-label';
      labelEl.textContent = `${upper.toFixed(2)}`;
      zoneEl.appendChild(labelEl);
    }

    overlay.appendChild(zoneEl);
    drawnCount++;
  }

  console.log(`[Priisma] Drew ${drawnCount} LVN zones (visible range: ${low.toFixed(2)} – ${high.toFixed(2)})`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION & LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize the extension
 */
function init() {
  chartContainer = findChartContainer();

  if (!chartContainer) {
    retryCount++;
    if (retryCount < MAX_RETRIES) {
      setTimeout(init, 1000);
    } else {
      console.log('[Priisma] Could not find TradingView chart after 60 seconds.');
    }
    return;
  }

  console.log('[Priisma] Chart container found! Initializing LVN zones...');

  createOverlay();
  drawZones();

  // Redraw on resize
  const resizeObserver = new ResizeObserver(() => {
    drawZones();
  });
  resizeObserver.observe(chartContainer);

  // Redraw periodically (catches scroll/zoom that doesn't trigger resize)
  setInterval(drawZones, 2000);

  // Watch for DOM changes (chart re-renders)
  const mutationObserver = new MutationObserver(() => {
    // Debounce
    clearTimeout(mutationObserver._timeout);
    mutationObserver._timeout = setTimeout(drawZones, 500);
  });
  mutationObserver.observe(chartContainer, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  });

  console.log(`[Priisma] LVN Zones active — ${NQ_ZONES.length} zones loaded for NQ`);
}

/**
 * Listen for messages from popup (toggle on/off)
 */
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'toggle') {
      isEnabled = !isEnabled;
      drawZones();
      sendResponse({ enabled: isEnabled });
    } else if (msg.action === 'getStatus') {
      sendResponse({ enabled: isEnabled, zones: NQ_ZONES.length });
    } else if (msg.action === 'redraw') {
      drawZones();
      sendResponse({ ok: true });
    }
  });

  // Load saved state
  chrome.storage.local.get(['priismaEnabled'], (result) => {
    if (result.priismaEnabled === false) {
      isEnabled = false;
    }
    // Start
    init();
  });
} else {
  // Running outside extension context (for testing)
  init();
}
