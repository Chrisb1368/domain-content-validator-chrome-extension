#!/usr/bin/env node
/**
 * Pre-flight checks for the Domain-Content Validator extension package.
 *
 * Run locally before opening a pull request:
 *   node .github/scripts/validate.mjs
 *
 * Exits non-zero if the extension would fail to load or would be rejected at
 * upload time for a structural reason. It does not lint style or test behavior.
 */

import { readFileSync, existsSync } from 'node:fs';

/**
 * Paths the manifest references that are known to be missing and are tracked as
 * work items rather than build breaks. Remove an entry the moment the file
 * lands — the whole point is that this list stays short and visible.
 *
 * assets/logo1.png — shipped in the published 0.0.1 package but not yet copied
 * into this repository. See assets/README.md and the README's known-limitations
 * section. The extension will not load unpacked until it is added.
 */
const PENDING_PATHS = new Set(['assets/logo1.png']);

const problems = [];
const notes = [];
const ok = [];

function check(label, fn) {
  try {
    const detail = fn();
    ok.push(detail ? `${label} — ${detail}` : label);
  } catch (error) {
    problems.push(`${label}: ${error.message}`);
  }
}

// ---------------------------------------------------------------- manifest

let manifest;

check('manifest.json parses', () => {
  manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
  return `${manifest.name} v${manifest.version}`;
});

if (manifest) {
  check('required manifest keys present', () => {
    const missing = ['manifest_version', 'name', 'version'].filter((k) => !(k in manifest));
    if (missing.length) throw new Error(`missing ${missing.join(', ')}`);
  });

  check('manifest_version is 3', () => {
    if (manifest.manifest_version !== 3) throw new Error(`found ${manifest.manifest_version}`);
  });

  check('version is a valid store version string', () => {
    if (!/^\d+(\.\d+){0,3}$/.test(String(manifest.version))) {
      throw new Error(`"${manifest.version}" must be 1-4 dot-separated integers`);
    }
    return manifest.version;
  });

  check('every path referenced by the manifest exists', () => {
    const paths = [];
    const push = (p) => { if (typeof p === 'string') paths.push(p.replace(/^\.\//, '')); };

    push(manifest.background?.service_worker);
    push(manifest.action?.default_popup);
    Object.values(manifest.icons ?? {}).forEach(push);
    Object.values(manifest.action?.default_icon ?? {}).forEach(push);
    (manifest.content_scripts ?? []).forEach((cs) => {
      (cs.js ?? []).forEach(push);
      (cs.css ?? []).forEach(push);
    });
    (manifest.web_accessible_resources ?? []).forEach((w) => (w.resources ?? []).forEach(push));

    const unique = [...new Set(paths)];
    const missing = unique.filter((p) => !existsSync(p));
    const pending = missing.filter((p) => PENDING_PATHS.has(p));
    const broken = missing.filter((p) => !PENDING_PATHS.has(p));

    for (const p of pending) {
      notes.push(`${p} is referenced by the manifest but not in the repository (known pending asset — the extension will not load unpacked until it is added)`);
    }
    if (broken.length) throw new Error(`referenced but missing: ${broken.join(', ')}`);
    return `${unique.length} paths, ${pending.length} pending`;
  });

  // Advisory only — these are known issues tracked in the README, not failures.
  if (manifest.background && 'matches' in manifest.background) {
    notes.push('background.matches is not a valid Manifest V3 key and is ignored by Chrome');
  }
  const matches = (manifest.content_scripts ?? []).flatMap((cs) => cs.matches ?? []);
  if (matches.includes('<all_urls>')) {
    notes.push('content_scripts matches <all_urls>; detection only runs on mail.google.com, so this is broader than needed');
  }
}

// ------------------------------------------------------------------ policy

check('no network calls in extension logic', () => {
  const sources = ['background.js', 'content.js', 'popup/script.js'].filter(existsSync);
  const banned = /\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|importScripts)\s*\(/;
  const offenders = sources.filter((f) => banned.test(readFileSync(f, 'utf8')));
  if (offenders.length) {
    throw new Error(`network API used in ${offenders.join(', ')} — see PRIVACY.md`);
  }
  return `${sources.length} files clean`;
});

check('no durable storage of message data', () => {
  const sources = ['background.js', 'content.js', 'popup/script.js'].filter(existsSync);
  const offenders = sources.filter((f) => /chrome\.storage\.(local|sync)\b/.test(readFileSync(f, 'utf8')));
  if (offenders.length) {
    throw new Error(`chrome.storage.local/sync used in ${offenders.join(', ')} — session storage only, see PRIVACY.md`);
  }
});

// ------------------------------------------------------------------ report

for (const line of ok) console.log(`  ok    ${line}`);
for (const line of notes) console.log(`  note  ${line}`);
for (const line of problems) console.error(`  FAIL  ${line}`);

if (problems.length) {
  console.error(`\n${problems.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${ok.length} checks passed${notes.length ? `, ${notes.length} advisory note(s)` : ''}.`);
