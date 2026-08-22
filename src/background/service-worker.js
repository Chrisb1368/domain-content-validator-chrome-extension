/**
 * Domain-Content Validator — background service worker (Manifest V3).
 *
 * Owns coordination and state. Receives extracted messages from content
 * scripts, runs them through the analyzer, caches verdicts by fingerprint,
 * drives the toolbar badge, and answers the popup.
 *
 * No message content is ever persisted: chrome.storage holds user settings
 * and verdict fingerprints only.
 */

import { analyzeMessage, fingerprint, RISK } from '../lib/analyzer.js';

const MESSAGE = Object.freeze({
  ANALYZE: 'ANALYZE_MESSAGE',
  VERDICT: 'VERDICT',
  GET_STATE: 'GET_STATE',
  SET_SETTING: 'SET_SETTING',
  DISMISS: 'DISMISS_ALERT'
});

const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  sensitivity: 'balanced', // 'relaxed' | 'balanced' | 'strict'
  showSafeBadge: false
});

const BADGE = Object.freeze({
  [RISK.SAFE]: { text: '', color: '#1E8E3E' },
  [RISK.CAUTION]: { text: '!', color: '#F9AB00' },
  [RISK.DANGER]: { text: '!', color: '#D93025' }
});

/** In-memory verdict cache, keyed by fingerprint. Cleared when the worker sleeps. */
const verdicts = new Map();
const CACHE_LIMIT = 200;

async function getSettings() {
  const stored = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...(stored.settings || {}) };
}

async function setSetting(key, value) {
  const settings = await getSettings();
  if (!(key in DEFAULT_SETTINGS)) return settings;
  const next = { ...settings, [key]: value };
  await chrome.storage.local.set({ settings: next });
  return next;
}

function remember(key, verdict) {
  if (verdicts.size >= CACHE_LIMIT) verdicts.delete(verdicts.keys().next().value);
  verdicts.set(key, verdict);
}

async function updateBadge(tabId, risk, settings) {
  const badge = BADGE[risk] || BADGE[RISK.SAFE];
  const text = risk === RISK.SAFE && !settings.showSafeBadge ? '' : badge.text;
  await chrome.action.setBadgeBackgroundColor({ tabId, color: badge.color });
  await chrome.action.setBadgeText({ tabId, text });
}

async function handleAnalyze(payload, sender) {
  const settings = await getSettings();
  if (!settings.enabled) return { risk: RISK.SAFE, score: 0, reasons: [], disabled: true };

  const key = payload.fingerprint || fingerprint(payload);
  const verdict = verdicts.get(key) || { ...analyzeMessage(payload), fingerprint: key };
  remember(key, verdict);

  if (sender.tab?.id != null) await updateBadge(sender.tab.id, verdict.risk, settings);
  return verdict;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    switch (request?.type) {
      case MESSAGE.ANALYZE:
        sendResponse({ type: MESSAGE.VERDICT, payload: await handleAnalyze(request.payload || {}, sender) });
        break;
      case MESSAGE.GET_STATE:
        sendResponse({
          settings: await getSettings(),
          latest: [...verdicts.values()].slice(-1)[0] || null
        });
        break;
      case MESSAGE.SET_SETTING:
        sendResponse({ settings: await setSetting(request.payload?.key, request.payload?.value) });
        break;
      case MESSAGE.DISMISS:
        if (request.payload?.fingerprint) {
          const existing = verdicts.get(request.payload.fingerprint);
          if (existing) remember(request.payload.fingerprint, { ...existing, dismissed: true });
        }
        sendResponse({ ok: true });
        break;
      default:
        sendResponse({ error: `Unknown message type: ${request?.type}` });
    }
  })();
  return true; // keep the channel open for the async response
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
});
