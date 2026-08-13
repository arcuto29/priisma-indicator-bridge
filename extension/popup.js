/**
 * Priisma LVN Zones — Popup Script
 */

const toggle = document.getElementById('toggle');
const statusEl = document.getElementById('status');
const zoneCountEl = document.getElementById('zone-count');

let isEnabled = true;

// Get current state from content script
function updateStatus() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    chrome.tabs.sendMessage(tabs[0].id, { action: 'getStatus' }, (response) => {
      if (chrome.runtime.lastError) {
        statusEl.textContent = 'Not on TopstepX';
        statusEl.className = 'status disconnected';
        return;
      }

      if (response) {
        isEnabled = response.enabled;
        toggle.className = `toggle ${isEnabled ? 'active' : ''}`;
        zoneCountEl.textContent = response.zones || '148';
        statusEl.textContent = 'Connected — Zones active';
        statusEl.className = 'status connected';
      }
    });
  });
}

// Toggle zones on/off
toggle.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle' }, (response) => {
      if (response) {
        isEnabled = response.enabled;
        toggle.className = `toggle ${isEnabled ? 'active' : ''}`;
        statusEl.textContent = isEnabled ? 'Connected — Zones active' : 'Zones hidden';
        statusEl.className = `status ${isEnabled ? 'connected' : 'disconnected'}`;

        // Save preference
        chrome.storage.local.set({ priismaEnabled: isEnabled });
      }
    });
  });
});

// Initial load
updateStatus();
