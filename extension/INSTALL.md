# Priisma LVN Zones — Chrome Extension Install Guide

## Install Steps (30 seconds)

1. **Open Chrome** and go to: `chrome://extensions/`

2. **Enable Developer Mode** — toggle in the top-right corner

3. **Click "Load unpacked"** — button in the top-left

4. **Select the `extension` folder** from this repository
   - Navigate to where you cloned the repo
   - Select the `extension` folder (NOT the root repo folder)
   - Click "Select Folder"

5. **Done!** You'll see "Priisma LVN Zones" in your extensions list

## Usage

1. Open **TopstepX** in Chrome
2. The extension automatically detects the TradingView chart
3. LVN zones appear as blue horizontal bands on the chart
4. Click the extension icon (puzzle piece → Priisma) to toggle zones on/off

## What You'll See

- Blue horizontal bands at each LVN level
- Bands show the upper price label when wide enough
- Zones are **click-through** — they don't interfere with your trading
- Zones redraw automatically when you scroll/zoom the chart

## Troubleshooting

**Zones don't appear:**
- Make sure you're on TopstepX (topstepx.com or topstep.com)
- Wait a few seconds for the chart to fully load
- Try refreshing the page
- Open DevTools (F12) → Console → look for `[Priisma]` messages

**Zones are misaligned:**
- Zoom in/out on the chart — zones recalibrate on zoom
- The extension reads price labels from the Y axis
- If the chart hasn't fully rendered its axis labels, wait a moment

**Extension not showing:**
- Make sure Developer Mode is ON
- Make sure the extension is enabled (not grayed out)
- Check that you loaded the `extension` folder specifically

## Updating Zones

To update the zone data, edit `content.js` and replace the `NQ_ZONES` array.
Then go to `chrome://extensions/` and click the refresh button on the extension.

## Supported Sites

- topstepx.com
- topstep.com
- tradingview.com (for testing)
