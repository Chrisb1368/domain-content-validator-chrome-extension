/**
 * Domain-Content Validator — popup.
 *
 * Displays the verdict for the message currently in view and exposes settings.
 * It never analyzes anything itself; the service worker is the source of truth.
 */

const STATUS_TEXT = {
  safe: 'No problems detected',
  caution: 'Inconsistencies detected',
  danger: 'Likely phishing attempt'
};

const els = {
  verdict: document.getElementById('verdict'),
  status: document.getElementById('status'),
  reasons: document.getElementById('reasons'),
  enabled: document.getElementById('enabled'),
  sensitivity: document.getElementById('sensitivity')
};

function renderVerdict(verdict) {
  els.reasons.replaceChildren();
  if (!verdict) {
    els.verdict.dataset.risk = 'safe';
    els.status.textContent = 'No message analyzed yet';
    return;
  }
  els.verdict.dataset.risk = verdict.risk;
  els.status.textContent = STATUS_TEXT[verdict.risk] || STATUS_TEXT.safe;
  (verdict.reasons || []).forEach((reason) => {
    const li = document.createElement('li');
    li.textContent = reason;
    els.reasons.appendChild(li);
  });
}

function renderSettings(settings) {
  els.enabled.checked = Boolean(settings.enabled);
  els.sensitivity.value = settings.sensitivity || 'balanced';
}

async function save(key, value) {
  const response = await chrome.runtime.sendMessage({ type: 'SET_SETTING', payload: { key, value } });
  if (response?.settings) renderSettings(response.settings);
}

els.enabled.addEventListener('change', (e) => save('enabled', e.target.checked));
els.sensitivity.addEventListener('change', (e) => save('sensitivity', e.target.value));

(async () => {
  const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
  if (state?.settings) renderSettings(state.settings);
  renderVerdict(state?.latest);
})();
