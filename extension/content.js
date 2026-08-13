/**
 * Priisma LVN Zones — Chrome Extension Content Script v2
 *
 * Shows a floating panel with NQ LVN zones on the page.
 * Works on TopstepX, TradingView, or any page.
 *
 * The panel shows all zones and highlights which ones are near the current price.
 * You set the current price by clicking on a zone or typing it in the input.
 */

// Only run in top frame (not iframes)
if (window.self !== window.top) {
  // We're in an iframe — skip
  // (We'll handle this from the top frame only)
} else {
  console.log('[Priisma] Starting in top frame:', window.location.href);
  initPriisma();
}

function initPriisma() {

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
// CREATE THE FLOATING PANEL
// ═══════════════════════════════════════════════════════════════════════════════

let currentPrice = null;
let panelVisible = true;

const panel = document.createElement('div');
panel.id = 'priisma-panel';
panel.innerHTML = `
  <div id="priisma-header">
    <span id="priisma-title">NQ LVN</span>
    <span id="priisma-minimize">—</span>
  </div>
  <div id="priisma-body">
    <div id="priisma-price-input-row">
      <input type="text" id="priisma-price-input" placeholder="Enter NQ price..." />
      <button id="priisma-go">Go</button>
    </div>
    <div id="priisma-status"></div>
    <div id="priisma-zones-list"></div>
  </div>
`;
document.body.appendChild(panel);

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

const priceInput = document.getElementById('priisma-price-input');
const goBtn = document.getElementById('priisma-go');
const statusEl = document.getElementById('priisma-status');
const zonesListEl = document.getElementById('priisma-zones-list');
const minimizeBtn = document.getElementById('priisma-minimize');
const bodyEl = document.getElementById('priisma-body');

function updateDisplay(price) {
  currentPrice = price;
  if (!price) {
    statusEl.textContent = 'Enter current NQ price above';
    zonesListEl.innerHTML = '';
    return;
  }

  // Find nearest zones above and below
  const above = [];
  const below = [];
  let inside = null;

  for (const [upper, lower] of NQ_ZONES) {
    if (price >= lower && price <= upper) {
      inside = [upper, lower];
    } else if (lower > price) {
      above.push([upper, lower]);
    } else {
      below.push([upper, lower]);
    }
  }

  // Sort: above by distance ascending (nearest first), below by distance ascending
  above.sort((a, b) => a[1] - b[1]); // lowest 'lower' = nearest above
  below.sort((a, b) => b[0] - a[0]); // highest 'upper' = nearest below

  const nearest3Above = above.slice(0, 3);
  const nearest3Below = below.slice(0, 3);

  // Build display
  let html = '';

  if (inside) {
    html += `<div class="priisma-zone-row priisma-active">▶ IN ZONE: ${inside[0].toFixed(2)} – ${inside[1].toFixed(2)}</div>`;
  }

  html += '<div class="priisma-section-label">▲ ABOVE</div>';
  for (const [upper, lower] of nearest3Above) {
    const dist = (lower - price).toFixed(1);
    html += `<div class="priisma-zone-row priisma-resistance">${upper.toFixed(2)} – ${lower.toFixed(2)} <span class="priisma-dist">+${dist}</span></div>`;
  }

  html += '<div class="priisma-section-label">▼ BELOW</div>';
  for (const [upper, lower] of nearest3Below) {
    const dist = (price - upper).toFixed(1);
    html += `<div class="priisma-zone-row priisma-support">${upper.toFixed(2)} – ${lower.toFixed(2)} <span class="priisma-dist">-${dist}</span></div>`;
  }

  statusEl.textContent = `Price: ${price.toFixed(2)} | ${NQ_ZONES.length} zones`;
  zonesListEl.innerHTML = html;
}

function handlePriceInput() {
  const val = parseFloat(priceInput.value.trim());
  if (!isNaN(val) && val > 1000) {
    updateDisplay(val);
    // Save last price
    if (chrome.storage) {
      chrome.storage.local.set({ priismaLastPrice: val });
    }
  }
}

goBtn.addEventListener('click', handlePriceInput);
priceInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handlePriceInput();
});

minimizeBtn.addEventListener('click', () => {
  panelVisible = !panelVisible;
  bodyEl.style.display = panelVisible ? 'block' : 'none';
  minimizeBtn.textContent = panelVisible ? '—' : '+';
});

// Make panel draggable
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

const header = document.getElementById('priisma-header');
header.addEventListener('mousedown', (e) => {
  if (e.target === minimizeBtn) return;
  isDragging = true;
  dragOffsetX = e.clientX - panel.offsetLeft;
  dragOffsetY = e.clientY - panel.offsetTop;
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  panel.style.left = (e.clientX - dragOffsetX) + 'px';
  panel.style.top = (e.clientY - dragOffsetY) + 'px';
  panel.style.right = 'auto';
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

// Load last saved price
if (chrome.storage) {
  chrome.storage.local.get(['priismaLastPrice'], (result) => {
    if (result.priismaLastPrice) {
      priceInput.value = result.priismaLastPrice;
      updateDisplay(result.priismaLastPrice);
    }
  });
}

// Try to auto-detect price from page every 3 seconds
setInterval(() => {
  // Look for NQ prices in the page text
  const bodyText = document.body.innerText || '';
  const matches = bodyText.match(/\b(2[0-9]\d{3}|3[0-4]\d{3})(\.\d{1,2})?\b/g);
  if (matches && matches.length > 0) {
    // Filter to reasonable NQ prices
    for (const m of matches) {
      const p = parseFloat(m);
      if (p >= 20000 && p <= 35000) {
        if (!currentPrice || Math.abs(p - currentPrice) > 50) {
          // Only auto-update if significantly different or no price set
          if (!currentPrice) {
            priceInput.value = p.toFixed(2);
            updateDisplay(p);
            console.log(`[Priisma] Auto-detected price: ${p}`);
          }
        }
        break;
      }
    }
  }
}, 3000);

console.log(`[Priisma] Panel ready — ${NQ_ZONES.length} NQ LVN zones loaded`);
console.log('[Priisma] Enter the current NQ price in the panel to see nearest zones');

} // end initPriisma
