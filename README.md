# Domain-Content Validator

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-live-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/domain-content-validator/jagbdijnbgbohlggdnacpdlbnmmplkpl)
[![Version](https://img.shields.io/badge/version-0.0.1-blue)](#release-history)
[![Manifest](https://img.shields.io/badge/manifest-v3-success)](#manifest--permissions)
[![Category](https://img.shields.io/badge/category-Privacy%20%26%20Security-8A2BE2)](https://chromewebstore.google.com/category/extensions/privacy)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)

A Chrome extension that flags phishing and fraudulent email by checking whether **who a message claims to be from** actually matches **what the message says**.

> **Install from the Chrome Web Store →** [Domain-Content Validator](https://chromewebstore.google.com/detail/domain-content-validator/jagbdijnbgbohlggdnacpdlbnmmplkpl)

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [How it works](#how-it-works)
- [Installation](#installation)
- [Repository status](#repository-status)
- [Project structure](#project-structure)
- [Development](#development)
- [Manifest & permissions](#manifest--permissions)
- [Architecture](#architecture)
- [Privacy & data handling](#privacy--data-handling)
- [Release & publishing](#release--publishing)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [Release history](#release-history)
- [Support](#support)
- [Maintainers](#maintainers)
- [License](#license)

---

## Overview

Most phishing defenses look at one signal at a time: a bad link, a spoofed display name, a failed SPF record. Domain-Content Validator looks at the **relationship between two signals** — the sending domain and the body of the message — and raises a flag when they disagree.

A message that claims to be a password reset from your bank but arrives from a lookalike or unrelated domain is a mismatch. So is an invoice from a domain that has nothing to do with the vendor named in the body. Those inconsistencies are what the extension surfaces, in real time, as you read your mail.

Analysis happens locally in the browser. Message content is not stored and is not transmitted to any external service.

**At a glance**

| | |
|---|---|
| **Name** | Domain-Content Validator |
| **Extension ID** | `jagbdijnbgbohlggdnacpdlbnmmplkpl` |
| **Current published version** | 0.0.1 |
| **Manifest version** | 3 |
| **Store category** | Privacy & Security |
| **Languages** | English (United States) |
| **Package size** | ~1.48 MiB |
| **Store rating** | 5.0 ★ |
| **Privacy policy** | https://www.timemotionstudy.com/private-policy |

---

## Features

### Domain–body correlation analysis
The core check. The extension extracts the sender's domain and the entities, brands, and claims referenced in the message body, then scores how well the two agree. Low agreement is what drives an alert.

### Real-time alerts
Warnings appear while the message is open, inline and in context — not in a report you read later. Each alert includes a short explanation of *why* the message was flagged, so the warning is actionable rather than just alarming.

### Content authenticity checks
Beyond the domain comparison, the message body is scanned for the patterns that consistently accompany fraudulent mail: urgency and threat language, credential and payment requests, mismatched or obfuscated link targets, and lookalike domain spellings.

### Privacy-preserving by design
All evaluation runs client-side. Nothing about the messages you read is stored externally or shared with third parties.

---

## How it works

```
 Message opens in a supported webmail client
              │
              ▼
 ┌────────────────────────────┐
 │ Content script             │  Reads sender + body from the DOM
 │ (src/content)              │  Never leaves the page
 └────────────┬───────────────┘
              │  structured payload (sender, subject, body, links)
              ▼
 ┌────────────────────────────┐
 │ Service worker             │  Orchestrates analysis, caches verdicts
 │ (src/background)           │
 └────────────┬───────────────┘
              │
              ▼
 ┌────────────────────────────┐
 │ Analyzer                   │  1. Normalize + parse sender domain
 │ (src/lib/analyzer.js)      │  2. Extract entities/claims from body
 │                            │  3. Score domain ↔ content correlation
 │                            │  4. Apply heuristic risk signals
 │                            │  5. Emit verdict + reasons
 └────────────┬───────────────┘
              │  { risk, score, reasons[] }
              ▼
 ┌────────────────────────────┐
 │ Alert banner + popup       │  Inline warning, with explanation
 └────────────────────────────┘
```

**Risk levels**

| Level | Meaning | Behavior |
|---|---|---|
| `safe` | Domain and content agree; no notable risk signals | No banner |
| `caution` | Weak correlation, or one or more soft signals present | Yellow banner, dismissible |
| `danger` | Strong mismatch, or multiple high-confidence signals | Red banner with reason list |

---

## Installation

### From the Chrome Web Store (recommended)

1. Open the [store listing](https://chromewebstore.google.com/detail/domain-content-validator/jagbdijnbgbohlggdnacpdlbnmmplkpl).
2. Click **Add to Chrome**, then **Add extension**.
3. Open your webmail and read a message — the extension activates automatically.

### From source (development build)

```bash
git clone https://github.com/Chrisb1368/domain-content-validator-chrome-extension.git
cd domain-content-validator-chrome-extension
```

Then in Chrome:

1. Go to `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the repository folder (the one containing `manifest.json`).
4. The extension appears in the toolbar. Pin it for easier access.

> Icons are not committed yet. If Chrome reports a manifest error about missing icons, add PNGs under `assets/icons/` and reference them from `manifest.json` — see [Manifest & permissions](#manifest--permissions).

---

## Repository status

**This repository currently contains documentation and a Manifest V3 scaffold — not the shipped v0.0.1 source.**

The scaffold exists so the project structure, build conventions, and module boundaries are settled before code lands. The next step is for the production source of the published extension to be pushed here.

Recommended first push:

```bash
git clone https://github.com/Chrisb1368/domain-content-validator-chrome-extension.git
cd domain-content-validator-chrome-extension
git checkout -b import/v0.0.1-source
# copy the shipped extension source into the working tree,
# reconciling it against the scaffold's layout where it makes sense
git add -A
git commit -m "chore: import shipped v0.0.1 extension source"
git push -u origin import/v0.0.1-source
```

Open a pull request against `main` so the import can be reviewed before it replaces the scaffold. Where the shipped source and the scaffold disagree on structure, **the shipped source wins** — update this README to match rather than reshaping working code.

---

## Project structure

```
domain-content-validator-chrome-extension/
├── manifest.json              # MV3 manifest: permissions, entry points, matches
├── src/
│   ├── background/
│   │   └── service-worker.js  # Event router, verdict cache, badge state
│   ├── content/
│   │   └── content-script.js  # DOM extraction + inline alert banner
│   ├── lib/
│   │   └── analyzer.js        # Pure analysis logic (no DOM, no chrome.* APIs)
│   └── popup/
│       ├── popup.html         # Toolbar popup markup
│       └── popup.js           # Popup state + settings wiring
├── assets/
│   └── icons/                 # 16/32/48/128 px extension icons (to be added)
├── LICENSE
└── README.md
```

**Layout rules**

- `src/lib/` stays free of `chrome.*` APIs and DOM access. It is pure, testable logic.
- `src/content/` is the only place that touches page DOM.
- `src/background/` is the only place that owns persistent state.
- Anything shared between contexts goes through `chrome.runtime` messaging, never globals.

---

## Development

### Prerequisites

- Google Chrome 102 or later (Manifest V3 service workers)
- Git
- A text editor. No build step, bundler, or `node_modules` is required for the current scaffold — the extension loads as plain ES modules.

### Everyday loop

1. Load the folder unpacked (see [Installation](#installation)).
2. Edit files.
3. Return to `chrome://extensions` and click the **reload** icon on the extension card.
4. Reload the webmail tab for content-script changes to take effect.

### Debugging

| What | Where |
|---|---|
| Service worker logs | `chrome://extensions` → **Service worker** link on the extension card |
| Content script logs | Page DevTools console, on the webmail tab |
| Popup logs | Right-click the toolbar icon → **Inspect popup** |
| Stored state | DevTools → Application → Storage → Extension storage |
| Manifest errors | `chrome://extensions` → **Errors** button on the card |

### Conventions

- ES modules (`import`/`export`), no transpilation.
- 2-space indentation, semicolons, single quotes.
- Message-passing payloads are plain JSON-serializable objects with a `type` field.
- Anything user-visible is a string constant near the top of its module, not inline.

---

## Manifest & permissions

The extension is Manifest V3. Every permission is requested for a specific, narrow reason — keep it that way, since the Web Store review process asks you to justify each one.

| Permission | Why it is needed |
|---|---|
| `storage` | Persist user preferences (enabled state, alert sensitivity, dismissed warnings) locally. |
| `activeTab` | Read the currently open message only when the user is actually viewing it. |
| Host permissions (webmail origins) | Inject the content script into supported mail clients so message content can be read in the page. |

**Supported hosts (scaffold defaults)**

```
https://mail.google.com/*
https://outlook.live.com/*
https://outlook.office.com/*
https://outlook.office365.com/*
https://mail.yahoo.com/*
```

Adding a host requires: a new entry in `content_scripts.matches`, a matching selector set in the content script's DOM adapter, and a Web Store review note explaining the addition.

**Icons.** Add `assets/icons/icon16.png`, `icon32.png`, `icon48.png`, and `icon128.png`, then wire them into `manifest.json` under both `icons` and `action.default_icon`. The 128 px icon is what the Web Store listing uses.

---

## Architecture

### Content script — `src/content/content-script.js`
Watches the message pane with a `MutationObserver`, and when a message opens, extracts the sender address, subject, visible body text, and every link's display text and real `href`. Extraction is isolated behind a per-provider adapter so supporting a new webmail client means adding selectors, not rewriting logic. It also renders the inline alert banner and reports dismissals back to the service worker.

### Service worker — `src/background/service-worker.js`
The coordinator. It receives extracted messages, calls the analyzer, caches verdicts by message fingerprint so re-opening a message is instant, updates the toolbar badge, and serves the popup's requests for current state. It holds no DOM references and does no parsing itself.

### Analyzer — `src/lib/analyzer.js`
Pure functions. Given a message payload, it returns `{ risk, score, reasons }`. Because it has no browser dependencies, it can be unit-tested directly in Node and reasoned about without loading the extension. New detection heuristics belong here, each as a small named function that contributes one scored signal.

### Popup — `src/popup/`
Shows the verdict for the message currently in view, the reasons behind it, and the extension's settings. It never analyzes anything itself; it asks the service worker.

### Message contract

```js
// content → background
{ type: 'ANALYZE_MESSAGE', payload: { sender, subject, body, links, fingerprint } }

// background → content
{ type: 'VERDICT', payload: { risk, score, reasons, fingerprint } }

// popup → background
{ type: 'GET_STATE' } | { type: 'SET_SETTING', payload: { key, value } }
```

---

## Privacy & data handling

The extension's value depends on being trustworthy with the mail it reads. The rules are not negotiable:

- **Local-only analysis.** Message content is evaluated in the browser. It is never sent to a server.
- **No external storage.** Message bodies, senders, and subjects are not persisted. Only verdict fingerprints (non-reversible hashes) and user settings are stored, via `chrome.storage.local`.
- **No third-party sharing or sale of data.**
- **No use unrelated to the core function.** No advertising, profiling, or creditworthiness determination.
- **No remotely hosted code**, as required by Manifest V3.

These match the disclosures on the Web Store listing. Any pull request that adds a network call, an analytics SDK, or a new storage key holding message content changes the extension's privacy posture and **must** be raised with the owner before it is merged — it also requires updating the store's data-safety declarations and the [privacy policy](https://www.timemotionstudy.com/private-policy).

---

## Release & publishing

1. **Bump the version** in `manifest.json`. Chrome requires a strictly higher version than the one currently published; the store rejects re-uploads at the same version.
2. **Test the unpacked build** against every supported webmail host.
3. **Tag the release**: `git tag v0.0.2 && git push --tags`.
4. **Package**: zip the contents of the repository root — the archive must contain `manifest.json` at its top level, not a nested folder.
   ```bash
   zip -r ../dcv-0.0.2.zip . -x '.git/*' '.github/*' '*.md' '.gitignore' '.DS_Store'
   ```
5. **Upload** in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) under the existing item (`jagbdijnbgbohlggdnacpdlbnmmplkpl`) — always update the existing item so current users receive it as an upgrade.
6. **Update the listing** if features changed: description, screenshots, and the permission justifications.
7. **Submit for review.** Review typically takes a few days; permission changes take longer.

---

## Contributing

External contributions are not being accepted — this is a proprietary codebase. For the working team:

**Branches**

- `main` is protected and always reflects what could ship.
- Work on `feat/<short-name>`, `fix/<short-name>`, or `chore/<short-name>`.

**Commits** follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.

**Pull requests** should state what changed and why, list the webmail clients tested against, include before/after screenshots for anything user-visible, and call out any change to permissions, storage, or network behavior explicitly in the description.

**Before opening a PR**

- [ ] Loads unpacked with no console errors and no manifest warnings
- [ ] Tested on every host in `content_scripts.matches`
- [ ] No new permissions without a written justification
- [ ] No message content added to storage or to any network request
- [ ] README updated if behavior, structure, or permissions changed

---

## Roadmap

- [ ] Import the shipped v0.0.1 source into this repository
- [ ] Add extension icons and commit them under `assets/icons/`
- [ ] Unit tests for `src/lib/analyzer.js`
- [ ] Options page for alert sensitivity and per-domain allowlisting
- [ ] Lookalike-domain detection (homoglyph and edit-distance checks against a known-brand list)
- [ ] Link target vs. display text mismatch scoring
- [ ] Additional webmail adapters (Proton Mail, Zoho, Fastmail)
- [ ] Localization beyond en-US
- [ ] CI: lint and manifest validation on pull requests

---

## Release history

| Version | Date | Notes |
|---|---|---|
| 0.0.1 | October 4, 2023 | Initial Chrome Web Store release. Domain–body correlation analysis and real-time alerts. |

---

## Support

- **Bugs and feature requests:** open an [issue](https://github.com/Chrisb1368/domain-content-validator-chrome-extension/issues)
- **Store listing contact:** montageapplication@gmail.com
- **Privacy policy:** https://www.timemotionstudy.com/private-policy

---

## Maintainers

| Role | Who |
|---|---|
| Owner & product | Christopher G. Benavides ([@Chrisb1368](https://github.com/Chrisb1368)) |

---

## License

Copyright © 2023–2026 Christopher G. Benavides. All rights reserved.

This source is published for visibility and collaboration. It is **not** open source: no license to use, copy, modify, or distribute this code is granted. See [LICENSE](LICENSE) for the full terms.
